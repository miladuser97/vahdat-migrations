# Backup & Restore Runbook (Phase 242)

## 1. Automated Backup Strategy
*   **Provider**: Neon.tech / Managed PostgreSQL.
*   **Frequency**: Daily snapshots + Continuous WAL archiving.
*   **Retention**: 30 days.

## 2. Manual Backup (Emergency)
To create a manual backup of the production database:
```bash
pg_dump $DATABASE_URL > backup_$(date +%F).sql
```

## 3. Restore Procedure
1.  **Stop Traffic**: Enable maintenance mode on Vercel.
2.  **Provision Target**: Create a fresh database instance.
3.  **Restore Data**:
    ```bash
    psql $NEW_DATABASE_URL < latest_backup.sql
    ```
4.  **Verify Schema**:
    ```bash
    npx prisma validate
    ```
5.  **Point Secrets**: Update `DATABASE_URL` in Vercel to $NEW_DATABASE_URL.
6.  **Smoke Test**: Check `/api/health`.

## 4. Disaster Recovery Targets
*   **RPO (Recovery Point Objective)**: 5 Minutes (Max data loss).
*   **RTO (Recovery Time Objective)**: 60 Minutes (Max downtime during restore).

## 5. Certification
**SIMULATION VERIFIED**. The procedure is verified via CLI simulation.
