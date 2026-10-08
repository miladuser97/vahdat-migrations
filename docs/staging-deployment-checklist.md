# Phase 170: Staging Deployment Checklist & Cloud Boundary

## Environment Matrix
| Variable | Staging Value | Production Value | Secret? |
|---|---|---|---|
| `DATABASE_URL` | Neon/Railway Postgres (Test DB) | Managed Postgres (Prod DB) | YES |
| `AUTH_SECRET` | Random 32+ char string | Random 64+ char string | YES |
| `NODE_ENV` | `production` | `production` | NO |
| `NEXT_PUBLIC_API_URL` | `https://staging-api.tahririno.com` | `https://api.tahririno.com` | NO |

## Deployment Readiness Verification
- [x] Prisma schema is provider-agnostic (PostgreSQL).
- [x] Server Actions use `use server` and secure logic.
- [x] Session store is server-side (DB).
- [x] Security headers (CSP) configured in `next.config.mjs`.
- [x] Health check route `/api/health` verifies DB connection.
- [x] No sensitive secrets in `public/` or client-side bundles.

## Migration Runbook (Staging)
1. Provision a PostgreSQL instance.
2. Set `DATABASE_URL` in CI/CD (Vercel/GitHub Actions).
3. Run `npx prisma migrate deploy` during the build step.
4. Run `npx prisma db seed` for initial catalog (optional).

## Rollback Procedure
1. Revert Git commit.
2. If schema changed: Restore DB from automated backup before migration.
3. Redeploy.
