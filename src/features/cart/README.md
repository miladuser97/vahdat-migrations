# features/cart/

## Purpose
The shopping cart feature: shared cart state, cart-specific types, and
presentation components. No persistence, no pricing math, no checkout
— see `config.ts` and the Phase 18/19 reports for exactly why each is
deferred.

## Current contents (Phase 23)
- `CartProvider.tsx` — `CartProvider` + `useCart()`. The single source
  of truth for `items: CartItem[]`, mounted once in the root layout
  (`src/app/layout.tsx`, alongside `ThemeProvider`) so the cart page and
  the Header read the same state instead of each defining their own
  local array (which is what Phase 18 shipped). In-memory only — no
  localStorage/cookies/server sync. `addItem` (merges by `id`),
  `removeItem`, `updateQuantity` (below-1 removes the line), and
  `clearCart` — plain array operations, no pricing/inventory logic.
  Phase 22 connected all three of the latter to real UI (see below).
- `types.ts` — the `CartItem` type. Presentation-only shape (id,
  product reference, title, slug, quantity, optional price/currency).
  No real cart data exists yet.
- `components/CartView.tsx` — Client Component (Context requires one)
  that reads `useCart()` and renders the empty-cart state or the
  populated item-list + order-summary layout, passing
  `removeItem`/`updateQuantity`/`clearCart` down as callback props.
  Pulled out of `src/app/cart/page.tsx` so that file can stay a Server
  Component and keep exporting `metadata`.
- `components/CartItemRow.tsx` — one cart line: reuses `ProductImage`,
  `Price`, and the existing `QuantitySelector` rather than duplicating
  any of that markup. Phase 22: quantity changes and item removal are
  now real, via `onQuantityChange`/`onRemove` callback props (same
  forwarded-handler convention as `ActiveFilters`' `onRemove`) — not
  wired to `useCart()` directly, so this stays a plain, composable
  presentational component. Phase 23: both callbacks became optional —
  omitted, the row renders read-only (plain quantity text, no remove
  button) — so `features/checkout` can reuse this exact component for
  its order summary instead of a near-duplicate.
- `components/CartSummary.tsx` — the order summary panel used by the
  cart page. Reuses `Price` for both the subtotal and total rows so no
  pricing math is ever performed here; counts items (a length) but
  never sums prices. Phase 22: also has a real "پاک کردن سبد خرید"
  (clear cart) action via an `onClearCart` callback prop. Phase 23:
  that callback became optional too (so a read-only reuse was
  possible); as of Phase 28, `features/checkout`'s order review section
  no longer reuses this component as a block (it needs shipping/
  discount rows this component has no slot for) — it uses `Price`
  directly instead. `CartItemRow` is still reused by checkout, just not
  this one.
- `config.ts` — `CART_FEATURES`, six flags for capabilities still
  genuinely unbuilt (coupon code, gift card, reward points, shipping
  estimator, save for later, checkout entry). All `false` and none
  wired into any component — each needs a backend or a route
  (`/checkout`) this project doesn't have. `showQuantityControls`
  (Phase 18) was retired in Phase 22: quantity controls are now
  unconditional, real UI, not a togglable future capability — a flag
  that's always "on" isn't a real admin toggle.

## Where the cart page itself lives
`src/app/cart/page.tsx` (thin Server Component, keeps `metadata`) and
`src/app/cart/loading.tsx`. The actual state-aware rendering lives in
`CartView` above.

## Header integration
`src/components/layout/Header.tsx` reads `useCart()` and shows a real
item-count badge (sum of quantities) on the cart icon, plus an
`aria-label` reflecting the same count — added in Phase 22, reversing
Phase 19's deliberate "no badge yet" decision now that there's a real,
connected way for the count to become nonzero.

## Cart Hardening (Phase 36)
As of Phase 36, the `CartProvider` has been hardened to ensure data integrity:
- **Quantity Clamping**: `addItem` and `updateQuantity` now ensure that quantities are always positive integers (using `Math.max(1, Math.floor(quantity))`).
- **Removal Logic**: Setting quantity to less than 1 explicitly removes the item from the cart.
- **Client Boundary**: Cart data remains untrusted. Prices and totals are derived for display purposes only.

## What should NOT be placed here
- Any pricing calculation (subtotal sums, discounts, shipping, tax).
- Any persistence (localStorage, cookies, a database).
- Checkout/payment/order logic — a different, not-yet-started feature.
- New mutation functions or UI without a real, already-approved use —
  see `config.ts` for what's still deliberately unbuilt.
