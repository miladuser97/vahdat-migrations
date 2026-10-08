# Tahririno — Phase 2 Report: Payment & ZarinPal Integration

**Scope:** Payment/ZarinPal flow only, per explicit instruction. No work was done on notifications, login/register UI, admin dashboard, authorization wiring, logging/PII redaction, security headers, or disaster recovery — those remain exactly as documented in the Phase 1 inspection.

**Important premise correction (stated at the start of this phase and repeated here for the record):** No "Phase 1 remediation" was ever performed. Phase 1 in this conversation was inspection-only — a project map and findings list, with zero code changes. Phase 2 proceeded anyway because payment/ZarinPal work does not depend on the other findings being fixed first. This report does not claim Phase 1 items are resolved.

---

## 1. Executive Summary

Before this phase, Tahririno had a well-built ZarinPal v4 backend (real request/verify calls, real Toman→Rial conversion, idempotency keys, atomic inventory decrement) that was **completely unreachable from the live site**. The checkout UI's final submit button was hardcoded `disabled`, and the functions that create an order (`createOrderAction`/`submitOrder`) and start a payment (`startPaymentAction`) had zero callers anywhere in the application. No customer could ever complete a purchase.

This phase wired the real backend to the UI end-to-end, and hardened the backend itself against a set of order-state and concurrency bugs that existed in the pre-Phase-2 code (payment could be re-initiated on an already-paid order; a callback for a cancelled/expired order could silently mark it paid; concurrent duplicate callbacks were not race-safe).

**What this report cannot claim:** none of this has been confirmed by an actual build, type-check, or test run. This sandbox has no network access (`npm install` fails with `403 Forbidden` against the npm registry), so every change below was verified by manual, file-by-file, call-site-by-call-site tracing — not by a compiler or test runner. This is stated plainly in every relevant section below, not just here.

---

## 2. Objectives of This Phase

Per your instruction, restated exactly as scoped:

1. Verify the real ZarinPal v4 integration end-to-end.
2. Verify payment request creation, authority storage, callback handling, verification, amount validation, and order status transitions.
3. Ensure payment amount is calculated exclusively from trusted server-side order data.
4. Verify Toman/Rial conversion at the ZarinPal boundary.
5. Prevent payment replay, duplicate verification, forged callbacks, authority mismatch, and invalid order-state transitions.
6. Ensure payment verification is idempotent and safe under repeated callbacks.
7. Ensure failed, cancelled, expired, and already-paid orders are handled correctly.
8. Verify payment success is never reported unless gateway verification genuinely succeeds.
9. Verify transaction/order/payment consistency; preserve existing correct inventory/idempotency logic.
10. Remove or fix placeholder, fake-success, dead, or misleading payment code/UI.
11. Connect the real payment flow to the existing checkout UI, without expanding into unrelated phases.

---

## 3. Every Issue Found (Pre-Phase-2 State)

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| P2-1 | Checkout's final "submit" button was hardcoded `disabled`, labeled "coming soon". `submitOrder()` had zero callers anywhere in the app. | `ReviewConfirmation.tsx` | **Critical** — no purchase was possible at all |
| P2-2 | `startPaymentAction()` had zero callers anywhere in the app, including from `submitOrder`'s call sites (there were none). | `commerce-actions.ts` | **Critical** |
| P2-3 | `PaymentSection.tsx` offered 5 payment methods (online, card-to-card, cash-on-delivery, wallet, installment); only "online-payment" had any backend implementation. `paymentMethod` was never even passed to `createOrderAction`. | `PaymentSection.tsx` | High — misleading UI |
| P2-4 | `startPaymentAction` had no order-status guard: could be called on a `paid`, `cancelled`, or `expired` order, silently overwriting the unique `paymentAuthority` column and creating a new gateway payment intent for an order that should not be payable. | `commerce-actions.ts` | **Critical** — risk of double-charge / corrupted authority linkage |
| P2-5 | `handlePaymentCallbackAction` only special-cased `status === "paid"` for idempotency. A callback for a `cancelled` or `expired` order (inventory already restored) would proceed to gateway verification and, on success, mark the order `paid` again — corrupting inventory/order consistency and reporting success for a state ZarinPal did not cause. | `commerce-actions.ts` | **Critical** |
| P2-6 | The paid-order status transition was a non-atomic two-statement `$transaction([update, create])` with no conditional `WHERE status IN (...)` clause. Two near-simultaneous callbacks (browser refresh, gateway retry) could both pass the pre-check and both execute, risking duplicate notification sends. | `commerce-actions.ts` | Medium — race condition |
| P2-7 | No handling for a duplicate `PaymentAttempt.transactionId` unique-constraint violation on a race — would surface as an unhandled `P2002` error and a generic failure message even though the payment had, in fact, already succeeded. | `commerce-actions.ts` | Medium |
| P2-8 | `checkout-submission.ts` referenced `(state as any).idempotencyKey`, which was always `undefined` because no caller ever supplied one — the idempotency mechanism in `createOrderAction` was dead code in practice. | `checkout-submission.ts` | Medium |
| P2-9 | The ZarinPal callback route collapsed every non-success outcome into a flat `payment=failed`, indistinguishable from a cancelled, invalid, or "order no longer valid" outcome. | `api/payment/callback/route.ts` | Medium — poor failure semantics |
| P2-10 | Nothing in the UI read the `payment`/`orderId` query params the callback route redirects back with — a customer returning from ZarinPal saw no acknowledgement of success, failure, or cancellation. | `checkout/page.tsx` | High — silent UX dead end |
| P2-11 | `checkout/page.tsx`'s doc comment and a leftover `CheckoutSectionPlaceholder` ("این بخش هنوز آماده نیست") rendered on every checkout visit, claiming "no order creation, no payment logic" — false, and confusing directly above the real review/payment entry point. | `checkout/page.tsx`, `CheckoutView.tsx` | Low–Medium — misleading, adjacent to payment entry point |

**Confirmed as already correct (no issue, verified not fake):**
- `payment-boundary.ts`: real ZarinPal v4 `request.json`/`verify.json` calls, real Toman→Rial conversion (`toRial`) with integer/overflow guards, handles ZarinPal code `101` ("already verified") as success.
- `createOrderAction`: real atomic inventory decrement guarded by `inventoryCount: { gte: quantity }`, real idempotency-key lookup (mechanism was correct; it was simply never fed a key — see P2-8).
- `payment-boundary.test.ts`: mocks only `fetch`, not the boundary logic itself — legitimate unit test practice.

---

## 4. Root Cause Analysis

- **P2-1, P2-2, P2-10, P2-11** share one root cause: the checkout UI was built in phases (per its own doc comments, "Phase 23" through "Phase 42") that predate the payment backend's construction, and nothing was ever done to connect the two once the backend landed. The backend's own tests (`payment-boundary.test.ts`, parts of `commerce-integrity.test.ts`) passed in isolation, which is likely why prior "certification" documents (see Phase 1 report) could claim the payment system was verified — the tests never exercised the actual UI call path, because there wasn't one.
- **P2-3** is a direct consequence of P2-1/P2-2: since nothing downstream ever read `paymentMethod`, there was no pressure to keep the method list honest.
- **P2-4, P2-5, P2-6, P2-7** share a root cause: the original implementation treated "verify with ZarinPal" and "the order is in a state where verification result should apply" as the same question. They are not — an order's local lifecycle (cancelled by a cleanup job, expired after 24h, already paid by an earlier callback) can diverge from the gateway's view of a specific `authority`, and the code did not reconcile the two before mutating state.
- **P2-8** is a straightforward wiring gap — the parameter existed, the consumer existed, no caller supplied a value.
- **P2-9** is scope-limited design: the original route only distinguished "ZarinPal said Status=OK" from "it didn't," not what the subsequent server-side verification/reconciliation actually decided.

---

## 5. Every Code Change Made

### `src/lib/server/commerce-actions.ts`
- Added `PAYABLE_ORDER_STATUSES = ["pending_payment", "payment_failed"]` and `isPayableStatus()`.
- Added `import { Prisma } from "@prisma/client"` and `import { logger } from "../logger"`.
- **`startPaymentAction`**: added guard — throws a clear Persian error if `order.status === "paid"`, and a separate error if `!isPayableStatus(order.status)` (covers cancelled/expired/draft).
- **`handlePaymentCallbackAction`**: rewritten —
  - Kept the existing authority-mismatch check and the "already paid → idempotent return" short-circuit.
  - Added a new guard: if the order is in a non-payable status, the gateway is still verified (for audit purposes only — money may have moved before the order became invalid), and on success a `PaymentAttempt` with `status: "requires_manual_review"` is recorded and a `logger.error` is emitted; the order is **never** marked paid. Returns `code: "ORDER_NOT_PAYABLE_FUNDS_CAPTURED"` or `code: "ORDER_NOT_PAYABLE"`.
  - The failed-verification path now uses a conditional `tx.order.updateMany({ where: { status: { in: PAYABLE_ORDER_STATUSES } }, data: { status: "payment_failed" } })` instead of an unconditional `update`, and only creates the `PaymentAttempt` if the update actually applied.
  - The success path now uses the same atomic `updateMany` pattern for the `paid` transition (`prisma.$transaction(async (tx) => {...})`, callback form instead of array form). If `updateMany` affects 0 rows, the function treats this as "another request already reconciled it" and returns idempotent success without creating a duplicate `PaymentAttempt` or re-sending the notification.
  - Wrapped the `PaymentAttempt.create` call in a `try/catch` that specifically recognizes `Prisma.PrismaClientKnownRequestError` with `code === "P2002"` (unique constraint on `transactionId`) as "already recorded, not an error."
  - Replaced raw `console.log`/`console.error` calls in this function with the existing `logger` (redaction-aware) utility.
  - All return values now carry a `code` field (`ALREADY_PAID`, `ORDER_NOT_PAYABLE`, `ORDER_NOT_PAYABLE_FUNDS_CAPTURED`, `VERIFICATION_FAILED`, `PAID`, `ERROR`) so callers can distinguish outcomes instead of a flat boolean.
- No changes were made to `createOrderAction`, `cleanupExpiredOrdersAction`, `getUserOrdersAction`, `getOrderAction`, or `cancelOrderAction` — out of scope, left exactly as found.

### `src/app/api/payment/callback/route.ts`
- The redirect now maps `result.code` to a specific `payment` query value: `success`, `invalid_state` (for `ORDER_NOT_PAYABLE*`), or `failed` (everything else). Also forwards `result.error` as a `message` query param when present.

### `src/features/checkout/components/PaymentSection.tsx`
- Reduced the payment-method list from 5 entries to 1 (`online-payment`, "پرداخت آنلاین (درگاه زرین‌پال)"). Removed `RadioGroup`/`RadioOption` (no longer needed with one option); replaced with a static selected-state display.
- Added a `useEffect` that syncs `CheckoutProvider`'s `paymentMethod` state to the single real value on mount (so the existing `validateCheckout` "payment method required" check passes without user interaction on a single-option list).
- Updated `HelperText` copy to state plainly that the customer is redirected to ZarinPal and that the amount is server-calculated (previously said "processing added in future phases").

### `src/features/checkout/components/ReviewConfirmation.tsx`
- Removed the hardcoded `disabled` attribute and "(بزودی)" label from the final submit button.
- Added `status`/`error`/`createdOrderId` state, and an `idempotencyKey` generated once per review session via `useMemo(() => crypto.randomUUID(), [])`.
- `handleConfirm` now: calls `submitOrderAndPay(...)` (or, on retry after a payment-only failure, `initiatePaymentForOrder(createdOrderId)` to avoid creating a duplicate order for the same cart); on success, navigates the browser to `result.paymentUrl`; on failure, displays the real error and — if the order was created but payment failed to start — offers a "retry payment" path against the same order.
- Cart is deliberately **not** cleared here (see below).

### `src/features/checkout/components/CheckoutView.tsx`
- Removed the leftover `CheckoutSectionPlaceholder` block ("بازبینی و تأیید نهایی سفارش") that rendered below the form on every visit, which was stale/misleading now that a real review-and-pay step exists and is reached via the button above it.

### `src/features/checkout/components/PaymentResultBanner.tsx` — **new file**
- Reads `payment`/`orderId`/`message` query params (set by the callback route) via `useSearchParams`.
- Renders a status-specific banner for `success` / `failed` / `cancelled` / `invalid_state` / `invalid`.
- Calls `clearCart()` exactly once, only when `payment === "success"` — i.e., only after the server-verified callback confirms success, not at gateway-redirect time.

### `src/features/checkout/services/checkout-submission.ts`
- `submitOrder` now accepts an explicit `idempotencyKey?: string` parameter instead of reading a nonexistent field off the validated state.
- Added `initiatePaymentForOrder(orderId)` — thin wrapper around `startPaymentAction`, never fabricates a `paymentUrl`.
- Added `submitOrderAndPay(state, items, idempotencyKey)` — combines order creation and payment initiation into the one call `ReviewConfirmation` uses, returning `orderCreated: true` on a payment-only failure so the UI can distinguish "no order was made" from "order exists, gateway failed."

### `src/app/checkout/page.tsx`
- Added `<Suspense fallback={null}>` around the new `<PaymentResultBanner />` (required for `useSearchParams` in a Client Component per Next.js App Router).
- Rewrote the stale doc comment that claimed "no forms, no customer information, no shipping/payment logic, no order creation."

### `src/lib/__tests__/commerce-integrity.test.ts`
- Updated the Prisma mock to include `order.updateMany` (previously only `order.update` was mocked; the rewritten source code no longer calls `order.update` for the paid/failed transitions).
- Updated the "marks order as paid" assertion to check `order.updateMany` was called with the conditional `where: { status: { in: [...] } }` clause instead of the old unconditional `order.update`.
- Added four new test cases: refuse-to-pay an already-paid order, refuse-to-pay a cancelled order, idempotent duplicate callback on an already-paid order, never-mark-cancelled-order-paid-even-on-gateway-success, and a simulated concurrent-race (`updateMany` returns `count: 0`) resolving to idempotent success.

---

## 6. Every Modified File (Full List)

1. `src/lib/server/commerce-actions.ts`
2. `src/app/api/payment/callback/route.ts`
3. `src/features/checkout/components/PaymentSection.tsx`
4. `src/features/checkout/components/ReviewConfirmation.tsx`
5. `src/features/checkout/components/CheckoutView.tsx`
6. `src/features/checkout/services/checkout-submission.ts`
7. `src/app/checkout/page.tsx`
8. `src/lib/__tests__/commerce-integrity.test.ts`

## 7. New Files Created

1. `src/features/checkout/components/PaymentResultBanner.tsx`
2. `docs/phase-2-report.md` (this report)

## 8. Deleted Files

None. Confirmed by directory listing — every file present in `src/features/checkout/components/` before this phase is still present.

## 9. Database/Schema Changes

**None.** `prisma/schema.prisma` was read for reference (to confirm `PaymentAttempt.status` is an unconstrained `String`, `paymentAuthority` is `@unique`, etc.) but not modified. Checksum confirmed unchanged before/after this phase. No new migration was created or needed — all new `PaymentAttempt.status` values used (`"requires_manual_review"`) fit the existing free-text `String` column.

## 10. Security Improvements

- Closed a **double-charge / authority-hijack risk**: an order that is already paid, cancelled, or expired can no longer have a new ZarinPal payment intent started against it.
- Closed a **state-corruption path**: a forged or replayed callback (or a legitimately late one, after a cleanup job expired the order) can no longer flip a cancelled/expired order to `paid`.
- Closed a **race condition** in the paid-transition that could have allowed duplicate side effects (duplicate notification dispatch) under concurrent/duplicate callbacks.
- Payment amount continues to be sourced exclusively from `order.totalAmount` (server-computed at order-creation time from `Product.price × quantity`) at every gateway boundary — never from client input. This was already correct and was preserved, not weakened.
- Payment success is now provably never reported unless `verifyPayment()`'s own `success: true` result is what drove the status transition — the non-payable-order branch explicitly returns `success: false` even when the gateway itself verified successfully.
- Replaced raw `console.*` calls with the redaction-aware `logger` in the one function touched this phase (`handlePaymentCallbackAction`). This is a partial improvement only — the PII-redaction gap flagged in Phase 1 across the rest of the codebase (`auth-actions.ts`, the rest of `commerce-actions.ts`, etc.) is **not** fixed and remains open.

## 11. Architecture Improvements

- Introduced a single, explicit order-payability state model (`PAYABLE_ORDER_STATUSES`) instead of ad hoc, per-function status checks.
- Standardized the paid/failed transitions on Prisma's callback-form `$transaction(async (tx) => {...})` with conditional `updateMany`, replacing the previous array-form `$transaction([...])` that had no way to express a conditional update.
- Return values from `handlePaymentCallbackAction` now carry a machine-readable `code`, giving the callback route (and any future caller) a real outcome taxonomy instead of a boolean.
- Consolidated order-creation + payment-initiation into one composable service function (`submitOrderAndPay`) while still exposing the two steps independently (`submitOrder`, `initiatePaymentForOrder`) so a payment-only retry doesn't re-create the order.

## 12. Validation and Verification Performed

**What I actually did:**
- Read every file before and after editing, in full, via the `view` tool.
- Traced every call site of every function I changed (`grep`-searched the entire `src` tree for `startPaymentAction`, `handlePaymentCallbackAction`, `submitOrder`, `initiatePaymentForOrder`, `submitOrderAndPay`) to confirm no orphaned or mismatched callers remain.
- Cross-checked every Prisma field/model I referenced (`Order.paymentAuthority` uniqueness, `Order.status` default, `PaymentAttempt.status`/`transactionId` types) directly against `prisma/schema.prisma`.
- Confirmed `CartProvider` is mounted at the root layout (`src/app/layout.tsx`), so `useCart()` inside the new `PaymentResultBanner` is safe.
- Confirmed the Tailwind design tokens used in new UI (`error`, `warning`, `success`) exist in `tailwind.config.ts`.
- Confirmed `crypto.randomUUID()` usage is consistent with pre-existing usage elsewhere in the same file (`commerce-actions.ts` already used it server-side).
- Manually re-derived the test-mock shape in `commerce-integrity.test.ts` against the exact Prisma calls the rewritten source now makes, line by line.

**What I did not do, and cannot do in this environment:**
- `npm install` fails: `403 Forbidden` against `registry.npmjs.org` — this sandbox has no network egress and no pre-cached copy of this project's dependencies.
- Consequently: **no TypeScript compile, no ESLint run, no `vitest` run, no `next build` was performed.** Nothing in this report has been confirmed by a compiler or test runner — only by manual inspection.

## 13. Tests Executed and Their Results

**None were executed.** `src/lib/__tests__/commerce-integrity.test.ts` was updated to match the new implementation and new test cases were added to it, but the test file has not been run. This is a genuine gap, not a formality — until it's run in a networked environment, the test file represents my best manual reasoning about correctness, not a verified pass.

## 14. Remaining Issues

1. **No compiler/test verification** of any change in this phase (see §12–13).
2. **No UI path to resume a `pending_payment`/`payment_failed` order** once the customer navigates away from the immediate review/retry screen — the order and its inventory reservation persist server-side (and will eventually be released by `cleanupExpiredOrdersAction` after 24h), but there is currently no "your pending order" page to return to it. Flagged as a real gap, deliberately left out of scope.
3. **Notifications remain fake** (`notification-boundary.ts` / `email/provider.ts`) — `notifyOrderSuccess` is still called on successful payment but does not actually send anything. Explicitly out of scope for this phase.
4. **All Phase 1 findings not related to payment remain unresolved**: no login/register UI, unreachable `AdminDashboard`, unused `authorization.ts` helpers, PII-redaction logger unused outside the one function touched this phase, missing HSTS header, unverified disaster-recovery claims.
5. `updateProfileAction` (account feature, unrelated to payment) is still a no-op stub — noted in Phase 1, unchanged.

## 15. Risks

- **Unverified code risk**: since nothing was compiled or tested, there is a non-trivial chance of a TypeScript type error, an incorrect Prisma call shape, or a React hooks-rule violation that would only surface at build time. The most likely candidates, if any: the `Prisma.PrismaClientKnownRequestError` import/usage in `commerce-actions.ts`, and the `useEffect` dependency wiring in `PaymentSection.tsx`/`PaymentResultBanner.tsx`.
- **Behavioral risk from the funds-captured branch**: when a gateway verification succeeds for a non-payable order, the customer is told to contact support, but there is no automated refund or alerting pipeline — the `requires_manual_review` `PaymentAttempt` row is the only trace, and nothing currently surfaces it to an operator (there is no admin dashboard reachable to view it — see Phase 1 finding #6).
- **Idempotency-key generation is client-side and per-mount** (`useMemo` in `ReviewConfirmation`): if the component unmounts and remounts (e.g., the customer navigates back to the form and forward again) a new key is generated, which is correct behavior (a genuinely new checkout attempt) but means a page refresh mid-flow does not currently preserve the same key either — acceptable, but worth knowing.
- **Guest checkout only**: since login/register is still disabled (Phase 1 finding, unchanged), every order this flow creates is a guest order (`userId: null`). This is pre-existing, not introduced by this phase, but it does mean `getOrderAction`'s IDOR-protected lookup can never actually be used by these customers to view their own order later.

## 16. Recommendations

1. Run `npm install && npx tsc --noEmit && npm test && npm run build` in a networked environment before treating this phase as verified. This is the single highest-priority follow-up.
2. Build a minimal "check your order status" page/flow for guest checkouts (order ID + mobile number lookup, or similar), since guest orders currently have no way to be revisited if payment fails or is interrupted.
3. Surface `requires_manual_review` `PaymentAttempt` rows somewhere an operator can actually see them — currently they are invisible without direct database access.
4. Treat login/register UI, admin dashboard reachability, and PII-redacted logging as the next priorities, per the original Phase 1 findings list, since several of Phase 2's own remaining risks (op visibility, guest-order recovery) are downstream of those gaps.

## 17. Production/Staging Impact

- This is a **behavior-changing** release for the checkout flow: previously no purchase could complete; after this change, purchases can complete for real, against the real ZarinPal integration, using real `ZARINPAL_MERCHANT_ID`/`ZARINPAL_CALLBACK_URL` credentials.
- **Do not deploy without setting real ZarinPal credentials** in the target environment — `initiatePayment()` throws if `ZARINPAL_MERCHANT_ID` is unset, which is correct (fails closed), but confirm the env vars are actually present in staging/production before relying on this flow.
- Because this has not been build/test verified, I would not recommend deploying this directly to production without first running it through CI (or equivalent) in an environment with network access.

## 18. Git-Style Changelog

```
[Phase 2] Payment & ZarinPal integration: wire real backend to checkout UI, harden order-state transitions

fix(commerce-actions): guard startPaymentAction against paid/cancelled/expired orders
fix(commerce-actions): guard handlePaymentCallbackAction against non-payable order states;
                       flag gateway-verified-but-invalid-order funds for manual review instead
                       of silently discarding or silently marking paid
fix(commerce-actions): make paid/failed status transitions atomic via conditional updateMany,
                       closing a race between duplicate/concurrent callbacks
fix(commerce-actions): handle duplicate PaymentAttempt.transactionId (P2002) as idempotent,
                       not a hard failure
refactor(commerce-actions): replace console.* with redaction-aware logger in
                             handlePaymentCallbackAction
refactor(commerce-actions): $transaction array-form -> callback-form for conditional updates

feat(payment-callback-route): map reconciliation outcome to success/failed/cancelled/invalid_state
                               instead of a flat success/failed boolean

feat(checkout): wire ReviewConfirmation's submit button to real order creation + payment
                initiation + gateway redirect (previously hardcoded disabled)
feat(checkout): add PaymentResultBanner to surface the real callback outcome on return from
                ZarinPal; clear cart only on confirmed success, not at redirect time
feat(checkout-submission): accept explicit idempotencyKey; add initiatePaymentForOrder and
                            submitOrderAndPay
fix(PaymentSection): remove 4 unimplemented/fake payment methods, keep only real ZarinPal option
chore(CheckoutView): remove stale/misleading placeholder card rendered above the real review step
docs(checkout/page): correct stale "no order creation, no payment logic" comment

test(commerce-integrity): update Prisma mocks for updateMany-based conditional transitions;
                          add tests for non-payable-order guard, idempotent duplicate callback,
                          and concurrent-reconciliation race

docs: add Phase 2 report (this file)
```

## 19. Final Verdict

**PASS WITH NOTES**

Rationale: every objective in §2 was addressed in the code, and the changes are internally consistent by manual trace (no orphaned callers, no schema mismatches, no dangling imports found). It is not an unqualified **PASS** because nothing was compiler- or test-verified — this sandbox could not run `npm install` due to no network access. It is not a **FAIL** because the changes are complete, scoped correctly, and the specific gaps that remain (compiler verification, guest-order recovery UX, operator visibility into manual-review payments) are clearly identified rather than hidden.

**Condition for upgrading to PASS:** run the build/type-check/test suite in a networked environment and confirm no errors.
