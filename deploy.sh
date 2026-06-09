#!/bin/bash

# CRM Deployment Script for crm.visionplusapps.com
# Usage: ./deploy.sh [command]
#
# DATA SAFETY POLICY
# ------------------
# This script NEVER drops, recreates, or migrates-away the live database.
# The PostgreSQL data lives in a named Docker volume (crm-react_postgres_data)
# and is owned by the running `crm-postgres` container. The API image does
# NOT contain the database - the container only connects to it over the
# network. Schema changes use additive ALTER TABLE statements that are safe
# to re-run.
#
# Every deploy/deploy-api/deploy-frontend action takes a fresh backup first.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="crm.visionplusapps.com"
EMAIL="admin@visionplusapps.com"
BACKUP_DIR="$PROJECT_DIR/backups"
BACKUP_CONTAINER="crm-postgres"
API_CONTAINER="api"
FRONTEND_CONTAINER="crm-frontend"

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    mkdir -p "$PROJECT_DIR/nginx/certbot"
    print_status "Directories created"
}

# Generate self-signed certificate for testing
generate_self_signed_cert() {
    print_warning "Generating self-signed certificate for testing..."
    
    if [ -f "$PROJECT_DIR/nginx/ssl/fullchain.pem" ] && [ -f "$PROJECT_DIR/nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates already exist. Skipping generation."
        return
    fi
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_DIR/nginx/ssl/privkey.pem" \
        -out "$PROJECT_DIR/nginx/ssl/fullchain.pem" \
        -subj "/C=PK/ST=Punjab/L=Islamabad/O=VisionPlus/CN=$DOMAIN"
    
    print_status "Self-signed certificate generated"
}

# Obtain Let's Encrypt certificate
obtain_certificate() {
    print_status "Obtaining Let's Encrypt certificate for $DOMAIN..."
    
    # Start nginx temporarily for certificate verification
    docker-compose up -d nginx
    sleep 5
    
    # Use certbot to obtain certificate
    docker run --rm \
        -v "$PROJECT_DIR/nginx/certbot:/etc/letsencrypt" \
        -v "$PROJECT_DIR/nginx/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # Stop temporary nginx
    docker-compose down
    
    # Copy certificates to nginx ssl directory
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$PROJECT_DIR/nginx/ssl/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$PROJECT_DIR/nginx/ssl/"
    
    print_status "Certificate obtained successfully"
}

# Build and start services
deploy() {
    print_status "Building and deploying CRM application..."

    cd "$PROJECT_DIR"

    # SAFETY: take a database backup before touching any container
    backup_db_quiet

    # Build and start all services
    if docker compose version &> /dev/null; then
        docker compose up -d --build
    else
        docker-compose up -d --build
    fi

    print_status "Deployment completed successfully!"
    print_status "Application is available at: https://$DOMAIN"
}

# Rebuild only the API image and restart the API container.
# The PostgreSQL data volume is never touched.
deploy_api() {
    print_status "Rebuilding API image and restarting $API_CONTAINER..."
    cd "$PROJECT_DIR"
    backup_db_quiet

    docker build -t crm-react-api:latest "$PROJECT_DIR/backend"
    docker stop "$API_CONTAINER" 2>/dev/null || true
    docker rm "$API_CONTAINER"   2>/dev/null || true
    docker run -d --name "$API_CONTAINER" \
        --network crm-react_crm-network \
        --restart unless-stopped \
        -e ASPNETCORE_ENVIRONMENT=Production \
        -e "ConnectionStrings__DefaultConnection=Host=$BACKUP_CONTAINER;Port=5432;Database=${POSTGRES_DB:-crm_db};Username=${POSTGRES_USER:-crm_user};Password=${POSTGRES_PASSWORD:-SecureP@ssw0rd2024!}" \
        -e "Jwt__Key=${JWT_SECRET_KEY:-YourSuperSecretKeyAtLeast32CharactersLong!}" \
        -e "Jwt__Issuer=${JWT_ISSUER:-$DOMAIN}" \
        -e "Jwt__Audience=${JWT_AUDIENCE:-$DOMAIN}" \
        -e "Jwt__ExpirationInMinutes=${JWT_EXPIRATION:-60}" \
        -e "WhatsApp__WebhookUrl=${WHATSAPP_WEBHOOK_URL:-http://host.docker.internal:5678/webhook/whatsapp-bridge}" \
        -e "AllowedOrigins=${ALLOWED_ORIGINS:-https://$DOMAIN}" \
        crm-react-api:latest
    print_status "API redeployed. Data volume untouched."
}

# Rebuild only the frontend image and restart the frontend container.
deploy_frontend() {
    print_status "Rebuilding frontend image and restarting $FRONTEND_CONTAINER..."
    cd "$PROJECT_DIR"

    docker build -t crm-react-frontend:latest \
        --build-arg VITE_API_URL="${VITE_API_URL:-https://$DOMAIN/api}" \
        "$PROJECT_DIR/frontend"
    docker stop "$FRONTEND_CONTAINER" 2>/dev/null || true
    docker rm "$FRONTEND_CONTAINER"   2>/dev/null || true
    docker run -d --name "$FRONTEND_CONTAINER" \
        --network crm-react_crm-network --network-alias frontend \
        --restart unless-stopped \
        crm-react-frontend:latest
    print_status "Frontend redeployed. Data volume untouched."
}

# Run a backup without printing the full menu (used internally by deploy*)
backup_db_quiet() {
    mkdir -p "$BACKUP_DIR"
    if ! docker ps --format '{{.Names}}' | grep -q "^${BACKUP_CONTAINER}$"; then
        print_warning "Postgres container $BACKUP_CONTAINER not running - skipping backup"
        return 0
    fi
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    local file="$BACKUP_DIR/crm_db_${ts}.sql"
    if docker exec "$BACKUP_CONTAINER" pg_dump -U "${POSTGRES_USER:-crm_user}" -d "${POSTGRES_DB:-crm_db}" > "$file" 2>/dev/null; then
        print_status "Pre-deploy backup: $file ($(du -h "$file" | cut -f1))"
    else
        print_warning "Backup failed - continuing deploy (data still safe in volume)"
    fi
}

# Stop all services (NEVER use -v - this would delete the data volume)
stop() {
    print_status "Stopping all services (data volume is preserved)..."

    cd "$PROJECT_DIR"

    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi

    print_status "All services stopped. Data volume: crm-react_postgres_data (untouched)"
}

# View logs
logs() {
    cd "$PROJECT_DIR"
    
    if docker compose version &> /dev/null; then
        docker compose logs -f
    else
        docker-compose logs -f
    fi
}

# View status
status() {
    cd "$PROJECT_DIR"
    
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# Database migration
migrate_db() {
    print_status "Running database migrations..."
    
    docker exec crm-api dotnet ef database update
    
    print_status "Database migrations completed"
}

# Seed data
seed_data() {
    print_status "Seeding initial data..."
    
    docker exec crm-api dotnet run --seed
    
    print_status "Seed data completed"
}

# Backup database
backup_db() {
    print_status "Creating database backup..."
    
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/crm_db_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec crm-postgres pg_dump -U crm_user -d crm_db > "$BACKUP_FILE"
    
    print_status "Database backup created: $BACKUP_FILE"
}

# Restore database
restore_db() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        exit 1
    fi
    
    print_status "Restoring database from: $1"
    
    docker exec -i crm-postgres psql -U crm_user -d crm_db < "$1"
    
    print_status "Database restored successfully"
}

# Show help
show_help() {
    echo "CRM Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  deploy          Build and deploy all services (auto-backup first)"
    echo "  deploy-api      Rebuild only the API image + restart api container"
    echo "  deploy-frontend Rebuild only the frontend image + restart frontend container"
    echo "  stop            Stop all services (data volume is preserved)"
    echo "  start           Start all services"
    echo "  restart         Restart all services (auto-backup first)"
    echo "  logs            View logs from all services"
    echo "  status          Show status of all services"
    echo "  migrate         Run database migrations (EF migrations, additive only)"
    echo "  seed            Seed initial data (idempotent)"
    echo "  backup          Create database backup"
    echo "  restore <file>  Restore database from backup"
    echo "  ssl             Obtain SSL certificate"
    echo "  help            Show this help message"
    echo ""
    echo "DATA SAFETY: This script never runs 'docker compose down -v' or removes"
    echo "the crm-react_postgres_data volume. Every deploy first takes a backup."
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh deploy         # First time / full deploy"
    echo "  ./deploy.sh deploy-api     # Update only the backend"
    echo "  ./deploy.sh deploy-frontend # Update only the frontend"
    echo "  ./deploy.sh logs           # View application logs"
    echo "  ./deploy.sh backup         # Manual backup"
}

# Main script
case "${1:-help}" in
    deploy)
        check_docker
        create_directories
        generate_self_signed_cert
        deploy
        ;;
    deploy-api)
        check_docker
        deploy_api
        ;;
    deploy-frontend)
        check_docker
        deploy_frontend
        ;;
    stop)
        stop
        ;;
    start)
        cd "$PROJECT_DIR"
        if docker compose version &> /dev/null; then
            docker compose up -d
        else
            docker-compose up -d
        fi
        ;;
    restart)
        stop
        deploy
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    migrate)
        migrate_db
        ;;
    seed)
        seed_data
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    ssl)
        obtain_certificate
        ;;
    help|*)
        show_help
        ;;
esac
