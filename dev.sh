#!/bin/bash

# CRM Development Script - Auto-rebuild on code changes
# Usage: ./dev.sh [command]
#
# This script runs the local development environment with hot-reload.
# Code changes are automatically detected and services rebuild.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

show_help() {
    echo -e "${BLUE}CRM Development Script${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start development environment with auto-rebuild"
    echo "  stop        Stop development environment"
    echo "  restart     Restart development environment"
    echo "  logs        View logs from all services"
    echo "  status      Show status of all services"
    echo "  build       Force rebuild all images"
    echo "  backup      Create database backup"
    echo "  help        Show this help message"
    echo ""
    echo "Features:"
    echo "  - Backend: Hot-reload with 'dotnet watch' (auto-rebuilds on .cs changes)"
    echo "  - Frontend: Vite HMR (auto-reloads on .tsx/.ts/.css changes)"
    echo "  - Database: Persistent volume (survives restarts)"
    echo ""
    echo "Access:"
    echo "  - Frontend: http://localhost:5173 (dev server)"
    echo "  - API: http://localhost:5000"
    echo "  - Nginx: http://localhost:80 (full stack)"
    echo ""
    echo "NOTE: This is for LOCAL development only."
    echo "      For production, use: ./deploy.sh deploy"
}

start_dev() {
    print_status "Starting development environment..."
    cd "$PROJECT_DIR"

    # Ensure postgres-data volume exists
    docker volume create postgres-data 2>/dev/null || true

    # Start in detached mode with auto-rebuild
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    fi

    print_status "Development environment started!"
    echo ""
    print_info "Frontend (Vite dev server): http://localhost:5173"
    print_info "API (hot-reload): http://localhost:5000"
    print_info "Nginx (full stack): http://localhost:80"
    echo ""
    print_info "Run './dev.sh logs' to watch logs"
    print_info "Code changes will auto-reload the frontend and rebuild the API"
}

stop_dev() {
    print_status "Stopping development environment..."
    cd "$PROJECT_DIR"

    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    fi

    print_status "Development environment stopped"
}

restart_dev() {
    stop_dev
    start_dev
}

logs_dev() {
    cd "$PROJECT_DIR"
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    fi
}

status_dev() {
    cd "$PROJECT_DIR"
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
    fi
}

build_dev() {
    print_status "Force rebuilding all images..."
    cd "$PROJECT_DIR"

    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    fi

    print_status "Build complete"
}

backup_db() {
    print_status "Creating database backup..."
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/crm_db_dev_$(date +%Y%m%d_%H%M%S).sql"
    docker exec crm-postgres pg_dump -U crm_user -d crm_db > "$BACKUP_FILE"
    print_status "Backup created: $BACKUP_FILE"
}

case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        logs_dev
        ;;
    status)
        status_dev
        ;;
    build)
        build_dev
        ;;
    backup)
        backup_db
        ;;
    help|*)
        show_help
        ;;
esac
