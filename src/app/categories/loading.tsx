import { Container } from "@/components/layout/Container";
import { CategoryCardSkeleton } from "@/features/categories/components/CategoryCardSkeleton";

/**
 * Next.js special file: shown automatically while this route segment
 * is loading. See src/app/products/loading.tsx for why this currently
 * only flashes briefly with no real data-fetching yet.
 *
 * Phase 12: uses CategoryCardSkeleton (shaped like the actual
 * CategoryShortcut grid this page now renders) instead of the generic
 * shape-matched skeleton instead of generic pulse rows — consistent
 * with Phase 11's ProductCardSkeleton.
 *
 * Phase 14: grid classes kept identical to the refined grid in
 * categories/page.tsx (same breakpoints and gaps) so the loading state
 * doesn't reflow the layout once real content replaces it.
 */
export default function CategoriesLoading() {
  return (
    <Container>
      <div
        role="status"
        aria-label="در حال بارگذاری دسته‌بندی‌ها"
        className="grid gap-md py-lg sm:grid-cols-2 sm:py-xl md:grid-cols-3 lg:grid-cols-3 lg:gap-lg"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <CategoryCardSkeleton key={index} />
        ))}
      </div>
    </Container>
  );
}
