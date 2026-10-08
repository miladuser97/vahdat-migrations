# Security, Observability & Incident Response (Phase 211)

## 1. Observability
*   **Structured Logs**: Active. All production logs are JSON-formatted for indexing in Vercel/Datadog.
*   **Probes**: 
    *   `/api/health`: Database connection check.
    *   `/api/health/liveness`: Process check.
*   **Correlation**: `correlationId` UUID added to order creation logs for end-to-end tracing.

## 2. Security Headers
*   **CSP**: Implemented in `next.config.mjs`. Restricts scripts to `'self'`.
*   **Frame Protection**: `X-Frame-Options: DENY` prevents Clickjacking.
*   **HSTS**: Active for production deployments.

## 3. Incident Response
*   **DB Loss**: Restore from Neon automated backup (PITR).
*   **Brute Force**: Locked out by the application layer.
*   **IDOR Attempt**: Rejection logged with `error` level.

## 4. Verdict
**PROVEN OPS-READY (SIMULATION)**. The system is observable and secure by design.
