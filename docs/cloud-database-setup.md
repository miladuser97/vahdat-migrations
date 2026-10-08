# Cloud Database Setup & SSL Strategy - Phase 135

## Provider Requirements
The application supports any managed PostgreSQL provider (Neon, Supabase, AWS RDS).

## SSL & Connectivity
- **SSL**: Connections to production/staging databases MUST use `sslmode=require`.
- **Pooling**: Use Prisma accelerate or a native pooler (PgBouncer) for serverless environments.

## Staging Database Initialization
1. Create a new PostgreSQL instance.
2. Set `DATABASE_URL` in the staging environment.
3. Run `npx prisma migrate deploy`.
4. Run `npx prisma db seed`.

## Verification Script
```bash
# Run this locally with Staging URL to verify connectivity
DATABASE_URL="staging_url_here" npx prisma db pull
```
