# Backup & Disaster Recovery Policy

## PostgreSQL Backups
- **Strategy**: Automated Daily Snapshots + Point-in-Time Recovery (PITR) via Managed Provider.
- **Retention**: 30 days of daily backups.
- **RPO**: < 5 minutes (via WAL archiving).
- **RTO**: < 1 hour.

## Restore Procedure
1. Identify the point of failure.
2. Select the latest healthy snapshot or timestamp.
3. Initiate restore in the Cloud Console.
4. Verify application connectivity with the restored instance.
5. Update DNS/Env Vars if the endpoint changed.

## Disaster Scenarios
- **Region Outage**: Deploy to a secondary cloud region.
- **Data Corruption**: Use PITR to roll back to a timestamp before corruption.
- **Accidental Deletion**: Restore from the latest daily snapshot.

