import type { Product } from "@/features/products/types";
import { STORE_NOT_READY_MESSAGE } from "@/constants/messages";

export interface ProductMetaProps {
  product: Pick<Product, "sku" | "brand" | "category" | "tags" | "attributes">;
}

/**
 * ProductMeta
 * Presentation only: shows SKU/brand/category/tags/attributes as a
 * definition list, automatically hiding any field that isn't present —
 * nothing renders an empty "SKU: —" row for data that doesn't exist.
 * Shows its own honest note when every field is empty (always true
 * right now, since no product data exists).
 */
export function ProductMeta({ product }: ProductMetaProps) {
  const rows: { label: string; value: string }[] = [];

  if (product.sku) rows.push({ label: "کد کالا", value: product.sku });
  if (product.brand) rows.push({ label: "برند", value: product.brand });
  if (product.category) rows.push({ label: "دسته‌بندی", value: product.category });
  if (product.tags && product.tags.length > 0) {
    rows.push({ label: "برچسب‌ها", value: product.tags.join("، ") });
  }
  if (product.attributes) {
    for (const [key, value] of Object.entries(product.attributes)) {
      if (value) {
        rows.push({ label: key, value });
      }
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-body-sm text-text-secondary">
        {STORE_NOT_READY_MESSAGE}
      </p>
    );
  }

  return (
    <dl className="flex flex-col gap-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-md border-b border-border pb-sm last:border-0 last:pb-0"
        >
          <dt className="text-body-sm text-text-secondary">{row.label}</dt>
          <dd className="text-body-sm font-medium text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
