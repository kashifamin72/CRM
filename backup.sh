#!/bin/bash
# ============================================================
# CRM Daily Database Backup Script
# Runs at 11:00 PM daily via cron
# Backs up PostgreSQL database and sends WhatsApp notification
# ============================================================

set -e

# ---------- CONFIGURATION ----------
BACKUP_DIR="/home/kashif/Documents/CRM-react/backups"
CONTAINER_NAME="crm-postgres"
DB_NAME="crm_db"
DB_USER="postgres"
RETENTION_DAYS=30
WHATSAPP_NUMBER="923004320015"
WEBHOOK_URL="http://localhost:5678/webhook/whatsapp-bridge"
LOG_FILE="$BACKUP_DIR/backup.log"

# ---------- PREPARE ----------
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/crm_db_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_whatsapp() {
    local message="$1"
    # Escape special characters for JSON
    local escaped_message=$(echo "$message" | jq -Rs '.')
    local payload="{\"chatId\":\"${WHATSAPP_NUMBER}@s.whatsapp.net\",\"text\":${escaped_message}}"

    local response=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 30 2>&1)

    if echo "$response" | grep -q '"status":true\|"success":true\|"ok":true'; then
        log "WhatsApp notification sent: $response"
        return 0
    else
        log "WhatsApp send warning (message may still be queued): $response"
        return 1
    fi
}

# ---------- START BACKUP ----------
log "=== Backup started ==="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "ERROR: Container $CONTAINER_NAME is not running"
    send_whatsapp "❌ *CRM Backup FAILED*

Container ${CONTAINER_NAME} is not running.
Please check the server." || true
    exit 1
fi

# Create backup
log "Creating backup: $BACKUP_FILE"
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists > "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    log "Dump created successfully"
else
    log "ERROR: pg_dump failed"
    send_whatsapp "❌ *CRM Backup FAILED*

pg_dump command failed.
Check logs: ${LOG_FILE}" || true
    exit 1
fi

# Compress backup
log "Compressing backup..."
gzip -f "$BACKUP_FILE"
FINAL_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
log "Compressed size: $FINAL_SIZE"

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE_GZ" 2>/dev/null; then
    log "Backup integrity verified"
else
    log "ERROR: Backup file is corrupted"
    send_whatsapp "❌ *CRM Backup CORRUPTED*

File: $(basename $BACKUP_FILE_GZ)
Please check immediately." || true
    exit 1
fi

# Get backup statistics
RECORD_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT
        (SELECT count(*) FROM \"Leads\") || ' Leads, ' ||
        (SELECT count(*) FROM \"FollowUps\") || ' Follow-ups, ' ||
        (SELECT count(*) FROM \"AspNetUsers\") || ' Users'
" 2>/dev/null | xargs)

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED=$(find "$BACKUP_DIR" -name "crm_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Deleted $DELETED old backup(s)"

# Count remaining backups
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/crm_db_*.sql.gz 2>/dev/null | wc -l)
DISK_USAGE=$(du -sh "$BACKUP_DIR" | cut -f1)

# ---------- SUCCESS NOTIFICATION ----------
log "=== Backup completed successfully ==="

MESSAGE="✅ *CRM Daily Backup Complete*

📅 Date: $(date '+%Y-%m-%d %H:%M')
📦 File: $(basename $BACKUP_FILE_GZ)
💾 Size: $FINAL_SIZE
📊 Data: $RECORD_COUNT
📁 Total backups: $TOTAL_BACKUPS
💿 Disk usage: $DISK_USAGE
🗑️ Cleaned: $DELETED old file(s)"

send_whatsapp "$MESSAGE" || true
exit 0
