import { Badge } from "@/components/ui/Badge";
import type { StockStatus } from "@/features/products/types";

export interface StockBadgeProps {
  status?: StockStatus;
}

type BadgeVariant = "success" | "warning" | "error" | "info" | "muted";

const STOCK_CONFIG: Record<StockStatus, { label: string; variant: BadgeVariant }> = {
  in_stock: { label: "موجود", variant: "success" },
  low_stock: { label: "موجودی محدود", variant: "warning" },
  out_of_stock: { label: "ناموجود", variant: "error" },
  coming_soon: { label: "به‌زودی", variant: "info" },
  discontinued: { label: "متوقف‌شده", variant: "muted" },
};

/**
 * StockBadge
 * Presentation only, built on the existing Badge component so stock
 * status always looks consistent with every other badge in the app.
 * Renders nothing when status is unset (e.g. before a real product
 * with this info exists) rather than guessing or showing an empty
 * badge — call sites that need to show an explicit "not known yet"
 * message (like the product details placeholder page) do so
 * themselves alongside this component.
 */
export function StockBadge({ status }: StockBadgeProps) {
  if (!status) {
    return null;
  }

  const config = STOCK_CONFIG[status];

  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}
