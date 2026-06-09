# Database Safety & Live Data Policy

The CRM database is **production data** and must never be lost, replaced, or
corrupted by a deploy. This document explains what is safe and what is not.

## Where the data lives

| What | Where | Type |
|------|-------|------|
| PostgreSQL data files | Docker named volume `crm-react_postgres_data` | Persistent |
| Profile picture uploads | Docker named volume `crm-react_uploads_data` (mounted at `/app/wwwroot/uploads`) | Persistent |
| Data Protection keys | Docker named volume `crm-react_dataprotection_keys` (mounted at `/app/keys`) | Persistent |
| API source code | Inside `crm-react-api` image | Replaced on rebuild (no data) |
| Frontend bundle | Inside `crm-react-frontend` image | Replaced on rebuild (no data) |

The **database is NOT inside any Docker image**. It lives in a named volume on
the host's `/var/lib/docker/volumes/...` path. Replacing an image cannot
affect the database.

## What the deploy script will never do

* `docker compose down -v` / `--volumes` — would delete the volume
* `docker volume rm crm-react_postgres_data`
* `rm -rf` on `/var/lib/docker/volumes/crm-react_postgres_data`
* `EnsureDeleted()` / `DropDatabase()` — not present in the codebase
* `DROP DATABASE` / `DROP TABLE` — not present in the codebase
* `Migrate()` destroying data — only additive `ALTER TABLE … ADD COLUMN IF NOT EXISTS` is used
* Running `SeedDataService` over a non-empty database — it short-circuits if
  roles already exist

## What the deploy script does before every deploy

1. `pg_dump` the live database to `backups/crm_db_YYYYMMDD_HHMMSS.sql`
2. Build new images
3. Restart containers

If the backup step fails, deploy continues but logs a warning — the volume
itself is the source of truth.

## Schema changes

New columns on existing tables are added with:

```sql
ALTER TABLE "Leads" ADD COLUMN IF NOT EXISTS "Address" text;
ALTER TABLE "Leads" ADD COLUMN IF NOT EXISTS "City" text;
```

This is **additive only**: it never drops a column, never changes a type in a
breaking way, and is safe to run multiple times.

## How to take an extra backup manually

```bash
./deploy.sh backup
```

Output: `backups/crm_db_YYYYMMDD_HHMMSS.sql`

## How to restore from a backup

```bash
./deploy.sh restore backups/crm_db_20260609_091508.sql
```

The restore uses `psql` to load the SQL into the existing database. The
running API container does not need to be stopped (it will pick up the
restored data on its next request).

## In case of accidental data loss

1. **Stop the API** so it does not write to the damaged database:
   ```bash
   docker stop api
   ```
2. **List backups**:
   ```bash
   ls -lh backups/
   ```
3. **Restore the most recent good backup**:
   ```bash
   ./deploy.sh restore backups/crm_db_<timestamp>.sql
   ```
4. **Restart the API**:
   ```bash
   docker start api
   ```

## Emergency: bring the API up against an empty database

If the volume is somehow gone, a fresh container will use the same env vars
in `deploy.sh` (`deploy_api`). The `Program.cs` startup code uses
`EnsureCreatedAsync()` which will create an empty schema, then `SeedDataService`
will populate roles + 6 users + 12 lead sources.

To restore data after that, use the restore command above.

## Contact

admin@visionplusapps.com
