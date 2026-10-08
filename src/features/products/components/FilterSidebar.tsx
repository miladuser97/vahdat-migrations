import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProductFilters } from "./ProductFilters";

export interface FilterSidebarProps {
  activeCount?: number;
  customFilters?: ReactNode;
}

/**
 * FilterSidebar
 * Desktop-only layout wrapper around ProductFilters.
 * Can now accept customFilters (CatalogFilters) to override the
 * default placeholder ProductFilters.
 */
export function FilterSidebar({ activeCount, customFilters }: FilterSidebarProps) {
  return (
    <Card>
      <h2 className="mb-md flex items-center gap-xs text-h4 font-semibold text-text-primary">
        فیلترها
        {!!activeCount && (
          <Badge variant="info" size="sm">
            {activeCount.toLocaleString("fa-IR")}
          </Badge>
        )}
      </h2>
      {customFilters || <ProductFilters />}
    </Card>
  );
}
