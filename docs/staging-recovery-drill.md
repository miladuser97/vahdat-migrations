# Observability & Recovery Drill - Phase 152

## Monitoring
- Monitor `error` logs in the cloud console.
- Trace failed orders using the `correlationId` found in logs.

## Recovery Procedure
1. **DB Outage**: Check Managed Provider status page.
2. **App Crash**: Check build logs for memory leaks or missing environment variables.
3. **Data Loss**: Restore latest snapshot (see `disaster-recovery.md`).

## Verified
- [x] Structured JSON logging in prod mode.
- [x] Traceable CID in server actions.
