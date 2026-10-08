"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FilterSection } from "./FilterSection";

/**
 * LaptopFilters
 * فیلترهای اختصاصی لپ‌تاپ — پردازنده، رم، حافظه، صفحه‌نمایش، گرافیک
 * مقادیر از attributes محصول (JSON) خونده میشن
 */
export function LaptopFilters() {
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
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-md">
      {/* پردازنده */}
      <FilterSection title="پردازنده">
        <Label htmlFor="filter-cpu" className="sr-only">
          پردازنده
        </Label>
        <Select
          id="filter-cpu"
          value={searchParams.get("cpu") || "all"}
          onChange={(e) => updateParam("cpu", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="Core i3">Core i3</option>
          <option value="Core i5">Core i5</option>
          <option value="Core i7">Core i7</option>
          <option value="Core i9">Core i9</option>
          <option value="Ryzen 5">Ryzen 5</option>
          <option value="Ryzen 7">Ryzen 7</option>
          <option value="Ryzen 9">Ryzen 9</option>
          <option value="Apple M1">Apple M1</option>
          <option value="Apple M2">Apple M2</option>
          <option value="Apple M3">Apple M3</option>
        </Select>
      </FilterSection>

      {/* رم */}
      <FilterSection title="رم">
        <Label htmlFor="filter-ram" className="sr-only">
          رم
        </Label>
        <Select
          id="filter-ram"
          value={searchParams.get("ram") || "all"}
          onChange={(e) => updateParam("ram", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="4GB">4GB</option>
          <option value="8GB">8GB</option>
          <option value="16GB">16GB</option>
          <option value="32GB">32GB</option>
          <option value="64GB">64GB</option>
        </Select>
      </FilterSection>

      {/* حافظه */}
      <FilterSection title="حافظه">
        <Label htmlFor="filter-storage" className="sr-only">
          حافظه
        </Label>
        <Select
          id="filter-storage"
          value={searchParams.get("storage") || "all"}
          onChange={(e) => updateParam("storage", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="256GB">256GB</option>
          <option value="512GB">512GB</option>
          <option value="1TB">1TB</option>
          <option value="2TB">2TB</option>
        </Select>
      </FilterSection>

      {/* صفحه‌نمایش */}
      <FilterSection title="صفحه‌نمایش">
        <Label htmlFor="filter-screen" className="sr-only">
          صفحه‌نمایش
        </Label>
        <Select
          id="filter-screen"
          value={searchParams.get("screen") || "all"}
          onChange={(e) => updateParam("screen", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="13">13 اینچ</option>
          <option value="14">14 اینچ</option>
          <option value="15.6">15.6 اینچ</option>
          <option value="16">16 اینچ</option>
          <option value="17">17 اینچ</option>
        </Select>
      </FilterSection>

      {/* کارت گرافیک */}
      <FilterSection title="کارت گرافیک">
        <Label htmlFor="filter-gpu" className="sr-only">
          کارت گرافیک
        </Label>
        <Select
          id="filter-gpu"
          value={searchParams.get("gpu") || "all"}
          onChange={(e) => updateParam("gpu", e.target.value)}
        >
          <option value="all">همه</option>
          <option value="Intel">Intel (گرافیک مجتمع)</option>
          <option value="NVIDIA GTX">NVIDIA GTX</option>
          <option value="NVIDIA RTX">NVIDIA RTX</option>
          <option value="AMD Radeon">AMD Radeon</option>
        </Select>
      </FilterSection>
    </div>
  );
}