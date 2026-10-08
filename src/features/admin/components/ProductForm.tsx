"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormMessage } from "@/components/ui/FormMessage";
import { ProductMediaSection } from "@/features/admin/components/ProductMediaSection";
import {
  createProductAction,
  updateProductFullAction,
  getCategoriesForSelectAction,
  getBrandsForSelectAction,
  type ProductFormData,
} from "@/lib/server/admin-actions";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialData?: ProductFormData;
}

const DEFAULT_DATA: ProductFormData = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  sku: "",
  brandId: "",
  categorySlug: "",
  price: 0,
  currency: "تومان",
  discountPrice: undefined,
  discountEndsAt: "",
  isNew: false,
  isBestSeller: false,
  isFastShipping: false,
  isTechnoTime: false,
  technoTimeEndsAt: "",
  isUsed: false,
  usedCondition: "NEW",
  usedDescription: "",
  inventoryCount: 0,
  isEnabled: true,
  warranty: "",
  isOriginal: true,
  attributes: {},
  images: [],
  seoTitle: "",
  seoDescription: "",
};

export function ProductForm({ mode, productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ لیست‌های dropdown
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  // ✅ state فرم
  const [formData, setFormData] = useState<ProductFormData>(initialData || DEFAULT_DATA);

  // ✅ state attributes (پویا)
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>(
    initialData?.attributes
      ? Object.entries(initialData.attributes).map(([key, value]) => ({ key, value }))
      : []
  );
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // ✅ بارگذاری دسته‌بندی‌ها و برندها
  useEffect(() => {
    async function load() {
      const [catResult, brandResult] = await Promise.all([
        getCategoriesForSelectAction(),
        getBrandsForSelectAction(),
      ]);
      if (catResult.success) setCategories(catResult.data);
      if (brandResult.success) setBrands(brandResult.data);
    }
    load();
  }, []);

  function updateField<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  // ✅ مدیریت attributes
  function addAttribute() {
    if (!newAttrKey.trim() || !newAttrValue.trim()) return;
    setAttributes((current) => [...current, { key: newAttrKey.trim(), value: newAttrValue.trim() }]);
    setNewAttrKey("");
    setNewAttrValue("");
  }

  function removeAttribute(index: number) {
    setAttributes((current) => current.filter((_, i) => i !== index));
  }

  // ✅ تبدیل slug از عنوان
  function generateSlug() {
    if (!formData.title) return;
    const slug = formData.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    updateField("slug", slug);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // ✅ آماده کردن attributes
    const attributesObject: Record<string, string> = {};
    for (const attr of attributes) {
      attributesObject[attr.key] = attr.value;
    }

    const submitData: ProductFormData = {
      ...formData,
      attributes: attributesObject,
      // عکس‌ها دیگه از فرم نمیان — از Media Library میان
      images: [],
    };

    let result;
    if (mode === "create") {
      result = await createProductAction(submitData);
    } else {
      if (!productId) {
        setError("شناسه محصول یافت نشد.");
        setIsSubmitting(false);
        return;
      }
      result = await updateProductFullAction(productId, submitData);
    }

    if (result.success) {
      // ✅ بعد از ساخت محصول جدید، برو به صفحه‌ی Edit
      // تا ادمین بتونه عکس‌ها رو اضافه کنه
      if (mode === "create" && result.data?.id) {
        router.push(`/admin/products/${result.data.id}/edit`);
      } else {
        router.push("/admin/products");
      }
    } else {
      setError(result.error || "خطا در ذخیره محصول.");
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormMessage variant="error">{error}</FormMessage>}

      {/* ========================================== */}
      {/* اطلاعات پایه */}
      {/* ========================================== */}
      <Card className="p-6">
        <h3 className="text-h4 font-semibold text-text-primary mb-4 border-b border-border pb-2">
          📝 اطلاعات پایه
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان محصول *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="مثلاً: گوشی سامسونگ گلکسی S24"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="samsung-galaxy-s24"
                required
                dir="ltr"
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSlug}
                disabled={isSubmitting || !formData.title}
              >
                تولید از عنوان
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              فقط حروف کوچک انگلیسی، اعداد و خط تیره
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">کد SKU (اختیاری)</Label>
            <Input
              id="sku"
              value={formData.sku || ""}
              onChange={(e) => updateField("sku", e.target.value)}
              placeholder="SKU-12345"
              dir="ltr"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categorySlug">دسته‌بندی</Label>
              <Select
                id="categorySlug"
                value={formData.categorySlug || ""}
                onChange={(e) => updateField("categorySlug", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- انتخاب کنید --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandId">برند</Label>
              <Select
                id="brandId"
                value={formData.brandId || ""}
                onChange={(e) => updateField("brandId", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- انتخاب کنید --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">توضیح کوتاه</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription || ""}
              onChange={(e) => updateField("shortDescription", e.target.value)}
              placeholder="توضیح مختصر (۱-۲ خط)"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات کامل</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="توضیحات کامل محصول"
              rows={5}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* قیمت و موجودی */}
      {/* ========================================== */}
      <Card className="p-6">
        <h3 className="text-h4 font-semibold text-text-primary mb-4 border-b border-border pb-2">
          💰 قیمت و موجودی
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">قیمت * ({formData.currency})</Label>
              <Input
                id="price"
                inputMode="numeric"
                dir="ltr"
                value={formData.price}
                onChange={(e) => updateField("price", Number(e.target.value) || 0)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryCount">موجودی *</Label>
              <Input
                id="inventoryCount"
                inputMode="numeric"
                dir="ltr"
                value={formData.inventoryCount}
                onChange={(e) => updateField("inventoryCount", Number(e.target.value) || 0)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">واحد پول</Label>
              <Select
                id="currency"
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="تومان">تومان</option>
                <option value="ریال">ریال</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountPrice">قیمت با تخفیف (اختیاری)</Label>
              <Input
                id="discountPrice"
                inputMode="numeric"
                dir="ltr"
                value={formData.discountPrice ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField("discountPrice", val ? Number(val) : undefined);
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountEndsAt">پایان تخفیف (اختیاری)</Label>
              <Input
                id="discountEndsAt"
                type="datetime-local"
                value={formData.discountEndsAt || ""}
                onChange={(e) => updateField("discountEndsAt", e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty">گارانتی</Label>
            <Input
              id="warranty"
              value={formData.warranty || ""}
              onChange={(e) => updateField("warranty", e.target.value)}
              placeholder="مثلاً: ۱۸ ماه گارانتی شرکتی"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* وضعیت‌ها */}
      {/* ========================================== */}
      <Card className="p-6">
        <h3 className="text-h4 font-semibold text-text-primary mb-4 border-b border-border pb-2">
          🏷️ وضعیت محصول
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CheckboxField
            id="isEnabled"
            label="فعال (نمایش در سایت)"
            checked={formData.isEnabled}
            onChange={(v) => updateField("isEnabled", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isNew"
            label="جدید"
            checked={formData.isNew}
            onChange={(v) => updateField("isNew", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isBestSeller"
            label="پرفروش"
            checked={formData.isBestSeller}
            onChange={(v) => updateField("isBestSeller", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isFastShipping"
            label="ارسال سریع"
            checked={formData.isFastShipping}
            onChange={(v) => updateField("isFastShipping", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isTechnoTime"
            label="تکنو تایم"
            checked={formData.isTechnoTime}
            onChange={(v) => updateField("isTechnoTime", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isOriginal"
            label="اصالت کالا"
            checked={formData.isOriginal}
            onChange={(v) => updateField("isOriginal", v)}
            disabled={isSubmitting}
          />
          <CheckboxField
            id="isUsed"
            label="کارکرده"
            checked={formData.isUsed}
            onChange={(v) => updateField("isUsed", v)}
            disabled={isSubmitting}
          />
        </div>

        {formData.isTechnoTime && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="technoTimeEndsAt">پایان تکنو تایم</Label>
            <Input
              id="technoTimeEndsAt"
              type="datetime-local"
              value={formData.technoTimeEndsAt || ""}
              onChange={(e) => updateField("technoTimeEndsAt", e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}

        {formData.isUsed && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usedCondition">وضعیت کارکرده</Label>
              <Select
                id="usedCondition"
                value={formData.usedCondition || "NEW"}
                onChange={(e) => updateField("usedCondition", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="USED_LIKE_NEW">مثل نو</option>
                <option value="USED_GOOD">خوب</option>
                <option value="USED_FAIR">معمولی</option>
                <option value="REFURBISHED">بازسازی‌شده</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usedDescription">توضیحات کارکرده</Label>
              <Textarea
                id="usedDescription"
                value={formData.usedDescription || ""}
                onChange={(e) => updateField("usedDescription", e.target.value)}
                placeholder="جزئیات وضعیت کارکرده"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ========================================== */}
      {/* عکس‌ها (فقط توی Edit Mode) */}
      {/* ========================================== */}
      {mode === "edit" && productId ? (
        <ProductMediaSection productId={productId} />
      ) : (
        <Card className="p-6 border-2 border-dashed border-border">
          <div className="text-center py-4">
            <span className="text-4xl">📸</span>
            <p className="text-body font-medium text-text-primary mt-2">
              عکس‌ها بعد از ذخیره‌ی محصول فعال می‌شوند
            </p>
            <p className="text-caption text-text-secondary mt-1">
              ابتدا محصول را ذخیره کنید، سپس عکس‌ها را آپلود کنید.
            </p>
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/* مشخصات فنی (Attributes) */}
      {/* ========================================== */}
      <Card className="p-6">
        <h3 className="text-h4 font-semibold text-text-primary mb-4 border-b border-border pb-2">
          ⚙️ مشخصات فنی ({attributes.length})
        </h3>

        {attributes.length > 0 && (
          <div className="space-y-2 mb-4">
            {attributes.map((attr, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border border-border rounded-lg"
              >
                <span className="text-body-sm font-medium text-text-primary min-w-24">
                  {attr.key}:
                </span>
                <span className="flex-1 text-body-sm text-text-secondary">
                  {attr.value}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAttribute(index)}
                  disabled={isSubmitting}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="نام مشخصه (مثلاً: پردازنده)"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              placeholder="مقدار (مثلاً: Core i7)"
              value={newAttrValue}
              onChange={(e) => setNewAttrValue(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttribute}
            disabled={isSubmitting || !newAttrKey.trim() || !newAttrValue.trim()}
          >
            + افزودن مشخصه
          </Button>
        </div>
      </Card>

      {/* ========================================== */}
      {/* SEO */}
      {/* ========================================== */}
      <Card className="p-6">
        <h3 className="text-h4 font-semibold text-text-primary mb-4 border-b border-border pb-2">
          🔍 SEO
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">عنوان SEO</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle || ""}
              onChange={(e) => updateField("seoTitle", e.target.value)}
              placeholder="عنوان برای موتورهای جستجو"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">توضیحات SEO</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription || ""}
              onChange={(e) => updateField("seoDescription", e.target.value)}
              placeholder="توضیحات برای موتورهای جستجو"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* دکمه‌ها */}
      {/* ========================================== */}
      <div className="flex flex-wrap gap-3 sticky bottom-4 bg-background/95 backdrop-blur p-3 rounded-lg border border-border shadow-lg">
        <Button type="submit" variant="default" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? "در حال ذخیره..."
            : mode === "create"
            ? "✅ افزودن محصول و رفتن به عکس‌ها"
            : "✅ ذخیره تغییرات"}
        </Button>
        <Link href="/admin/products">
          <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>
            انصراف
          </Button>
        </Link>
      </div>
    </form>
  );
}

// ============================================================
// کامپوننت کمکی Checkbox
// ============================================================
function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  );
}