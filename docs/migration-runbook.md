# Database Migration Runbook

## Overview
This project uses versioned Prisma migrations. 

## Local Development
1. Modify `prisma/schema.prisma`.
2. Generate migration: `npx prisma migrate dev --name <description>`.

## Staging / Production Deployment
1. Deployment pipeline triggers.
2. Build phase validates schema.
3. Pre-deploy phase: `npx prisma migrate deploy`.

## Rollback
1. Identify failing migration.
2. Revert application code.
3. If schema is backward-compatible, leave DB as is.
4. If destructive, restore from daily backup.
