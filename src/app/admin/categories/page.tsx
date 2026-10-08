"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  deleteCategoryAction,
} from "@/lib/server/admin-actions";
import {
  getCategoriesListAction,
  type CategoryListItem,
} from "@/lib/server/category-actions";
import { toPersianDigits } from "@/utils/text-utils";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ✅ جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  // ✅ بارگذاری دسته‌بندی‌ها با Server Action
  useEffect(() => {
    async function load() {
      try {
        const result = await getCategoriesListAction();
        if (result.success) {
          setCategories(result.data);
        } else {
          setLoadError(result.error || "خطا در بارگذاری دسته‌بندی‌ها.");
        }
      } catch {
        setLoadError("خطا در بارگذاری دسته‌بندی‌ها.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ✅ فیلتر و مرتب‌سازی
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === "visible") {
      result = result.filter((c) => c.visible);
    } else if (statusFilter === "hidden") {
      result = result.filter((c) => !c.visible);
    }

    if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    } else if (sortBy === "slug") {
      result.sort((a, b) => a.slug.localeCompare(b.slug));
    }

    return result;
  }, [categories, searchQuery, statusFilter, sortBy]);

  // ✅ حذف
  async function handleDelete(category: CategoryListItem) {
    const confirmed = window.confirm(
      `آیا از حذف دسته‌بندی «${category.title}» مطمئن هستید؟\n\nتوجه: اگه این دسته زیردسته یا محصول داشته باشه، حذف نمی‌شه.`
    );
    if (!confirmed) return;

    setError(undefined);
    setSuccessMessage(undefined);
    setBusyId(category.id);

    const result = await deleteCategoryAction(category.id);

    if (!result.success) {
      setError(result.error || "خطا در حذف دسته‌بندی.");
      setBusyId(null);
      return;
    }

    setCategories((current) => current.filter((c) => c.id !== category.id));
    setSuccessMessage(`دسته‌بندی «${category.title}» با موفقیت حذف شد.`);
    setBusyId(null);
    setTimeout(() => setSuccessMessage(undefined), 3000);
  }

  // ✅ آمار
  const stats = useMemo(() => {
    const total = categories.length;
    const visible = categories.filter((c) => c.visible).length;
    const hidden = total - visible;
    return { total, visible, hidden };
  }, [categories]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-text-secondary">در حال بارگذاری...</p>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-body-sm text-error">{loadError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold text-text-primary">
          مدیریت دسته‌بندی‌ها
        </h2>
        <Link href="/admin/categories/new">
          <Button variant="default" size="sm">
            + افزودن دسته‌بندی جدید
          </Button>
        </Link>
      </div>

      {/* پیام‌ها */}
      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-3 gap-sm">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل دسته‌بندی‌ها</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">فعال</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.visible)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">غیرفعال</p>
          <p className="text-h5 font-bold text-text-muted fa-num">
            {toPersianDigits(stats.hidden)}
          </p>
        </Card>
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در نام، slug یا توضیحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-sm sm:w-auto">
          <div className="flex-1 sm:w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه</option>
              <option value="visible">فقط فعال</option>
              <option value="hidden">فقط غیرفعال</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-40">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">پیش‌فرض</option>
              <option value="title">نام (الفبا)</option>
              <option value="slug">Slug</option>
            </Select>
          </div>
        </div>
      </Card>

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredCategories.length)} دسته‌بندی نمایش داده می‌شود
        {filteredCategories.length !== categories.length && (
          <span className="text-text-muted">
            {" "}
            (از {toPersianDigits(categories.length)})
          </span>
        )}
      </p>

      {/* لیست */}
      {filteredCategories.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            دسته‌بندی‌ای با این فیلترها یافت نشد.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const isBusy = busyId === category.id;

            return (
              <Card key={category.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h4 font-semibold text-text-primary truncate">
                      {category.title}
                    </h3>
                    <p className="text-sm text-text-secondary" dir="ltr">
                      {category.slug}
                    </p>
                    {category.description && (
                      <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-2">
                      <Badge variant={category.visible ? "success" : "muted"}>
                        {category.visible ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ms-2">
                    <Link href={`/admin/categories/${category.id}/edit`}>
                      <Button variant="outline" size="sm" className="w-full">
                        ✏️ ویرایش
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      onClick={() => handleDelete(category)}
                      disabled={isBusy}
                    >
                      {isBusy ? "..." : "🗑️ حذف"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}