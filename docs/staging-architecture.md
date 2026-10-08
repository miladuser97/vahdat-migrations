# Staging & Production Architecture

## Hosting Strategy
- **Application**: Next.js App Router hosted on a Node.js compatible platform (Vercel, Docker/K8s, or Railway).
- **Database**: Managed PostgreSQL (e.g., Supabase, Neon, or AWS RDS).

## Environments
| Variable | Local | Staging | Production |
|---|---|---|---|
| NODE_ENV | development | production | production |
| DATABASE_URL | localhost:5432 | cloud-staging-db | cloud-prod-db |
| API_URL | localhost:3000/api | staging.tahririno.ir/api | tahririno.ir/api |

## Secret Management
- Secrets are NEVER committed to Git.
- Managed via Hosting Provider UI (Vercel Env Vars, Railway Variables).
- Strictly validated at startup using Zod in `src/config/env.ts`.

## Deployment Strategy
1. **CI**: Tests, Lint, Typecheck.
2. **Migration**: `npx prisma migrate deploy` against Staging/Prod.
3. **Build**: Next.js production build.
4. **Deploy**: Atomic swap.

## Rollback Strategy
- **Application**: Revert to previous build artifact.
- **Database**: Database snapshots or forward-only migrations. destructive rollbacks are avoided.

