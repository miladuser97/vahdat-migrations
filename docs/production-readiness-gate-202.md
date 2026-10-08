# Production Readiness Gate (Phase 202)

## 1. Environment & Infrastructure
- [ ] `DATABASE_URL` (Neon/Postgres) - Verified Connectivity.
- [ ] `ZARINPAL_MERCHANT_ID` - Configured in Production.
- [ ] `SMS_API_KEY` - Configured in Production.
- [ ] `AUTH_SECRET` - Minimum 32 chars, random.
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to production domain.

## 2. Security & Compliance
- [x] Password hashing with Bcrypt (Cost: 12).
- [x] Brute-force lockout (5 attempts / 15 mins).
- [x] Session revocation on logout/password change.
- [x] IDOR protection on all account/commerce actions.
- [x] Strict CSP and Security Headers.
- [x] Parameterized DB queries (Prisma).

## 3. Commerce & Transactions
- [x] Atomic inventory decrement (`gte` guards).
- [x] Transactional order creation.
- [x] Payment reconciliation with `idempotencyKey`.
- [x] Price snapshotting in OrderItems.

## 4. Disaster Recovery
- [x] PITR (Point-in-Time Recovery) documented.
- [x] Manual restore drill successful (simulated).
- [x] Liveness/Readiness probes active.

## 5. Deployment Verified
- [ ] Build successful on CI.
- [ ] Linting and Typecheck pass.
- [ ] All tests (25+) pass.
