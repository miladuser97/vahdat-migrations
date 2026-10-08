"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormMessage } from "@/components/ui/FormMessage";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
  toggleCouponActiveAction,
  type AdminCoupon,
} from "@/lib/server/admin-actions";
import { toPersianDigits } from "@/utils/text-utils";

interface AdminCouponsTableProps {
  initialCoupons: AdminCoupon[];
  currentUserRole: string;
}

interface FormState {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minimumOrder: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  expiresAt: string;
  isAutoApplied: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrder: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
  isAutoApplied: false,
};

export function AdminCouponsTable({
  initialCoupons,
  currentUserRole,
}: AdminCouponsTableProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  // ✅ جستجو، فیلتر و مرتب‌سازی
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === "super_admin";

  // ✅ فیلتر و مرتب‌سازی
  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === "active") {
      result = result.filter((c) => c.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((c) => !c.isActive);
    } else if (statusFilter === "expired") {
      const now = new Date();
      result = result.filter((c) => c.expiresAt && new Date(c.expiresAt) < now);
    }

    if (typeFilter === "percentage") {
      result = result.filter((c) => c.discountType === "percentage");
    } else if (typeFilter === "fixed") {
      result = result.filter((c) => c.discountType === "fixed");
    } else if (typeFilter === "auto") {
      result = result.filter((c) => c.isAutoApplied);
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "code") {
      result.sort((a, b) => a.code.localeCompare(b.code));
    } else if (sortBy === "discount-desc") {
      result.sort((a, b) => b.discountValue - a.discountValue);
    } else if (sortBy === "usage-desc") {
      result.sort((a, b) => b.usedCount - a.usedCount);
    }

    return result;
  }, [coupons, searchQuery, statusFilter, typeFilter, sortBy]);

  // ✅ آمار
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const now = new Date();
    const expired = coupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < now).length;
    const auto = coupons.filter((c) => c.isAutoApplied).length;
    return { total, active, expired, auto };
  }, [coupons]);

  // ✅ کپی کد
  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore
    }
  }

  function openCreateForm() {
    setFormData(EMPTY_FORM);
    setError(undefined);
    setSuccessMessage(undefined);
    setMode("create");
    setEditingId(null);
  }

  function openEditForm(coupon: AdminCoupon) {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType as "percentage" | "fixed",
      discountValue: String(coupon.discountValue),
      minimumOrder: coupon.minimumOrder ? String(coupon.minimumOrder) : "",
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "",
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
        : "",
      isAutoApplied: coupon.isAutoApplied,
    });
    setError(undefined);
    setSuccessMessage(undefined);
    setMode("edit");
    setEditingId(coupon.id);
  }

  function closeForm() {
    setMode("list");
    setEditingId(null);
    setError(undefined);
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSuccessMessage(undefined);

    const discountValue = Number(formData.discountValue);
    if (!formData.code.trim() || formData.code.trim().length < 3) {
      setError("کد کوپن باید حداقل ۳ کاراکتر باشد.");
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError("مقدار تخفیف نامعتبر است.");
      return;
    }
    if (formData.discountType === "percentage" && discountValue > 100) {
      setError("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.");
      return;
    }

    setBusy(true);

    const payload = {
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue,
      minimumOrder: formData.minimumOrder ? Number(formData.minimumOrder) : undefined,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
      expiresAt: formData.expiresAt || undefined,
      isAutoApplied: formData.isAutoApplied,
    };

    let result;
    if (mode === "create") {
      result = await createCouponAction({
        ...payload,
        code: formData.code.trim(),
      });
    } else if (editingId) {
      result = await updateCouponAction(editingId, payload);
    } else {
      setBusy(false);
      return;
    }

    if (!result.success) {
      setError(result.error || "خطا در ذخیره‌سازی.");
      setBusy(false);
      return;
    }

    if (mode === "create") {
      setCoupons((current) => [result.data, ...current]);
      setSuccessMessage("کوپن با موفقیت ایجاد شد.");
    } else {
      setCoupons((current) =>
        current.map((c) => (c.id === result.data.id ? result.data : c))
      );
      setSuccessMessage("کوپن با موفقیت به‌روزرسانی شد.");
    }

    setBusy(false);
    closeForm();
  }

  async function handleToggle(coupon: AdminCoupon) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusy(true);
    const result = await toggleCouponActiveAction(coupon.id);

    if (!result.success) {
      setError(result.error || "خطا در تغییر وضعیت.");
      setBusy(false);
      return;
    }

    setCoupons((current) =>
      current.map((c) =>
        c.id === coupon.id ? { ...c, isActive: result.data.isActive } : c
      )
    );
    setSuccessMessage("وضعیت کوپن تغییر یافت.");
    setBusy(false);
  }

  async function handleDelete(coupon: AdminCoupon) {
    if (!window.confirm(`آیا از حذف کوپن «${coupon.code}» مطمئن هستید؟`)) return;

    setError(undefined);
    setSuccessMessage(undefined);
    setBusy(true);
    const result = await deleteCouponAction(coupon.id);

    if (!result.success) {
      setError(result.error || "خطا در حذف کوپن.");
      setBusy(false);
      return;
    }

    setCoupons((current) => current.filter((c) => c.id !== coupon.id));
    setSuccessMessage("کوپن حذف شد.");
    setBusy(false);
  }

  function formatDate(date: Date | null): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDiscount(coupon: AdminCoupon): string {
    if (coupon.discountType === "percentage") {
      return `${toPersianDigits(coupon.discountValue)}٪`;
    }
    return `${toPersianDigits(coupon.discountValue.toLocaleString("en-US"))} تومان`;
  }

  function isExpired(coupon: AdminCoupon): boolean {
    return coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
  }

  if (mode !== "list") {
    return (
      <Card className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h3 className="text-h4 font-bold text-text-primary">
            {mode === "create" ? "ایجاد کوپن جدید" : "ویرایش کوپن"}
          </h3>
          <Button variant="outline" size="sm" onClick={closeForm} disabled={busy}>
            ← بازگشت
          </Button>
        </div>

        {error && <FormMessage variant="error">{error}</FormMessage>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
          {mode === "create" && (
            <FormField label="کد کوپن" required helperText="فقط حروف انگلیسی و اعداد">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={formData.code}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                  dir="ltr"
                  placeholder="SUMMER2026"
                  disabled={busy}
                />
              )}
            </FormField>
          )}

          <FormField label="توضیحات (اختیاری)">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="مثلاً: تخفیف ویژه تابستان"
                disabled={busy}
              />
            )}
          </FormField>

          <FormGroup layout="responsive">
            <div className="sm:flex-1">
              <FormField label="نوع تخفیف" required>
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.discountType}
                    onChange={(e) =>
                      updateField("discountType", e.target.value as "percentage" | "fixed")
                    }
                    disabled={busy}
                  >
                    <option value="percentage">درصدی (٪)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </Select>
                )}
              </FormField>
            </div>
            <div className="sm:flex-1">
              <FormField label="مقدار تخفیف" required>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.discountValue}
                    onChange={(e) => updateField("discountValue", e.target.value)}
                    disabled={busy}
                  />
                )}
              </FormField>
            </div>
          </FormGroup>

          <FormGroup layout="responsive">
            <div className="sm:flex-1">
              <FormField label="حداقل مبلغ سفارش (اختیاری)">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.minimumOrder}
                    onChange={(e) => updateField("minimumOrder", e.target.value)}
                    disabled={busy}
                  />
                )}
              </FormField>
            </div>
            <div className="sm:flex-1">
              <FormField label="حداکثر تخفیف (اختیاری)">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.maxDiscount}
                    onChange={(e) => updateField("maxDiscount", e.target.value)}
                    disabled={busy}
                  />
                )}
              </FormField>
            </div>
          </FormGroup>

          <FormGroup layout="responsive">
            <div className="sm:flex-1">
              <FormField label="محدودیت تعداد کل (اختیاری)">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.usageLimit}
                    onChange={(e) => updateField("usageLimit", e.target.value)}
                    disabled={busy}
                  />
                )}
              </FormField>
            </div>
            <div className="sm:flex-1">
              <FormField label="محدودیت هر کاربر (اختیاری)">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.perUserLimit}
                    onChange={(e) => updateField("perUserLimit", e.target.value)}
                    disabled={busy}
                  />
                )}
              </FormField>
            </div>
          </FormGroup>

          <FormField label="تاریخ انقضا (اختیاری)">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="date"
                dir="ltr"
                value={formData.expiresAt}
                onChange={(e) => updateField("expiresAt", e.target.value)}
                disabled={busy}
              />
            )}
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAutoApplied}
              onChange={(e) => updateField("isAutoApplied", e.target.checked)}
              disabled={busy}
              className="h-4 w-4"
            />
            <span className="text-body-sm text-text-primary">
              اعمال خودکار (بدون نیاز به وارد کردن کد)
            </span>
          </label>

          <div className="flex gap-sm pt-md border-t border-border">
            <Button type="submit" variant="default" disabled={busy}>
              {busy ? "در حال ذخیره..." : mode === "create" ? "ایجاد کوپن" : "ذخیره تغییرات"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm} disabled={busy}>
              انصراف
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* ✅ کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل کوپن‌ها</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">فعال</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.active)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">منقضی</p>
          <p className="text-h5 font-bold text-amber-500 fa-num">
            {toPersianDigits(stats.expired)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">خودکار</p>
          <p className="text-h5 font-bold text-blue-500 fa-num">
            {toPersianDigits(stats.auto)}
          </p>
        </Card>
      </div>

      {/* ✅ نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در کد یا توضیحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-sm sm:w-auto">
          <div className="flex-1 sm:w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="expired">منقضی</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-36">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">همه‌ی انواع</option>
              <option value="percentage">درصدی</option>
              <option value="fixed">مبلغ ثابت</option>
              <option value="auto">خودکار</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-40">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="code">کد (الفبا)</option>
              <option value="discount-desc">بیشترین تخفیف</option>
              <option value="usage-desc">بیشترین استفاده</option>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-body-sm text-text-secondary">
          {toPersianDigits(filteredCoupons.length)} کوپن نمایش داده می‌شود
          {filteredCoupons.length !== coupons.length && (
            <span className="text-text-muted">
              {" "}
              (از {toPersianDigits(coupons.length)} کوپن)
            </span>
          )}
        </p>
        <Button variant="default" size="sm" onClick={openCreateForm}>
          + ایجاد کوپن جدید
        </Button>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      {filteredCoupons.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            {coupons.length === 0
              ? "هنوز هیچ کوپنی ساخته نشده است."
              : "کوپنی با این فیلترها یافت نشد."}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-sm">
          {filteredCoupons.map((coupon) => {
            const expired = isExpired(coupon);

            return (
              <Card
                key={coupon.id}
                className={`flex flex-col gap-sm ${expired ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                      className="font-bold text-text-primary hover:text-brand-600 transition-colors text-right"
                      dir="ltr"
                      title="کلیک برای کپی"
                    >
                      {coupon.code}
                      {copiedCode === coupon.code && (
                        <span className="text-caption text-success ms-2">✓ کپی شد</span>
                      )}
                    </button>
                    {coupon.description && (
                      <p className="text-caption text-text-secondary">
                        {coupon.description}
                      </p>
                    )}
                    <p className="text-caption text-text-muted mt-1 fa-num">
                      تاریخ ساخت: {formatDate(coupon.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={expired ? "destructive" : coupon.isActive ? "success" : "muted"}>
                      {expired ? "منقضی" : coupon.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                    {coupon.isAutoApplied && <Badge variant="info">خودکار</Badge>}
                    <Badge variant="default">{formatDiscount(coupon)}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-md text-caption text-text-secondary">
                  {coupon.minimumOrder && (
                    <span className="fa-num">
                      حداقل: {toPersianDigits(coupon.minimumOrder.toLocaleString("en-US"))} تومان
                    </span>
                  )}
                  {coupon.maxDiscount && (
                    <span className="fa-num">
                      حداکثر تخفیف: {toPersianDigits(coupon.maxDiscount.toLocaleString("en-US"))} تومان
                    </span>
                  )}
                  {coupon.usageLimit && (
                    <span className="fa-num">
                      استفاده: {toPersianDigits(coupon.usedCount)}/{toPersianDigits(coupon.usageLimit)}
                    </span>
                  )}
                  {coupon.perUserLimit && (
                    <span className="fa-num">
                      هر کاربر: {toPersianDigits(coupon.perUserLimit)}
                    </span>
                  )}
                  {coupon.expiresAt && (
                    <span className={`fa-num ${expired ? "text-destructive" : ""}`}>
                      انقضا: {formatDate(coupon.expiresAt)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-sm pt-sm border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(coupon)}
                    disabled={busy}
                  >
                    ✏️ ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(coupon)}
                    disabled={busy}
                  >
                    {coupon.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(coupon)}
                      disabled={busy}
                    >
                      🗑️ حذف
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}