# features/orders/

## Purpose
A shared model for what a future checkout submission would produce,
plus the one function that assembles it. No state, no persistence, no
backend, no API, no business logic. See `types.ts` and
`buildOrder.ts`'s own doc comments for exactly what's deferred and why.

## Current contents (Phase 32)
- `types.ts` — `Order`, `OrderCustomerInformation`, `OrderAddress`. A
  settled shape mirroring the existing checkout sections' fields
  exactly (`CustomerInformationSection`, `AddressSection`) and reusing
  `CartItem` from `features/cart` rather than redefining cart-item
  shape. No order id, timestamp, or status — those only make sense
  once a real backend creates an order, which is out of scope here.
- `buildOrder.ts` — the Order Assembly layer: one pure function,
  `buildOrder(checkoutData, items)`, that combines
  `CheckoutProvider`'s state and `CartProvider`'s items into an
  `Order`. This is the **only** place in the project that constructs
  an `Order` — every future phase that needs one must call this
  function rather than building one inline. Pure, deterministic, no
  side effects, no mutation of its inputs. Missing required string
  fields default to `""` (a type-shape transformation, not a
  validation judgment — see the file's own doc comment); optional
  fields pass through as `undefined`; `subtotal`/`shipping`/
  `discount`/`total` are always left `undefined` — no calculation of
  any kind happens here.

### Why Order Assembly is separated from checkout
`features/checkout` owns *collecting* the data as a person types/
selects it (`CheckoutProvider`, the four sections). `buildOrder` owns
the one moment that data needs to become a complete `Order`. Keeping
them in different features means either can change shape independently
— `CheckoutProvider` can gain a field, or `CheckoutView` can rearrange
sections, without `buildOrder`'s contract changing, and vice versa. It
also means this is the only place assembly logic can live, rather than
each future consumer (order review, submission, an eventual admin
order-detail view) rebuilding its own copy.

### Why it contains no business logic
Assembling data and judging/computing it are different
responsibilities. `buildOrder` never validates (that's
`features/checkout/validation.ts`, deliberately kept separate — this
function runs even on incomplete data) and never calculates shipping,
tax, or discounts (no logic anywhere in this project does that yet).
Mixing either into assembly would make this function's behavior depend
on business rules that don't exist yet, instead of it being a plain,
always-correct data reshape.

## Important: Trust Boundaries & Validation (Phase 36)
As of Phase 36, the project strictly distinguishes between **Raw State**, **Validated State**, and **Order Assembly**.

1.  **Raw Checkout State**: Held in `CheckoutProvider`. This is untrusted, partial data as entered by the user.
2.  **Validation Boundary**: `validateCheckout` in `features/checkout/validation.ts` is the formal gate. It ensures all required fields are present and valid before producing a `ValidatedCheckoutState`.
3.  **Order Assembly (`buildOrder`)**: 
    - Remains a pure transformation function.
    - It is **not** responsible for validation. 
    - It maps inputs to a settled `Order` shape.
    - Defaults missing fields to `""` to satisfy TypeScript, but this is a "garbage-in, garbage-out" layer.
4.  **Client-Side Limitation**: All frontend data (prices, totals, inventory) is client-controlled. Real backend integration must re-verify all commerce logic (prices, stock, calculation) upon submission.
5.  **Security**: No sensitive payment processing or persistence occurs in this foundation.

Validation remains the responsibility of `features/checkout/validation.ts`, and the two concerns are kept separate.
- Any *other* function, component, or hook that constructs an `Order` —
  `buildOrder` is the only one; reuse it instead of rebuilding one.
- Order creation, persistence, or backend/API integration.
- Fake order ids, timestamps, or statuses.
- Validation of any kind — belongs in `features/checkout/validation.ts`.
- Pricing/shipping/tax/discount calculation — `subtotal`/`shipping`/
  `discount`/`total` are optional, uncomputed fields, matching how
  `Price` shows "قیمت نامشخص" rather than a fabricated number.
