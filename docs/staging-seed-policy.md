# Staging Seed & Data Safety Policy - Phase 147

## Idempotency
- All seeding MUST use `upsert` to avoid duplicate records on repeated runs.
- Use unique natural keys (e.g., `slug` for products, `mobileNumber` for users).

## Environment Guards
- The seed script is BLOCKED in `NODE_ENV=production` by default.
- To force a seed in production (extreme caution required), set `FORCE_SEED=true`.
- Staging environments should use a "Safe Fixtures" subset.

## Cleanup
- Do NOT use `prisma.deleteMany()` in seed scripts as it may clear real user data in staging.
- Prefer updating existing records.

## Execution
```bash
npx prisma db seed
```
