import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

/**
 * Next.js special file: shown automatically while this route segment
 * is loading. There is no real data-fetching here yet, so this will
 * typically only flash briefly — connected now for the same reason as
 * cart/loading.tsx, products/loading.tsx, categories/loading.tsx.
 */
export default function CheckoutLoading() {
  return (
    <Container>
      <div role="status" aria-label="در حال بارگذاری تسویه‌حساب" className="py-lg">
        <div className="mb-lg h-6 w-24 animate-pulse rounded bg-muted" />

        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
          <div className="flex min-w-0 flex-1 flex-col gap-md">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex flex-col gap-xs">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>

          <div className="lg:w-80 lg:shrink-0">
            <Card className="flex flex-col gap-md">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
