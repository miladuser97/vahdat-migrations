import type { ReactNode } from "react";
import type { Product } from "@/features/products/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";
import { ProductCard } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  /** Optional next action shown under the empty message (e.g. "clear
   * filters"). Omitted by default — every existing call site keeps
   * its current plain empty state unless it opts in. */
  emptyAction?: ReactNode;
}

/**
 * ProductGrid
 * One responsibility: lay out a list of products responsively, or show
 * an honest empty state (via the shared EmptyState component) when
 * there are none — which is always the case right now, since no real
 * product data exists yet.
 */
export function ProductGrid({
  products,
  emptyMessage = STORE_NOT_READY_MESSAGE,
  emptyAction,
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
