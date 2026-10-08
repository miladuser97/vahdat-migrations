# Staging Deployment Guide (Phases 104-113)

This document describes the process for deploying Tahririno to a PostgreSQL-backed staging environment.

## Infrastructure Requirements
1. **PostgreSQL 14+**
2. **Node.js 20+**
3. **Storage** (for static assets if not using public CDN)

## Environment Variables
The following variables must be set in the staging environment:
- `DATABASE_URL`: `postgresql://user:password@host:port/dbname?sslmode=require`
- `NEXT_PUBLIC_SITE_URL`: `https://staging.tahririno.ir`
- `NEXT_PUBLIC_API_URL`: `https://staging.tahririno.ir/api`
- `NODE_ENV`: `production`

## Deployment Steps

### 1. Database Migration
Run migrations before starting the new build:
```bash
npx prisma migrate deploy
```

### 2. Build the Application
```bash
npm install
npm run build
```

### 3. Start the Server
```bash
npm run start
```

## Seed Strategy (Staging)
To reset staging data with controlled fixtures:
```bash
npx prisma db seed
```
*Warning: The seed script uses upsert and will overwrite existing product/category information if slugs match.*

## Health Checks
Staging endpoint `/api/health` (to be implemented) should return 200 OK after successful connection to PostgreSQL.
