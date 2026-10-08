"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FilterSection } from "./FilterSection";
import type { Category } from "@/features/categories/types";

interface CatalogFiltersProps {
  categories: Category[];
  brands: string[];
}

/**
 * CatalogFilters
 * Functional client-side filters that update the URL.
 * Works on both /products and /categories/[slug] — uses usePathname
 * to push to the correct current path.
 */
export function CatalogFilters({ categories, brands }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-md">
      {/* دسته‌بندی — فقط اگه categories داده شده */}
      {categories.length > 0 && (
        <FilterSection title="دسته‌بندی">
          <Label htmlFor="filter-category" className="sr-only">
            دسته‌بندی
          </Label>
          <Select
            id="filter-category"
            value={searchParams.get("category") || "all"}
            onChange={(e) => updateParam("category", e.target.value)}
          >
            <option value="all">همه‌ی دسته‌ها</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.title}
              </option>
            ))}
          </Select>
        </FilterSection>
      )}

      {/* برند */}
      <FilterSection title="برند">
        <Label htmlFor="filter-brand" className="sr-only">
          برند
        </Label>
        <Select
          id="filter-brand"
          value={searchParams.get("brand") || "all"}
          onChange={(e) => updateParam("brand", e.target.value)}
        >
          <option value="all">همه‌ی برندها</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>
      </FilterSection>

      {/* قیمت */}
      <FilterSection title="قیمت">
        <Label htmlFor="filter-price" className="sr-only">
          قیمت
        </Label>
        <Select
          id="filter-price"
          value={(() => {
            const min = searchParams.get("minPrice");
            const max = searchParams.get("maxPrice");
            if (!min && !max) return "all";
            return `${min || 0}-${max || ""}`;
          })()}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all") {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("minPrice");
              params.delete("maxPrice");
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
            } else {
              const [min, max] = value.split("-");
              const params = new URLSearchParams(searchParams.toString());
              if (min) params.set("minPrice", min);
              if (max) params.set("maxPrice", max);
              params.delete("page");
              router.push(`${pathname}?${params.toString()}`);
            }
          }}
        >
          <option value="all">همه‌ی قیمت‌ها</option>
          <option value="0-5000000">تا ۵ میلیون تومان</option>
          <option value="5000000-10000000">۵ تا ۱۰ میلیون تومان</option>
          <option value="10000000-20000000">۱۰ تا ۲۰ میلیون تومان</option>
          <option value="20000000-50000000">۲۰ تا ۵۰ میلیون تومان</option>
          <option value="50000000-">بیش از ۵۰ میلیون تومان</option>
        </Select>
      </FilterSection>

      {/* موجودی */}
      <FilterSection title="موجودی">
        <Label htmlFor="filter-availability" className="sr-only">
          موجودی
        </Label>
        <Select
          id="filter-availability"
          value={searchParams.get("inStock") || "all"}
          onChange={(e) => updateParam("inStock", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="true">فقط موجود</option>
          <option value="false">فقط ناموجود</option>
        </Select>
      </FilterSection>
    </div>
  );
}