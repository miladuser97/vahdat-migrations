/**
 * A single cart line. Presentation-only shape — no persistence, no
 * pricing math, no stock/inventory relationship. `price`/`currency`
 * are optional for the same reason `Product`'s are: this project has
 * no real product data yet, so nothing here is ever populated from
 * real values today.
 */
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  slug: string;
  quantity: number;
  price?: number;
  currency?: string;
}
