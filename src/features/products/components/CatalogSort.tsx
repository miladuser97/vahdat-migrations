"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export interface CatalogSortProps {
  resultCount?: number;
}

/**
 * CatalogSort
 * Functional client-side sorting that updates the URL.
 */
export function CatalogSort({ resultCount }: CatalogSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "default") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`/products?${params.toString()}`);
  };

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
          <Select
            id="product-sort"
            className="h-9 w-40 text-body-sm"
            value={searchParams.get("sort") || "default"}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="default">پیش‌فرض</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="title_asc">نام (الفبا)</option>
            <option value="title_desc">نام (معکوس)</option>
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
