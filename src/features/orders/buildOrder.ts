import type { CartItem } from "@/features/cart/types";
import type { Order, OrderAddress, OrderCustomerInformation } from "./types";

/**
 * The subset of CheckoutProvider's state this function needs — only
 * the four data fields, not its updater functions. Kept as its own
 * small type (not `CheckoutContextValue` from CheckoutProvider)
 * so this function's dependency surface is just data, independent of
 * however the provider's API is shaped or renamed later.
 */
export interface CheckoutData {
  customerInformation: Partial<OrderCustomerInformation>;
  address: Partial<OrderAddress>;
  shippingMethod: string | undefined;
  paymentMethod: string | undefined;
}

/**
 * buildOrder
 * The Order Assembly layer: the ONE place that combines checkout state
 * (CheckoutProvider) and cart items (CartProvider) into an `Order`.
 * Future phases that need an assembled Order call this — they must not
 * rebuild one inline elsewhere.
 *
 * Pure, deterministic, side-effect free: same inputs always produce an
 * equal (by value) new object; nothing is read from or written to any
 * provider, storage, or browser API; `checkoutData`/`items` are never
 * mutated. A new object is always returned; `items` is passed through
 * by reference (not copied) since it's never mutated.
 *
 * Why this exists separately from CheckoutProvider/CheckoutView: those
 * own *collecting* the data (typing, selecting) as it happens; this
 * owns the one moment that data needs to become a complete `Order`
 * shape. Keeping them apart means CheckoutProvider can gain new fields
 * or CheckoutView can rearrange sections without this function's
 * contract changing, and vice versa.
 *
 * Why it has no business logic: assembling data and judging/computing
 * it are different responsibilities. This function does not:
 * - generate an id, timestamp, or status (an `Order` has none — see
 *   types.ts's own doc comment for why)
 * - validate anything (that's `validation.ts`, deliberately separate —
 *   this function runs even on incomplete data)
 * - calculate shipping, tax, or discounts (`subtotal`/`shipping`/
 *   `discount`/`total` are left `undefined`, same honest-fallback
 *   convention as `Price`)
 * - call an API, touch storage, or read any browser API
 *
 * `customerInformation`/`address` are `Partial` in CheckoutProvider
 * (nothing is required until validated), but `Order` requires plain
 * strings. Missing required fields default to `""` here — a type-shape
 * transformation, not a validation judgment; this function has no
 * opinion on whether `""` is "acceptable", it just conforms to the
 * shape. Optional fields (`email`, `postalCode`,
 * `additionalDescription`) pass through as `undefined` rather than
 * being defaulted, since `Order` already allows that for them.
 *
 * Security note: this is an in-memory data transformation only, never
 * a security boundary — nothing here is trusted, enforced, or sent
 * anywhere. There is still no submission for its result to reach.
 */
export function buildOrder(checkoutData: CheckoutData, items: CartItem[]): Order {
  return {
    customerInformation: {
      firstName: checkoutData.customerInformation.firstName ?? "",
      lastName: checkoutData.customerInformation.lastName ?? "",
      mobileNumber: checkoutData.customerInformation.mobileNumber ?? "",
      email: checkoutData.customerInformation.email,
    },
    address: {
      province: checkoutData.address.province ?? "",
      city: checkoutData.address.city ?? "",
      streetAddress: checkoutData.address.streetAddress ?? "",
      postalCode: checkoutData.address.postalCode,
      additionalDescription: checkoutData.address.additionalDescription,
    },
    shippingMethod: checkoutData.shippingMethod ?? "",
    paymentMethod: checkoutData.paymentMethod ?? "",
    items,
  };
}
