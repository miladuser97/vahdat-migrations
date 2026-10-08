# features/checkout/

## Purpose
The checkout page's foundation. Customer information (Phase 24),
address (Phase 27), shipping (Phase 25), payment (Phase 26), and order
review (Phase 28) are all now real, working, structural sections,
backed by shared checkout state (Phase 30) and field validation
(Phase 31). `CheckoutView` also proves the Order Assembly layer
(`features/orders/buildOrder.ts`) works against this feature's real
state (Phase 32). Order creation, authentication, and persistence are
still not implemented. See `config.ts` and the Phase 23–32 reports for
exactly what's deferred and why.

## Current contents (Phase 32)
- `CheckoutProvider.tsx` — `CheckoutProvider` + `useCheckout()`. Shared,
  in-memory state for customer information, address, selected shipping
  method, and selected payment method — mounted only around
  `CheckoutView` (in `src/app/checkout/page.tsx`), not the root layout,
  since nothing outside `/checkout` needs it. Deliberately excludes
  cart items — those still come only from `features/cart`'s
  `CartProvider`. See the file's own doc comment.
- `validation.ts` — pure, UI-independent validation functions
  (`validateCustomerInformation`, `validateAddress`,
  `validateShippingMethod`, `validatePaymentMethod`) and one
  centralized `VALIDATION_MESSAGES.required` string, reused everywhere
  a field is required rather than retyped per field. Presence/required
  checks only — no format rules (mobile pattern, email shape, postal
  code digits) and no business-rule validation (inventory, prices,
  shipping cost, payment availability, coupons, taxes), none of which
  this phase asked for. See the file's own doc comment, including why
  the shipping/payment functions exist but aren't wired to any visible
  error UI yet.
- `config.ts` — `CHECKOUT_FEATURES`, seven flags: four section flags
  (customer information, address, shipping, payment — all `true`),
  `showTax`/`showOrderNotes` (both `false`, unwired), and
  `showReviewConfirmation` (`false`, unwired — see below). Coupon/
  gift-card/reward-points intentionally reuse the *existing*
  `CART_FEATURES` flags instead of being duplicated here — see the
  file's own doc comment.
- `components/CustomerInformationSection.tsx` — the real "اطلاعات
  مشتری" section: first name, last name, mobile number, email
  (optional). Built entirely from the existing form design system
  (`FormField`/`FormGroup`/`Input`) — no new form primitives. No
  `<form>` element, no submit button — see the file's own doc comment
  for why. Phase 30: fields read/write `CheckoutProvider`'s shared
  `customerInformation` (controlled inputs) instead of being
  uncontrolled DOM state nobody could read. Phase 31: calls
  `validateCustomerInformation` and shows a field's error only once
  that field has been blurred at least once (local `touched` state,
  not shared) — see the file's own doc comment for why blur, not a
  submit action, is the trigger.
- `components/AddressSection.tsx` — the real "آدرس" section: province,
  city, street address, postal code (optional), additional description
  (optional). Same form-design-system approach as
  `CustomerInformationSection` (`FormField`/`FormGroup`/`Input`, plus
  `Textarea` for the multi-line description). Province and city are
  plain text fields, not a linked dropdown pair — no province/city
  dependency, no hardcoded province list. See the file's own doc
  comment. Phase 30: same controlled-state wiring as
  `CustomerInformationSection`, against `CheckoutProvider`'s shared
  `address`. Phase 31: same blur-triggered validation display, via
  `validateAddress`.
- `components/ShippingSection.tsx` — the real "ارسال" section: six
  static placeholder shipping methods as an accessible radio group
  (`RadioGroup`/`RadioOption`). Phase 30: selection now reads/writes
  `CheckoutProvider`'s shared `shippingMethod` (controlled
  `checked`/`onChange`, replacing the earlier uncontrolled
  `defaultChecked`); the pre-selected first option is preserved via a
  render-time fallback, not an effect — see the file's own doc comment.
- `components/PaymentSection.tsx` — the real "پرداخت" section: five
  static placeholder payment methods (online payment, card-to-card,
  cash on delivery, wallet, installment), same
  `RadioGroup`/`RadioOption` pattern as shipping. Selecting a method
  creates no order, contacts no gateway, and runs no validation — see
  the file's own doc comment. Phase 30: same controlled-state wiring as
  `ShippingSection`, against `CheckoutProvider`'s shared
  `paymentMethod`.
- `components/OrderReviewSection.tsx` — the real "بازبینی سفارش"
  section, at the end of the checkout flow: the item list (reusing
  `CartItemRow`'s read-only mode), subtotal and final total (via
  `Price` directly — not `CartSummary`, which has no slot for the rows
  below and is shared with `/cart`), plus honest placeholder text rows
  for shipping and discount (not flag-gated — the brief asked for these
  two specifically to exist now). Receives `items` as a prop from
  `CheckoutView` rather than reading `useCart()` itself. See the file's
  own doc comment.
- `components/CheckoutSectionPlaceholder.tsx` — the shared "this
  section isn't built yet" card. All three of the original Phase 23
  placeholder sections have now graduated out of it (Phases 24–26), so
  it's currently dormant for those — but Phase 29 gave it one more
  active use: the hidden "بازبینی و تأیید نهایی سفارش" area below (see
  next entry), so it's not fully dormant.
- `components/CheckoutView.tsx` — reads `useCart()` directly (no
  duplicated cart state anywhere) and is the sole place `items` is
  read; `OrderReviewSection` receives it as a prop. The four form
  sections do NOT receive their checkout-state values as props from
  here — each calls `useCheckout()` directly (see `CheckoutProvider.tsx`
  and each section's own doc comment for why). Empty cart → the same
  empty-state pattern as `/cart`. Non-empty → the four flagged sections
  (customer information → address → shipping → payment) and
  `OrderReviewSection` in the sidebar, plus — below both columns, full
  width — a currently-hidden "بازبینی و تأیید نهایی سفارش" area gated by
  `showReviewConfirmation` (reuses `CheckoutSectionPlaceholder`, no new
  component, no button/interaction of its own). Phase 32: also calls
  `useCheckout()` itself (in addition to the sections each calling it)
  and passes both that state and `items` into
  `features/orders/buildOrder.ts` — proving the Order Assembly layer
  works against real, live state. The result is an intentionally unused
  local variable: no console output, no debug panel, no UI change. See
  the component's own doc comment and `features/orders/README.md`.

## Where the checkout page itself lives
`src/app/checkout/page.tsx` (thin Server Component, keeps `metadata`)
and `src/app/checkout/loading.tsx`. The actual cart-state-aware
rendering lives in `CheckoutView` above.

## Order data model
`src/features/orders/types.ts` (a separate feature folder) now holds
the `Order` shape a future checkout submission would produce —
customer information, address, shipping/payment method, cart items,
and totals. It's a type only: nothing in `features/checkout` constructs
one, holds one, or reads one. See that folder's own README.

## What should NOT be placed here
- Form submission logic for customer information or address — the
  fields and their required-field validation exist (Phase 31); wiring
  a submission up to them is still explicitly a later phase (see each
  section's own doc comment).
- Format validation (mobile-number pattern, email shape, postal-code
  digits), address lookup, autocomplete, maps, or GPS — `validation.ts`
  only checks presence/required-ness, exactly as scoped; `AddressSection`
  is plain text fields only; see both files' own doc comments.
- Any shipping cost calculation, delivery estimation, or carrier/API
  integration — `ShippingSection` is a static list only; see its own
  doc comment.
- Any payment gateway integration, transaction/verification logic, or
  order creation — `PaymentSection` is a static list only; see its own
  doc comment. A payment method selected in the browser must never be
  trusted as final — any future backend has to verify it independently.
- Any pricing/shipping/tax/discount calculation — `OrderReviewSection`
  shows subtotal/total via `Price` exactly as the cart page does, and
  honest placeholder text for shipping/discount, never a computed
  number for either.
- Any persistence, order creation, or payment gateway integration.
- A duplicate copy of cart state — always read it via `useCart()` in
  `CheckoutView`, passed down as a prop from there.
- Accounts, guest-checkout logic, an address book, or saved/multiple
  addresses — none of that exists yet; `AddressSection` only asks for
  the fields it needs today, once, per checkout.
- A second implementation that assembles `CheckoutProvider`'s state +
  cart items into an `Order` — that already exists
  (`features/orders/buildOrder.ts`, Phase 32) and is the only place
  that should. `CheckoutView` calls it to prove it works; it doesn't
  reimplement it. See `features/orders/README.md`.
- A button, real or disabled, for "بازبینی و تأیید نهایی سفارش" — that
  area must stay a title-only placeholder until real order submission
  exists.

## Note on the cart → checkout entry point
`CART_FEATURES.showCheckoutEntry` (in `features/cart/config.ts`) is
still `false` and still unwired — building out `/checkout`'s sections
doesn't include adding a "proceed to checkout" link from the cart page.
That's a deliberate, separate decision left for an explicit future
phase rather than assumed here.
