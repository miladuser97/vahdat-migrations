import { Card } from "@/components/ui/Card";

/**
 * ProductCardSkeleton
 * A pure-CSS skeleton shaped like ProductCard (image + title + price
 * rows) — more realistic than generic pulse rows for this
 * specific grid context. Uses Tailwind's `animate-pulse`, a
 * functional loading affordance, not a decorative
 * "Animation".
 */
export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col gap-sm p-sm">
      <div className="aspect-square animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
    </Card>
  );
}
