import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FilterSection } from "./FilterSection";

/**
 * ProductFilters
 * UI-only filter controls — category, brand, price, and availability.
 * No filtering logic exists yet (there is no product data to filter),
 * so every control is honestly disabled rather than appearing
 * functional with nothing behind it.
 *
 * Phase 11 changes:
 * - Restructured from a horizontal 5-column grid to a vertical stack
 *   of FilterSection groups, since this now renders inside both the
 *   desktop FilterSidebar and the mobile FilterDrawer — both narrow,
 *   vertical contexts (the old horizontal grid assumed a full-width bar,
 *   which no longer matches how this is used).
 * - The "sorting" field was removed from here: it duplicated the sort
 *   control already in ProductToolbar. Filtering and sorting are
 *   different concerns and now live in exactly one place each.
 *
 * Each Label is visually hidden (sr-only): FilterSection's heading
 * already shows the same text to sighted users, but a real <label>
 * (not just a nearby heading) is still needed so screen readers
 * announce the correct accessible name for each control.
 */
export function ProductFilters() {
  return (
    <div
      aria-label="فیلترهای محصولات (به‌زودی فعال می‌شوند)"
      className="flex flex-col gap-md"
    >
      <FilterSection title="دسته‌بندی">
        <Label htmlFor="filter-category" className="sr-only">
          دسته‌بندی
        </Label>
        <Select id="filter-category" disabled>
          <option>همه‌ی دسته‌ها</option>
        </Select>
      </FilterSection>

      <FilterSection title="برند">
        <Label htmlFor="filter-brand" className="sr-only">
          برند
        </Label>
        <Select id="filter-brand" disabled>
          <option>همه‌ی برندها</option>
        </Select>
      </FilterSection>

      <FilterSection title="قیمت">
        <Label htmlFor="filter-price" className="sr-only">
          قیمت
        </Label>
        <Select id="filter-price" disabled>
          <option>همه‌ی قیمت‌ها</option>
        </Select>
      </FilterSection>

      <FilterSection title="موجودی">
        <Label htmlFor="filter-availability" className="sr-only">
          موجودی
        </Label>
        <Select id="filter-availability" disabled>
          <option>همه</option>
        </Select>
      </FilterSection>
    </div>
  );
}
