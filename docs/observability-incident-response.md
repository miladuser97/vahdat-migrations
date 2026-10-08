# Observability & Incident Response Guide

## 1. Logging Standard
*   **Format**: Structured JSON logs in production (via `logger.ts`).
*   **Correlation**: All `createOrderAction` calls include a `correlationId`.
*   **PII Filtering**: Passwords and session tokens are never logged.

## 2. Monitoring & Health
*   **Liveness**: `/api/health` checks process uptime.
*   **Readiness**: `/api/health` checks DB connectivity.
*   **Alerting**: Recommended to set up alerts for any 5xx response on `/api/health`.

## 3. Incident Response Scenarios

### Scenario A: Database Unreachable
1.  **Detection**: `/api/health` returns 503.
2.  **Impact**: All logins, orders, and checkouts fail.
3.  **Action**: Check Neon/PostgreSQL status. Verify `DATABASE_URL` hasn't been rotated.

### Scenario B: Payment Gateway Failure
1.  **Detection**: High rate of `pending_payment` orders without `PaymentAttempt` success.
2.  **Impact**: Revenue loss.
3.  **Action**: Switch to secondary Payment Provider if available. Notify users on checkout page.

### Scenario C: High Auth Failures (Brute Force)
1.  **Detection**: Logs show many "Invalid credentials" errors for various users.
2.  **Impact**: Potential account takeover.
3.  **Action**: Check lockout status in DB. Consider IP-level blocking at WAF (Cloudflare).

## 4. Audit Verdict
**VERIFIED (RC1)** - Observability is built into the core logic.
