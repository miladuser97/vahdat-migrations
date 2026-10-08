import type { ReactNode } from "react";

export interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * FilterSection
 * One responsibility: a titled group within the filter panel (e.g.
 * "دسته‌بندی", "قیمت"). Used repeatedly inside ProductFilters — the
 * internal composition unit that makes filters read well in both the
 * desktop sidebar and the mobile drawer (both narrow, vertical
 * contexts).
 */
export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-xs border-b border-border pb-md last:border-0 last:pb-0">
      <h3 className="text-body-sm font-medium text-text-primary">{title}</h3>
      {children}
    </div>
  );
}
