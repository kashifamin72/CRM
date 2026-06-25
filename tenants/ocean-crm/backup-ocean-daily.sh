#!/bin/bash
# Daily backup for ocean.visionplusapps.com (separate from crm.visionplusapps.com)
# Runs at 7:30 AM via cron (30 min after crm-app backup to avoid overlap)

set -e

BACKUP_DIR="/home/kashif/ocean-crm/backups"
PG_CONTAINER="ocean-crm-postgres"
PG_USER="ocean_crm_user"
PG_DB="ocean_crm_db"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ocean_crm_db_${TIMESTAMP}.sql"

# Skip if container not running
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "[$(date)] Ocean CRM container $PG_CONTAINER not running - skipping backup" >> "$BACKUP_DIR/backup.log"
    exit 0
fi

# Backup
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" > "$BACKUP_FILE"

# Log
echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))" >> "$BACKUP_DIR/backup.log"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "ocean_crm_db_*.sql" -mtime +30 -delete
echo "[$(date)] Old backups cleaned" >> "$BACKUP_DIR/backup.log"
