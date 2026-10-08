import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";

/**
 * Next.js special file: shown automatically while this route segment
 * is loading (route transitions, streaming render). There is no real
 * data-fetching here yet, so this will typically only flash briefly —
 * it's connected now so the behavior is correct the moment real
 * product data (and real loading time) exists.
 *
 * Phase 11: uses ProductCardSkeleton (grid-shaped) instead of the
 * generic pulse rows — a more realistic preview of what's
 * actually loading in this specific context.
 *
 * Phase 15: the skeleton now mirrors the full page layout (sidebar +
 * toolbar + grid), not just the grid — previously only the product
 * cards were skeletoned, so the filter sidebar and toolbar popped in
 * abruptly once real content replaced the loading state. Structure and
 * breakpoints match products/page.tsx exactly so nothing reflows.
 */
export default function ProductsLoading() {
  return (
    <Container>
      <div role="status" aria-label="در حال بارگذاری محصولات" className="py-lg">
        <div className="mb-lg h-6 w-24 animate-pulse rounded bg-muted" />

        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <Card className="flex flex-col gap-md">
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-9 animate-pulse rounded bg-muted" />
              ))}
            </Card>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-md">
            <div className="flex items-center justify-between gap-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="h-9 w-40 animate-pulse rounded bg-muted" />
            </div>

            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
