import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export interface ProductToolbarProps {
  resultCount?: number;
}

/**
 * ProductToolbar
 * UI-only layout for the products listing toolbar: result count,
 * sorting, and view-switch (grid/list) placeholders. No real data or
 * sorting logic exists yet, so the count is optional (omitted rather
 * than shown as 0) and every control is honestly disabled.
 */
export function ProductToolbar({ resultCount }: ProductToolbarProps) {
  return (
    <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm text-text-secondary">
        {resultCount !== undefined
          ? `${resultCount.toLocaleString("fa-IR")} محصول`
          : STORE_NOT_READY_MESSAGE}
      </p>

      <div className="flex items-center gap-sm">
        <div className="flex items-center gap-xs">
          <Label htmlFor="product-sort" className="whitespace-nowrap text-caption">
            مرتب‌سازی
          </Label>
          <Select id="product-sort" disabled className="h-9 w-40 text-body-sm">
            <option>پیش‌فرض</option>
            <option>ارزان‌ترین</option>
            <option>گران‌ترین</option>
            <option>جدیدترین</option>
          </Select>
        </div>

        <div
          role="group"
          aria-label="نوع نمایش (به‌زودی)"
          className="flex items-center gap-1 rounded-md border border-border p-1"
        >
          <button
            type="button"
            disabled
            aria-pressed="true"
            aria-label="نمایش شبکه‌ای"
            className="rounded px-sm py-xs text-body-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            ▦
          </button>
          <button
            type="button"
            disabled
            aria-pressed="false"
            aria-label="نمایش فهرستی"
            className="rounded px-sm py-xs text-body-sm text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}
