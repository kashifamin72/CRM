# CRM Production Deployment Guide

> **IMPORTANT:** This file is the single source of truth for production deployment.
> Any AI model or developer MUST read this file before making changes.
> Every deployment MUST backup the database FIRST. NEVER delete production data.

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Server Details](#2-server-details)
3. [Architecture](#3-architecture)
4. [Deployment Commands](#4-deployment-commands)
5. [Configuration Files](#5-configuration-files)
6. [Safety Rules](#6-safety-rules)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Quick Reference

### Deploy After Code Push
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
./deploy-production.sh deploy
```

### Deploy Backend Only
```bash
./deploy-production.sh deploy-api
```

### Deploy Frontend Only
```bash
./deploy-production.sh deploy-frontend
```

### Backup Database
```bash
./deploy-production.sh backup
```

---

## 2. Server Details

| Property | Value |
|----------|-------|
| **Production IP** | `216.106.182.21` |
| **Production Domain** | `crm.visionplusapps.com` |
| **SSH Username** | `kashif` |
| **SSH Password** | `#Pakistan123#` |
| **Project Path** | `/home/kashif/crm-app` |
| **GitHub Repo** | `https://github.com/kashifamin72/CRM.git` |

### Local Development Server
| Property | Value |
|----------|-------|
| **Domain** | `opencode.visionplusapps.com` |
| **Project Path** | `/home/kashif/Documents/CRM-react` |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  PRODUCTION SERVER                       │
│                  216.106.182.21                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx (Ports 80/443)                            │   │
│  │  SSL Termination + Reverse Proxy                  │   │
│  │  Domain: crm.visionplusapps.com                   │   │
│  └──────────┬────────────────────┬──────────────────┘   │
│             │                    │                       │
│  ┌──────────▼──────┐  ┌─────────▼──────────┐           │
│  │  React Frontend  │  │  .NET API Backend   │           │
│  │  (Port 80)       │  │  (Port 5000)        │           │
│  │  Container:      │  │  Container:         │           │
│  │  crm-frontend    │  │  crm-api            │           │
│  └─────────────────┘  └─────────┬──────────┘           │
│                                  │                       │
│                    ┌─────────────▼─────────────┐        │
│                    │  PostgreSQL Database       │        │
│                    │  (Port 5432 internal)      │        │
│                    │  Container: crm-postgres   │        │
│                    │  Volume: postgres-data      │        │
│                    └───────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Docker Containers (Production)
| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `crm-nginx` | nginx:alpine | 80, 443 | SSL + Reverse Proxy |
| `crm-frontend` | crm-app-frontend:latest | 80 (internal) | React SPA |
| `crm-api` | crm-app-api:latest | 5000 (internal) | .NET API |
| `crm-postgres` | postgres:16-alpine | 5432 (internal) | Database |

---

## 4. Deployment Commands

### Full Deploy (after both backend + frontend changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy"
```

### Backend Only (after C# / API changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy-api"
```

### Frontend Only (after React / TypeScript changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy-frontend"
```

### Backup Database (ALWAYS run before any deploy)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh backup"
```

### View Logs
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh logs"
```

### Check Status
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh status"
```

---

## 5. Configuration Files

### 5.1 Production docker-compose (on server: `/home/kashif/crm-app/docker-compose.production.yml`)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: crm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: CrM_Pr0d_S3cur3!2024#xK9
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - crm-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm_user -d crm_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: crm-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ConnectionStrings__DefaultConnection: Host=postgres;Port=5432;Database=crm_db;Username=crm_user;Password=CrM_Pr0d_S3cur3!2024#xK9
      Jwt__Key: Xk9mPz7vB2nQ8wR5tY3uI6oA1sD4fG7hJ0kL9zX3cV6bN8mP2qW5eR7tY1uI4o
      Jwt__Issuer: crm.visionplusapps.com
      Jwt__Audience: crm.visionplusapps.com
      Jwt__ExpirationInMinutes: "60"
      WhatsApp__WebhookUrl: http://host.docker.internal:5678/webhook/whatsapp-bridge
      AllowedOrigins: https://crm.visionplusapps.com
    volumes:
      - uploads_data:/app/wwwroot/uploads
      - dataprotection_keys:/app/keys
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - crm-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://crm.visionplusapps.com/api
    container_name: crm-frontend
    restart: unless-stopped
    networks:
      - crm-network

  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    restart: unless-stopped
    depends_on:
      - api
      - frontend
    ports:
      - "80:80"
      - "443:443"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/certbot/www:/var/www/certbot
      - nginx_cache:/var/cache/nginx
      - nginx_logs:/var/log/nginx
    networks:
      - crm-network

volumes:
  postgres-data:
    driver: local
  uploads_data:
    driver: local
  dataprotection_keys:
    driver: local
  nginx_cache:
    driver: local
  nginx_logs:
    driver: local

networks:
  crm-network:
    driver: bridge
```

### 5.2 Production .env (on server: `/home/kashif/crm-app/.env`)
```env
# Database Configuration
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=CrM_Pr0d_S3cur3!2024#xK9

# JWT Configuration
JWT_SECRET_KEY=Xk9mPz7vB2nQ8wR5tY3uI6oA1sD4fG7hJ0kL9zX3cV6bN8mP2qW5eR7tY1uI4o
JWT_ISSUER=crm.visionplusapps.com
JWT_AUDIENCE=crm.visionplusapps.com
JWT_EXPIRATION=60

# API Configuration
VITE_API_URL=https://crm.visionplusapps.com/api
ALLOWED_ORIGINS=https://crm.visionplusapps.com

# WhatsApp Integration
WHATSAPP_WEBHOOK_URL=http://host.docker.internal:5678/webhook/whatsapp-bridge
```

### 5.3 Nginx Config (on server: `/home/kashif/crm-app/nginx/nginx.conf`)
- Handles SSL termination for `crm.visionplusapps.com`
- Proxies `/api/` to `api:5000`
- Proxies `/` to `frontend:80`
- Rate limiting on API (10 req/s)
- Security headers enabled
- Let's Encrypt SSL certificates

---

## 6. Safety Rules

### RULE 1: ALWAYS Backup Before Deploy
```bash
# This runs automatically with deploy-production.sh, but for manual deploys:
docker exec crm-postgres pg_dump -U crm_user -d crm_db > /home/kashif/crm-app/backups/crm_db_$(date +%Y%m%d_%H%M%S).sql
```

### RULE 2: NEVER Delete Production Data
- NEVER run `docker volume rm` on `postgres-data`
- NEVER run `docker compose down -v` (the `-v` flag deletes volumes)
- NEVER run `DROP TABLE` or `DELETE FROM` on production database
- NEVER modify the `.env` file on production unless explicitly asked

### RULE 3: Database Schema Changes Are Safe
- EF Core migrations run automatically on API startup
- Migrations use `ALTER TABLE` (additive only, never destructive)
- New columns are nullable or have defaults
- Existing data is preserved

### RULE 4: What Changes on Deploy
| Changed | Safe? | Notes |
|---------|-------|-------|
| Backend code (C#) | YES | New DLL built, old data preserved |
| Frontend code (React) | YES | Static files replaced, no DB impact |
| Docker images | YES | Old images removed, data volumes untouched |
| Database schema (migrations) | YES | Additive only, data preserved |
| `.env` file | CAUTION | Only change if explicitly asked |
| nginx.conf | CAUTION | Can break routing if misconfigured |
| postgres-data volume | NEVER | This IS the production data |

### RULE 5: Profile Pictures
- Stored in Docker volume `uploads_data`
- Path: `/app/wwwroot/uploads/profiles/`
- NOT in git, NOT in database
- Will persist across deploys (volume mounted)
- Will be lost if volume is deleted

### RULE 6: Backups Location
- Production backups: `/home/kashif/crm-app/backups/`
- Format: `crm_db_YYYYMMDD_HHMMSS.sql`
- Retention: 30 days (auto-cleanup via cron)

---

## 7. Troubleshooting

### Container Not Starting
```bash
ssh kashif@216.106.182.21
docker logs crm-api        # Check API errors
docker logs crm-frontend   # Check frontend errors
docker logs crm-postgres   # Check database errors
docker logs crm-nginx      # Check nginx errors
```

### Database Connection Issues
```bash
docker exec crm-postgres pg_isready -U crm_user -d crm_db
docker exec crm-postgres psql -U crm_user -d crm_db -c "SELECT COUNT(*) FROM \"AspNetUsers\";"
```

### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in /home/kashif/crm-app/nginx/ssl/crm.visionplusapps.com/fullchain.pem -text -noout | grep "Not After"
```

### Restore Database from Backup
```bash
# List backups
ls -la /home/kashif/crm-app/backups/

# Restore specific backup
docker exec -i crm-postgres psql -U crm_user -d crm_db < /home/kashif/crm-app/backups/crm_db_YYYYMMDD_HHMMSS.sql
```

### Force Rebuild (if images are cached)
```bash
cd /home/kashif/crm-app
docker compose -f docker-compose.production.yml build --no-cache api
docker compose -f docker-compose.production.yml up -d api
```

---

## 8. Automated Backup

Daily backup runs at **7:00 AM** via cron:
```bash
# Cron job (already configured on production)
0 7 * * * /home/kashif/crm-app/backup-daily.sh
```

Backups are stored in `/home/kashif/crm-app/backups/` and auto-cleaned after 30 days.

---

## 9. Default Users (Production)

| Name | Email | Password | Role |
|------|-------|----------|------|
| System Admin | amin.kashif@gmail.com | Admin@123 | Administrator |
| Kashif | kashif@visionplus.com.pk | Manager@123 | Manager |
| Umer | sumer@visionplus.com.pk | Manager@123 | Manager |
| Salman | salman@visionplus.com.pk | Sales@123 | SalesOfficer |
| Abdullah | abdullah@visionplus.com.pk | Sales@123 | SalesOfficer |
| Faisal | faisal@visionplus.com.pk | Sales@123 | SalesOfficer |

---

## 10. Security

### Database Security
- PostgreSQL port **NOT exposed** to internet (only internal Docker network)
- Authentication: `scram-sha-256` for network connections
- Password changed from default to strong random password
- `pg_hba.conf` uses `trust` only for local socket (container-internal)

### Why Previous PostgreSQL Was Hacked
- Port 5432 was exposed to the internet
- Default/weak password used
- No firewall rules

### Current Protections
- PostgreSQL only accessible within Docker network (`crm-app_crm-network`)
- Only Nginx (ports 80/443) is public
- Strong database password
- Daily backups at 7:00 AM

### Never Do
- Never expose port 5432 publicly
- Never use default `postgres` password
- Never run `docker compose down -v` (deletes all data)
- Never commit `.env` to git

---

## 11. Current Production State

| Item | Value |
|------|-------|
| **Users** | 6 |
| **Leads** | 28 |
| **Lead Sources** | 12 |
| **Follow-ups** | 38 |
| **SSL Expiry** | Sep 5, 2026 |
| **Docker Compose File** | `docker-compose.production.yml` |
| **Deploy Script** | `deploy-production.sh` |
| **Backup Script** | `backup-daily.sh` (cron at 7:00 AM) |
| **DB Password** | `CrM_Pr0d_S3cur3!2024#xK9` |

---

*Last updated: June 14, 2026*
*Production server: 216.106.182.21 (crm.visionplusapps.com)*
