#!/bin/bash
# Ocean CRM Tenant - Deployment script
# Usage: ./deploy-ocean.sh [command]
#
# Customer: ocean.visionplusapps.com (FIRST multi-tenant customer of CRM)
# Database: ocean_crm_db on container ocean-crm-postgres
# Data is FULLY ISOLATED from crm.visionplusapps.com

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.production.yml"
PROJECT_DIR="/home/kashif/ocean-crm"
BACKUP_DIR="$PROJECT_DIR/backups"
PG_CONTAINER="ocean-crm-postgres"
PG_USER="ocean_crm_user"
PG_DB="ocean_crm_db"

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

backup_db() {
    mkdir -p "$BACKUP_DIR"
    local ts=$(date +%Y%m%d_%H%M%S)
    if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
        print_warning "Postgres container $PG_CONTAINER not running - skipping backup"
        return 0
    fi
    local file="$BACKUP_DIR/ocean_crm_db_${ts}.sql"
    if docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" > "$file" 2>/dev/null; then
        print_status "Backup: $file ($(du -h "$file" | cut -f1))"
    else
        print_warning "Backup failed - continuing (data still safe in volume)"
    fi
}

case "${1:-help}" in
    deploy)
        print_status "Pulling latest code..."
        cd "$PROJECT_DIR"
        git pull origin main
        backup_db
        print_status "Building and deploying ocean CRM..."
        docker compose -f $COMPOSE_FILE up -d --build
        print_status "Deployment complete! https://ocean.visionplusapps.com"
        ;;
    deploy-api)
        print_status "Pulling latest code..."
        cd "$PROJECT_DIR"
        git pull origin main
        backup_db
        print_status "Rebuilding API only..."
        docker compose -f $COMPOSE_FILE up -d --build api
        print_status "API redeployed!"
        ;;
    deploy-frontend)
        print_status "Pulling latest code..."
        cd "$PROJECT_DIR"
        git pull origin main
        print_status "Rebuilding frontend only..."
        docker compose -f $COMPOSE_FILE up -d --build frontend
        print_status "Frontend redeployed!"
        ;;
    logs)
        docker compose -f $COMPOSE_FILE logs -f
        ;;
    status)
        docker compose -f $COMPOSE_FILE ps
        ;;
    backup)
        backup_db
        ;;
    restart)
        cd "$PROJECT_DIR"
        backup_db
        docker compose -f $COMPOSE_FILE down
        docker compose -f $COMPOSE_FILE up -d --build
        print_status "Restarted!"
        ;;
    help|*)
        echo "Ocean CRM Deployment Script"
        echo "Tenant: ocean.visionplusapps.com (separate from crm.visionplusapps.com)"
        echo ""
        echo "Commands:"
        echo "  deploy           - Full deploy (pull + build all)"
        echo "  deploy-api       - Backend only"
        echo "  deploy-frontend  - Frontend only"
        echo "  logs             - View logs"
        echo "  status           - Show status"
        echo "  backup           - Database backup"
        echo "  restart          - Full restart"
        ;;
esac
