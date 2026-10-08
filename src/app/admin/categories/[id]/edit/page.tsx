"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { updateCategoryAction, getCategoryByIdAction } from "@/lib/server/admin-actions";

interface CategoryData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  visible: boolean;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    order: 0,
    visible: true,
  });

  // ✅ بارگذاری اطلاعات دسته‌بندی
  useEffect(() => {
    async function loadCategory() {
      try {
        const result = await getCategoryByIdAction(categoryId);
        if (!result.success) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        const cat = result.data as CategoryData;
        setFormData({
          title: cat.title,
          slug: cat.slug,
          description: cat.description || "",
          order: cat.order,
          visible: cat.visible,
        });
        setIsLoading(false);
      } catch {
        setError("خطا در بارگذاری دسته‌بندی.");
        setIsLoading(false);
      }
    }
    loadCategory();
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await updateCategoryAction(categoryId, {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      order: formData.order,
      visible: formData.visible,
    });

    if (result.success) {
      router.push("/admin/categories");
    } else {
      setError(result.error || "خطا در ویرایش دسته‌بندی.");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-text-secondary">در حال بارگذاری...</p>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">دسته‌بندی یافت نشد.</p>
          <Link href="/admin/categories">
            <Button variant="outline" size="sm" className="mt-4">
              ← بازگشت
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-text-primary">
          ویرایش دسته‌بندی
        </h2>
        <Link href="/admin/categories">
          <Button variant="outline" size="sm">
            ← بازگشت
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl p-6">
        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان دسته‌بندی *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثلاً: گوشی‌های هوشمند"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">شناسه (slug) *</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="مثلاً: smartphones"
              required
              dir="ltr"
              disabled={isSubmitting}
            />
            <p className="text-xs text-text-secondary">
              شناسه یکتا برای آدرس دسته‌بندی. فقط حروف انگلیسی، اعداد و خط تیره.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات مختصر درباره این دسته‌بندی"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">ترتیب نمایش</Label>
            <Input
              id="order"
              name="order"
              inputMode="numeric"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
              placeholder="عدد کوچک‌تر = نمایش بالاتر"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible"
              name="visible"
              checked={formData.visible}
              onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              disabled={isSubmitting}
            />
            <Label htmlFor="visible" className="text-sm font-normal">
              نمایش در سایت
            </Label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "در حال ذخیره..." : "✅ ذخیره تغییرات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/categories")}
              disabled={isSubmitting}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}