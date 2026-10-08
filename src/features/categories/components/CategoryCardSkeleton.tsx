import { Card } from "@/components/ui/Card";

/**
 * CategoryCardSkeleton
 * A pure-CSS skeleton shaped like CategoryShortcut (icon + title +
 * description rows) — the same "skeleton consistency" reasoning as
 * Phase 11's ProductCardSkeleton: more realistic than generic
 * generic pulse rows for this specific grid context.
 */
export function CategoryCardSkeleton() {
  return (
    <Card className="flex flex-col items-center gap-xs text-center">
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
    </Card>
  );
}
