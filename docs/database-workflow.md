# Database Workflow & Migration Strategy

## Environments
- **Local**: SQLite or local PostgreSQL.
- **Staging**: Managed PostgreSQL (Neon/Supabase).
- **Production**: Managed PostgreSQL with high availability.

## Migration Flow
1. **Develop**: Modify `schema.prisma`.
2. **Local Sync**: `npx prisma migrate dev --name <description>`.
3. **Deploy to Staging/Prod**: 
   - CI/CD executes `npx prisma migrate deploy`.
   - Never use `db push` in production.

## Connection Pooling
For serverless environments (Vercel/Railway), use a connection pooler:
- Neon: Use the `-pooler` suffix in `DATABASE_URL`.
- Supabase: Use port 6543 for PgBouncer.

## Seed Strategy
- `prisma/seed.ts` uses upsert.
- Blocked in production unless `FORCE_SEED=true` is set.

## Rollback
- Perform backward-compatible changes (add column, make nullable).
- If rollback is needed, revert application code first.
