# Observability & Monitoring - Phase 141

## Strategy
Tahririno uses structured JSON logging in production to support integration with Datadog, Axiom, or Vercel Logs.

## Components
1. **Correlation IDs**: Passed from `apiClient` to server logs for request tracing.
2. **Error Classification**: Errors are wrapped in `ApiError` or `CommerceError` types.
3. **Audit Logs**: Critical admin actions are logged to the database.

## Dashboard Metrics
- Order success rate
- API Latency (95th percentile)
- Checkout abandonment rate
- Server Action failure count
