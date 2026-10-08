"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  updateProductAction,
  deleteProductAction,
  type AdminProduct,
} from "@/lib/server/admin-actions";
import { toPersianDigits } from "@/utils/text-utils";

interface RowState {
  price: string;
  inventoryCount: string;
  saving: boolean;
  error?: string;
}

function toRowState(product: AdminProduct): RowState {
  return {
    price: String(product.price),
    inventoryCount: String(product.inventoryCount),
    saving: false,
  };
}

interface AdminProductsTableProps {
  initialProducts: AdminProduct[];
  currentUserRole: string;
}

export function AdminProductsTable({
  initialProducts,
  currentUserRole,
}: AdminProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [rowState, setRowState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(initialProducts.map((p) => [p.id, toRowState(p)]))
  );

  // ✅ جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === "super_admin";

  // ✅ فیلتر و مرتب‌سازی
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "enabled") {
      result = result.filter((p) => p.isEnabled);
    } else if (statusFilter === "disabled") {
      result = result.filter((p) => !p.isEnabled);
    } else if (statusFilter === "lowStock") {
      result = result.filter((p) => p.inventoryCount <= 5);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock-asc") {
      result.sort((a, b) => a.inventoryCount - b.inventoryCount);
    } else if (sortBy === "stock-desc") {
      result.sort((a, b) => b.inventoryCount - a.inventoryCount);
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    }

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  function updateRow(id: string, patch: Partial<RowState>) {
    setRowState((current) => {
      const base = current[id];
      if (!base) return current;

      const merged: RowState = {
        price: patch.price ?? base.price,
        inventoryCount: patch.inventoryCount ?? base.inventoryCount,
        saving: patch.saving ?? base.saving,
        error: "error" in patch ? patch.error : base.error,
      };
      return { ...current, [id]: merged };
    });
  }

  async function handleSave(product: AdminProduct) {
    const row = rowState[product.id];
    if (!row) return;

    const price = Number(row.price);
    const inventoryCount = Number(row.inventoryCount);

    if (!Number.isFinite(price) || price < 0) {
      updateRow(product.id, { error: "قیمت نامعتبر است." });
      return;
    }
    if (!Number.isInteger(inventoryCount) || inventoryCount < 0) {
      updateRow(product.id, { error: "موجودی نامعتبر است." });
      return;
    }

    updateRow(product.id, { saving: true, error: undefined });
    const result = await updateProductAction(product.id, {
      price,
      inventoryCount,
    });

    if (!result.success) {
      updateRow(product.id, {
        saving: false,
        error: result.error || "ذخیره‌سازی با خطا مواجه شد.",
      });
      return;
    }

    const updatedProduct = result.data;
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? updatedProduct : p))
    );
    updateRow(product.id, { saving: false, error: undefined });
  }

  async function handleToggleEnabled(product: AdminProduct) {
    updateRow(product.id, { saving: true, error: undefined });
    const result = await updateProductAction(product.id, {
      isEnabled: !product.isEnabled,
    });

    if (!result.success) {
      updateRow(product.id, {
        saving: false,
        error: result.error || "به‌روزرسانی با خطا مواجه شد.",
      });
      return;
    }

    const updatedProduct = result.data;
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? updatedProduct : p))
    );
    updateRow(product.id, { saving: false });
  }

  // ✅ حذف محصول
  async function handleDelete(product: AdminProduct) {
    const confirmed = window.confirm(
      `آیا از حذف محصول «${product.title}» مطمئن هستید؟\n\n⚠️ این عمل قابل بازگشت نیست.\n\nتوجه: اگه محصول در سفارشی استفاده شده باشه، حذف نمی‌شه.`
    );
    if (!confirmed) return;

    setGlobalError(undefined);
    setDeletingId(product.id);

    const result = await deleteProductAction(product.id);

    if (!result.success) {
      setGlobalError(result.error || "خطا در حذف محصول.");
      setDeletingId(null);
      return;
    }

    setProducts((current) => current.filter((p) => p.id !== product.id));
    setDeletingId(null);
    router.refresh();
  }

  // ✅ آمار
  const stats = useMemo(() => {
    const total = products.length;
    const enabled = products.filter((p) => p.isEnabled).length;
    const disabled = total - enabled;
    const lowStock = products.filter((p) => p.inventoryCount <= 5).length;
    return { total, enabled, disabled, lowStock };
  }, [products]);

  if (products.length === 0) {
    return (
      <Card>
        <p className="text-body-sm text-text-secondary">
          هیچ محصولی یافت نشد. برای شروع، محصول جدید اضافه کنید.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* ✅ کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل محصولات</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">فعال</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.enabled)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">غیرفعال</p>
          <p className="text-h5 font-bold text-text-muted fa-num">
            {toPersianDigits(stats.disabled)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">موجودی کم (≤۵)</p>
          <p className="text-h5 font-bold text-amber-500 fa-num">
            {toPersianDigits(stats.lowStock)}
          </p>
        </Card>
      </div>

      {/* ✅ نوار جستجو و فیلتر */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در نام یا slug محصول..."
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
              <option value="enabled">فقط فعال</option>
              <option value="disabled">فقط غیرفعال</option>
              <option value="lowStock">موجودی کم</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-44">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="title">نام (الفبا)</option>
              <option value="price-asc">قیمت: کم → زیاد</option>
              <option value="price-desc">قیمت: زیاد → کم</option>
              <option value="stock-asc">موجودی: کم → زیاد</option>
              <option value="stock-desc">موجودی: زیاد → کم</option>
            </Select>
          </div>
        </div>
      </Card>

      {globalError && <FormMessage variant="error">{globalError}</FormMessage>}

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredProducts.length)} محصول نمایش داده می‌شود
        {filteredProducts.length !== products.length && (
          <span className="text-text-muted">
            {" "}
            (از {toPersianDigits(products.length)} محصول)
          </span>
        )}
      </p>

      {filteredProducts.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            محصولی با این فیلترها یافت نشد.
          </p>
        </Card>
      ) : (
        filteredProducts.map((product) => {
          const row = rowState[product.id];
          if (!row) return null;
          const isDeleting = deletingId === product.id;
          const isBusy = row.saving || isDeleting;

          return (
            <Card key={product.id} className="flex flex-col gap-sm">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${product.slug}`}
                    target="_blank"
                    className="truncate font-medium text-text-primary hover:text-brand-600 transition-colors"
                  >
                    {product.title}
                  </Link>
                  <p className="text-caption text-text-secondary" dir="ltr">
                    {product.slug}
                  </p>
                </div>
                <Badge variant={product.isEnabled ? "success" : "muted"}>
                  {product.isEnabled ? "فعال" : "غیرفعال"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-end gap-sm">
                <div className="flex flex-col gap-xs">
                  <label
                    className="text-caption text-text-secondary"
                    htmlFor={`price-${product.id}`}
                  >
                    قیمت ({product.currency})
                  </label>
                  <Input
                    id={`price-${product.id}`}
                    inputMode="numeric"
                    dir="ltr"
                    className="w-32"
                    value={row.price}
                    onChange={(e) =>
                      updateRow(product.id, { price: e.target.value })
                    }
                    disabled={isBusy}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label
                    className="text-caption text-text-secondary"
                    htmlFor={`stock-${product.id}`}
                  >
                    موجودی
                  </label>
                  <Input
                    id={`stock-${product.id}`}
                    inputMode="numeric"
                    dir="ltr"
                    className="w-24"
                    value={row.inventoryCount}
                    onChange={(e) =>
                      updateRow(product.id, { inventoryCount: e.target.value })
                    }
                    disabled={isBusy}
                  />
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleSave(product)}
                >
                  {row.saving ? "..." : "ذخیره"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleToggleEnabled(product)}
                >
                  {product.isEnabled ? "غیرفعال" : "فعال"}
                </Button>

                {/* ✅ دکمه‌ی ویرایش */}
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                  >
                    ✏️ ویرایش
                  </Button>
                </Link>

                {/* ✅ دکمه‌ی حذف (فقط super_admin) */}
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    disabled={isBusy}
                    onClick={() => handleDelete(product)}
                  >
                    {isDeleting ? "..." : "🗑️ حذف"}
                  </Button>
                )}
              </div>

              {row.error && <FormMessage variant="error">{row.error}</FormMessage>}
            </Card>
          );
        })
      )}
    </div>
  );
}