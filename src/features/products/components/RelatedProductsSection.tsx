import { Section } from "@/components/layout/Section";
import { ProductGrid } from "./ProductGrid";
import type { Product } from "@/features/products/types";

export interface RelatedProductsSectionProps {
  products: Product[];
  title?: string;
}

/**
 * RelatedProductsSection
 * A titled Section wrapping `ProductGrid` (which already handles the
 * empty state — no separate check duplicated here). Used today for
 * "related products" on the product details page; designed to be
 * reused for any future titled product-collection block (e.g.
 * "recently viewed", "best sellers").
 */
export function RelatedProductsSection({
  products,
  title = "محصولات مرتبط",
}: RelatedProductsSectionProps) {
  return (
    <Section title={title}>
      <ProductGrid products={products} />
    </Section>
  );
}
