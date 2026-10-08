# Real Payment Gateway Forensic Audit (Phase 209)

## 1. ZarinPal v4 Implementation
*   **Adapter State**: The project uses an adapter pattern in `src/lib/payment-boundary.ts`.
*   **Request URL**: Ready for `api.zarinpal.com/pg/v4/payment/request.json`.
*   **Verification URL**: Ready for `api.zarinpal.com/pg/v4/payment/verify.json`.

## 2. Security Checks
*   **Amount Match**: The server verifies that the amount confirmed by ZarinPal matches the `Order.totalAmount` exactly.
*   **Double-Callback**: Handled. The `handlePaymentCallbackAction` checks if `order.status` is already `paid` before processing.

## 3. Evidence of Readiness
*   **Currency**: Correct conversion logic from Toman (DB) to IRR (Portal).
*   **Persistence**: `PaymentAttempt` records are used to track every transaction ID.

## 4. Status
**ARCHITECTURE READY — NOT LIVE VERIFIED**.
A real payment cannot be processed until the `ZARINPAL_MERCHANT_ID` is provided.

## 5. Verdict
**PROVEN ARCHITECTURE — PENDING KEYS**.
