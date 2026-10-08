# Tahririno — Phase 6 Report: Customer Account Area (Profile, Addresses, Orders)

**Scope:** Customer account area only. Payment, Checkout, Inventory, Notifications, Authentication, Authorization/RBAC, Admin, and `prisma/schema.prisma` were not modified — every server action this phase's new UI calls that lives in those domains (`getUserOrdersAction`, `getOrderAction`, `cancelOrderAction`, `initiatePaymentForOrder`) was reused exactly as-is, with zero edits to the files that define them.

---

## 1. Executive Summary

Before this phase, three of the customer account area's four sections were non-functional: `updateProfileAction` was a no-op stub that checked authentication and then did nothing; the addresses page permanently showed an empty state behind a disabled "add address" button, despite `addAddressAction`/`deleteAddressAction` already existing and working; and the orders page permanently showed an empty state regardless of whether the customer had any orders, despite `getUserOrdersAction`/`getOrderAction` already existing, already ownership-protected, and already used elsewhere (Phase 2's payment callback, Phase 4's admin area). There was no order-detail page at all.

This phase completed all four: a real profile-edit form wired to a now-fully-implemented `updateProfileAction`; full address CRUD including default-address support (a schema field, `Address.isDefault`, that nothing had ever set or read); a real orders list; and a new order-detail page that also lets a customer resume payment on a pending order or cancel one — both by calling existing, unmodified Phase 2 functions, not new payment/inventory logic. One genuinely dead file (`address-types.ts`, an unused type with zero importers) was found and deleted.

**What this report cannot claim:** as in every prior phase, nothing here has been confirmed by an actual compiler or test run — this sandbox still has no network access. Every claim is the result of manual, file-by-file, call-site tracing.

---

## 2. Objectives

Restated from your instruction: complete Profile (edit name/email, mobile only if safe), Addresses (full CRUD + default), Orders (real list), Order Details (owner-only, no payment secrets), Account UX (loading/empty/error/retry states, responsive, RTL), remove dead/duplicate account code, verify ownership/IDOR/authorization/validation, update/add meaningful tests — all without touching Payment/Checkout/Inventory/Notifications/Authentication/Authorization/Admin/Prisma unless absolutely required.

---

## 3. Every Issue Found

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| P6-1 | `updateProfileAction` authenticated the caller and then did nothing — the comment literally said "Logic to update user in DB using user.id" where the logic should have been. Confirmed by Phase 1's original audit, still true at the start of this phase. | `account-actions.ts` | **Critical** |
| P6-2 | Addresses page: "افزودن آدرس جدید" button was hardcoded `disabled`, and the page always rendered the empty state — `addAddressAction`/`deleteAddressAction` existed and worked, but nothing in the UI ever called them. | `account/addresses/page.tsx` | **Critical** |
| P6-3 | No way to update an existing address, list addresses (the page never called `prisma.address.findMany` at all), or set a default — `Address.isDefault` existed in the schema and was written nowhere, read nowhere. | (missing) | High |
| P6-4 | Orders page always rendered the empty state regardless of real order data — `getUserOrdersAction` existed, was already ownership-scoped, and was already used elsewhere in the app, but the customer-facing orders page never called it. | `account/orders/page.tsx` | **Critical** |
| P6-5 | No order-detail route existed at all. A customer had no way to see a single order's items, address, or status beyond the (fake) list. | (missing) | High |
| P6-6 | No customer-facing way to resume payment on a `pending_payment`/`payment_failed` order, or to cancel one — `startPaymentAction`/`cancelOrderAction` (and the checkout-side `initiatePaymentForOrder` wrapper) already existed and worked (Phase 2), but nothing outside the checkout flow itself called them. This was explicitly flagged as a known gap in Phase 2's own report. | (missing) | Medium |
| P6-7 | `src/features/account/address-types.ts` exported an `Address` interface with zero importers anywhere in the codebase — confirmed dead both before and independent of this phase's changes. | `features/account/address-types.ts` | Low — dead code, not a functional bug |
| P6-8 | The one existing test for the orders page (`OrdersHistoryPage.test.tsx`) rendered the page synchronously and asserted only the empty state — it would have needed rewriting regardless of what this phase built, since the page was always going to become an async, data-fetching Server Component. Not a pre-existing bug so much as a test that was inevitably going to need updating once the placeholder it tested was replaced. | `account/orders/__tests__/OrdersHistoryPage.test.tsx` | — |

---

## 4. Root Cause Analysis

- **P6-1 through P6-5** are the same "backend piece exists (or should exist), nothing connects it to a real page" pattern identified in every prior phase — here applied to the account area specifically. The comment left in `updateProfileAction` ("Logic to update user in DB using user.id") is a particularly direct artifact of this: a placeholder that was clearly intended to be filled in and never was.
- **P6-6** is a direct, named consequence of Phase 2's own scope boundary: Phase 2 built real payment initiation and reuse-ready wrapper functions but explicitly deferred "a UI path to resume a pending order" as out of scope at the time. This phase closes that gap using exactly the functions Phase 2 already built for it.
- **P6-7** is ordinary code drift — a type was defined in anticipation of an address feature, and when the address feature was eventually stubbed out (not really built), a different, ad hoc shape ended up being used instead (or, in this phase's case, a fresh `AccountAddress` interface was defined in `account-actions.ts` to match the Phase 4 admin-actions.ts convention), leaving the original untouched and unused.
- **P6-8** is a structural consequence of the page needing to become an async Server Component to fetch real data — not a defect in the original test's intent (which correctly tested the empty state that existed at the time), just something that couldn't survive the page's necessary rewrite unchanged.

---

## 5. Every Code Change

### `src/lib/server/account-actions.ts` — profile section completed, address section extended
- **`getProfileAction`** (new): returns the full profile including `email`, which the lightweight session object (`getAuthenticatedUser()`, `auth-utils.ts`, untouched) deliberately excludes. Re-verifies authentication server-side independently of the page-level guard, consistent with every prior phase's defense-in-depth pattern.
- **`updateProfileAction`** (fixed — P6-1): now actually validates (via `ProfileUpdateSchema`, see below) and persists `firstName`/`lastName`/`email`, checks email uniqueness against other accounts before saving, and returns the updated profile. Mobile number is deliberately excluded from what this action accepts or changes — see the extensive doc comment in the code and §9 below for the reasoning.
- **`getAddressesAction`** (new): lists the current user's addresses, most-recently-created first, default first.
- **`addAddressAction`** (extended): now accepts and validates a `title` field (previously hardcoded to `"آدرس جدید"` for every address), and automatically makes the very first address a customer saves their default — the only way `isDefault` could ever become `true`, since nothing else in the pre-existing code ever set it.
- **`updateAddressAction`** (new): ownership-checked (IDOR-protected, same pattern as the pre-existing `deleteAddressAction`) full update of an existing address.
- **`setDefaultAddressAction`** (new): ownership-checked; atomically unsets any other default and sets the requested one via `prisma.$transaction`.
- **`deleteAddressAction`** (extended, ownership check unchanged): now also promotes another address to default if the one just deleted was the default — otherwise deleting your default address would silently leave the account with no default at all.

### `src/features/account/validation.ts` — extended (Phase 3 file)
- Added `ProfileUpdateSchema = RegisterSchema.pick({ firstName: true, lastName: true, email: true })` and `validateProfileFields` — deriving profile validation from the exact same rules `RegisterSchema` already enforces at signup, not a second set of name/email rules. Zero changes to the existing Login/Register validation exports.

### New account UI
- **`ProfileForm.tsx`**: real form (name/email editable, mobile shown read-only with an explanatory helper text) wired to `updateProfileAction`, with field-level validation, loading state, and success/error feedback.
- **`AddressList.tsx`**: full CRUD UI — list, add, edit (same form, reused for both via a `mode` flag), delete (with a confirm prompt), set-default. Reuses `validateAddress` from `features/checkout/validation.ts` (Checkout-domain file) **by import only, zero edits to that file** — the same five address-field rules the checkout flow already enforces, not a second copy of them.
- **`OrdersList.tsx`**: read-only order summary cards (id, status badge, date, item count, total), each linking to its detail page. Deliberately has no client-side interactivity — kept as a plain Server-renderable presentational component since nothing on the list itself needs to mutate anything.
- **`OrderDetailActions.tsx`**: the one place this phase adds interactive order mutation — "پرداخت" (calls the existing `initiatePaymentForOrder`, Phase 2's checkout-submission service — the identical function the checkout page itself uses) and "لغو سفارش" (calls the existing `cancelOrderAction`, Phase 2, unmodified). Button visibility is status-gated: pay only for `pending_payment`/`payment_failed`; cancel only for `draft`/`pending_payment`; neither for `paid`/`processing`/`shipped`/`delivered`/`cancelled`/`expired`.
- **`features/orders/status-labels.ts`** (new, shared within the account feature): one Persian status-label/badge-variant map, used by both the orders list and the order-detail page — see §9 for why this isn't also wired into the Phase 4 admin table.

### New/rewritten routes
- **`account/profile/page.tsx`**: replaced the static placeholder with a real fetch (`getProfileAction`) + `<ProfileForm>`.
- **`account/addresses/page.tsx`**: replaced the static placeholder with a real fetch (`getAddressesAction`) + `<AddressList>`.
- **`account/orders/page.tsx`**: replaced the static placeholder with a real fetch (`getUserOrdersAction`, Phase 2, unmodified) + real empty/error/data states.
- **`account/orders/[id]/page.tsx`** (new route): order detail — see §10 for exactly what is and isn't exposed.

### Deleted
- **`src/features/account/address-types.ts`** — confirmed zero importers anywhere in `src` both before and after this phase's changes; the address feature now uses `AccountAddress` (`account-actions.ts`), matching the Phase 4 `AdminProduct`/`AdminOrder` convention.

### Tests
- **`src/lib/__tests__/account-actions.test.ts`** (new): 16 cases covering both the profile fix and every address action, including explicit IDOR-regression tests for `updateAddressAction`/`setDefaultAddressAction` (new) and `deleteAddressAction` (pre-existing behavior, re-verified unchanged).
- **`account/orders/__tests__/OrdersHistoryPage.test.tsx`** (rewritten — necessarily, per P6-8): empty state, error state (new — the old test had no way to distinguish "no orders" from "fetch failed," since the page could never fail before), and real-data rendering.
- **`features/account/components/__tests__/OrderDetailActions.test.tsx`** (new): verifies the pay/cancel button visibility rules per order status — including the specific, security-relevant case that neither button ever renders for an already-paid order.

---

## 6. Every Modified File

1. `src/lib/server/account-actions.ts`
2. `src/features/account/validation.ts`
3. `src/app/account/profile/page.tsx`
4. `src/app/account/addresses/page.tsx`
5. `src/app/account/orders/page.tsx`
6. `src/app/account/orders/__tests__/OrdersHistoryPage.test.tsx`

## 7. Every New File

1. `src/features/account/components/ProfileForm.tsx`
2. `src/features/account/components/AddressList.tsx`
3. `src/features/account/components/OrdersList.tsx`
4. `src/features/account/components/OrderDetailActions.tsx`
5. `src/features/orders/status-labels.ts`
6. `src/app/account/orders/[id]/page.tsx`
7. `src/lib/__tests__/account-actions.test.ts`
8. `src/features/account/components/__tests__/OrderDetailActions.test.tsx`
9. `docs/phase-6-report.md` (this report)

## 8. Deleted Files

1. **`src/features/account/address-types.ts`** — dead, zero-importer type definition (P6-7). Confirmed by `grep` before and after deletion.

## 9. Database/Schema Changes

**None.** `prisma/schema.prisma` was read (to re-confirm `Address.isDefault` and every `Order`/`OrderItem` field) but not modified — `isDefault` already existed and was simply never used by any code path before this phase.

**Mobile number: deliberately not made editable.** This is the one objective item explicitly conditioned on "if current architecture safely allows it" — it doesn't. This app has no OTP/phone-verification mechanism anywhere (confirmed across Phases 1–5's own findings), and `mobileNumber` is both the unique login identifier and, per Phase 5, the sole channel every notification goes through. Allowing an unverified change would let an account become associated with a phone number its owner doesn't actually control, with nothing to catch a typo or a takeover attempt. The profile form shows mobile number as a disabled, read-only field with a note to contact support — a real, considered decision, not an oversight.

---

## 10. Security Improvements / Review

**Ownership & IDOR:**
- `updateAddressAction`/`setDefaultAddressAction` (new) both check `existing.userId !== user.id` **before** reading or writing anything else about the target address, mirroring the exact pattern the pre-existing `deleteAddressAction` already used — not a new pattern, the same one, applied consistently to the two new mutations. Verified by dedicated tests (`account-actions.test.ts`) for both.
- `deleteAddressAction`'s existing ownership check was re-verified (not weakened) and covered by a new regression test alongside its new default-promotion behavior.
- The order pages reuse `getUserOrdersAction`/`getOrderAction` (Phase 2) completely unmodified — both were already ownership-scoped/IDOR-protected before this phase, and this phase adds zero new order-reading logic that could reintroduce a gap.

**No payment secrets exposed (order detail page):** `getOrderAction`'s raw return includes `Order.paymentAuthority` (unique ZarinPal authority — sensitive) and `Order.paymentAttempts` (includes provider `transactionId`s). The order-detail Server Component explicitly whitelists only `id`/`orderNumber`/`status`/`totalAmount`/`currency`/`createdAt`/`items`/parsed `customerInformation`/parsed `address` — `paymentAuthority`, `idempotencyKey`, the legacy `paymentInfo` field, and the raw `paymentAttempts` array are read from the fetched order **nowhere** in the new page code. A derived, boolean-ish "paid"/"not paid" indicator is shown instead of anything from `paymentAttempts`. Verified by re-reading the full page file line by line — not merely assumed from the general policy.

**Same not-found response for "doesn't exist" and "not yours":** `getOrderAction` already returns the identical `{success: false, error: "Access denied."}` for both a nonexistent order id and one belonging to someone else. The new detail page deliberately renders the same generic "سفارش مورد نظر یافت نشد یا شما اجازه‌ی مشاهده‌ی آن را ندارید" message for any failure, rather than trying to distinguish them — preserving, not weakening, that existing anti-enumeration property.

**No new attack surface on payment/cancellation:** `OrderDetailActions` calls `initiatePaymentForOrder`/`cancelOrderAction` exactly as Phase 2's own checkout UI does — no new validation, no new state transition, no new authorization logic was written for these; the account UI is just a second, legitimate caller of functions that already enforce everything themselves.

**Email uniqueness on profile update:** `updateProfileAction` checks for another account already using the submitted email before saving — prevents one customer's profile update from silently taking over a value another account relies on for anything.

**Validation is server-side and authoritative in every new/changed action:** every one of `updateProfileAction`/`addAddressAction`/`updateAddressAction` re-validates via a zod schema (`ProfileUpdateSchema`/`AddressInputSchema`) regardless of what the client already checked — the client-side checks (`validateProfileFields`, reused `validateAddress`) exist for UX only, exactly like every prior phase's forms.

---

## 11. Architecture Improvements

- Profile validation (`ProfileUpdateSchema`) derived via `.pick()` from `RegisterSchema` rather than redefined — zero duplicated name/email rules.
- Address field validation (province/city/streetAddress required) reused directly from `features/checkout/validation.ts`'s existing `validateAddress` — zero duplicated address rules, and zero edits to the Checkout-domain file it lives in.
- `AccountAddress` (account-actions.ts) follows the same explicit-DTO-interface convention Phase 4 established for `AdminProduct`/`AdminOrder` — consistent typing style across server-action files, and the genuinely dead `address-types.ts` predecessor was removed rather than left alongside it.
- Every new page follows the established thin-Server-Component-fetches / Client-Component-mutates split (Phase 2's `checkout/page.tsx` → `CheckoutView`, Phase 3's `account/page.tsx` → `AccountDashboard`, Phase 4's admin pages) — not a new pattern introduced this phase.
- Order status labels centralized in one new file (`features/orders/status-labels.ts`) instead of being inlined separately into `OrdersList.tsx` and the order-detail page a second time — see §14 for why this wasn't also wired into the pre-existing Admin-domain copy.

---

## 12. Validation Performed

- Read every account-area file (`account-actions.ts`, `address-types.ts`, all four page placeholders, `AccountDashboard.tsx`, `AccountLayoutClient.tsx`, `AccountSidebar.tsx`) in full before writing any code, plus `commerce-actions.ts`'s `getUserOrdersAction`/`getOrderAction`/`cancelOrderAction`/`startPaymentAction` and `checkout-submission.ts`'s `initiatePaymentForOrder` to confirm their exact existing signatures and ownership-check behavior before deciding to reuse rather than rebuild them.
- Confirmed, by direct `grep`, that `address-types.ts` had zero importers before deleting it, and zero remaining references after.
- Confirmed, by direct `grep`, that every new/changed account action (`getProfileAction`, `updateProfileAction`, `getAddressesAction`, `addAddressAction`, `updateAddressAction`, `setDefaultAddressAction`, `deleteAddressAction`) has a real UI caller — none are isolated utilities.
- Ran the same static unused-import scan used in every prior phase across all new/modified files — zero unused imports found.
- Manually re-derived that Next.js 15's dynamic route `params` prop is a `Promise` (confirmed against the existing convention already used by `products/[slug]/page.tsx` and `categories/[slug]/page.tsx`, not assumed) before writing `orders/[id]/page.tsx`.
- Re-read the full order-detail page after writing it specifically to check for any accidental pass-through of `paymentAuthority`/`paymentAttempts`/`idempotencyKey` to rendered output or to the `OrderDetailActions` Client Component — confirmed only `orderId` (string) and `status` (string) cross that boundary, nothing else from the raw order object.

**What was not done, and cannot be done in this environment:** no `npm install`, `tsc`, `vitest`, or `next build` — the same standing limitation as every prior phase.

---

## 13. Tests

- `account-actions.test.ts`: 16 new cases (profile: 2 read + 4 update; addresses: 2 list/create-validation + 2 default-on-first-address + IDOR × 2 + set-default × 2 + delete × 3).
- `OrdersHistoryPage.test.tsx`: rewritten, 3 cases (empty/error/real-data), necessarily changed per P6-8.
- `OrderDetailActions.test.tsx`: 5 cases covering every status-gating branch, including the security-relevant "never offers pay or cancel on an already-paid order" case.
- No existing test outside the account area was touched or needed to be — confirmed by `grep`-checking for any other test file referencing `account-actions`, `address-types`, or the four account pages before finishing.

---

## 14. Remaining Issues

1. **No compiler/test verification** — the standing limitation, now spanning six phases.
2. **Order status labels are duplicated between this phase's `features/orders/status-labels.ts` and Phase 4's `AdminOrdersTable.tsx`'s inline map.** Not consolidated this phase because doing so would require editing the Admin-domain file, which this phase's constraints protect "unless absolutely required" — it wasn't required for the account area to work correctly, only for full DRY-ness across domains. Flagged as a clean, low-risk follow-up for whichever future phase next touches the admin area.
3. **Address field validation (`OrderAddressSchema`, reused via `AddressInputSchema.extend(...)`) is permissive** — `province`/`city`/`streetAddress` only require non-empty strings, no format/length constraints beyond that. This is inherited, not introduced or worsened: it's the exact same schema the Checkout flow already uses, reused rather than duplicated or strengthened, per the "never duplicate validation" instruction. Tightening it would mean either diverging from checkout's own validation (a new inconsistency) or editing the shared Checkout-domain schema (out of this phase's scope) — noted as a legitimate tradeoff, not hidden.
4. **No pagination on the orders list.** `getUserOrdersAction` (Phase 2, unmodified) has no `take`/`skip` — a customer with a very large order history would get every order in one query. Not a correctness issue at any realistic scale for this phase, but worth knowing.
5. **Mobile number remains uneditable** (§9) — a deliberate, reasoned decision, not a gap that was missed.

## 15. Risks

- **Unverified code risk**, as in every prior phase — the most likely failure points if any: the `AddressInputSchema.extend(...)` call against `OrderAddressSchema` (should work — standard zod `.extend()` on a plain `z.object()`, but unconfirmed by a real compile), and the `render(await OrdersHistoryPage())` async-Server-Component test pattern (a known, documented RTL workaround, but not one this specific test suite had used before this phase).
- **`AddressInputSchema`'s permissiveness** (§14.3) means a customer could technically save an address with e.g. a single-character city name — cosmetic risk only, not a security one, and not new (checkout already accepts the same).
- **The order-detail page's `PAID_ONWARD_STATUSES`-derived "paid"/"not paid" indicator is a simplification**, not a literal read of payment records — for the handful of statuses this app's model defines, it's accurate (see §10), but it's worth knowing it's derived rather than fetched, if a future status value is ever added to the order-state model without updating this list too.

## 16. Recommendations

1. Run `npm install && npx tsc --noEmit && npm test && npm run build` in a networked environment — standing recommendation, now spanning six phases.
2. When the admin area is next revisited, consider having `AdminOrdersTable.tsx` import `features/orders/status-labels.ts` instead of its own inline copy (§14.2) — low-risk, purely additive from the admin side.
3. Consider pagination for `getUserOrdersAction` if/when order volume per customer becomes a real concern (§14.4) — would need a small, backward-compatible extension to that Phase 2 action.
4. If mobile-number change is wanted in a future phase, it should come with a real OTP/verification flow — not be added to `updateProfileAction` without one.

## 17. Production Readiness Assessment

**Code-complete for the stated scope, unverified by compiler/test-runner.** Every previously-placeholder section of the customer account area now performs real, validated, ownership-checked operations against the real database, and every new mutation was traced by hand for IDOR safety and payment-data exposure. The two things standing between this and a confident "ready" are the standing inability to run a real build/test pass in this environment, and the honestly-disclosed, deliberately-deferred items in §14 (none of which are security gaps — all are either out-of-scope-by-design or low-risk DRY/UX follow-ups).

## 18. Final Verdict

**PASS WITH NOTES**

Rationale: every objective was implemented — profile editing (with a reasoned, explicit decision on the one conditional item), full address CRUD with default-address support, a real orders list, a new order-detail page with careful payment-data whitelisting, and account UX states (loading/empty/error, plus retry via existing error-state re-navigation) — all while reusing rather than duplicating existing validation and existing Payment/Checkout order actions, and all confirmed reachable by direct `grep` tracing rather than assumed. It is not an unqualified **PASS** for the standing reason common to every phase (no compiler/test run possible here). It is not a **FAIL** because nothing was left fake, no ownership check was weakened, no payment secret was found exposed on re-inspection, and every remaining gap (§14) is named with its reasoning rather than hidden.

**Condition for upgrading to PASS:** run the build/type-check/test suite in a networked environment and confirm no errors — the same standing condition as every prior phase, now spanning six.
