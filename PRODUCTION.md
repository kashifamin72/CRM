# CRM Production Deployment Guide

> **IMPORTANT:** This file is the single source of truth for production deployment.
> Any AI model or developer MUST read this file before making changes.
> Every deployment MUST backup the database FIRST. NEVER delete production data.
>
> The same server `216.106.182.21` currently hosts **two** isolated CRM tenants:
>
> - `https://crm.visionplusapps.com` — the **pilot** (VisionPlus), `/home/kashif/crm-app/`
> - `https://ocean.visionplusapps.com` — **first customer** (Ocean), `/home/kashif/ocean-crm/`
>
> See **§11 Multi-Tenant Architecture** for the full design and the per-tenant
> details. Most commands in this file target the **pilot** — for the Ocean
> tenant use the equivalents under `/home/kashif/ocean-crm/` (see §11.2).

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Server Details](#2-server-details)
3. [Architecture](#3-architecture)
4. [Deployment Commands](#4-deployment-commands)
5. [Configuration Files](#5-configuration-files)
6. [Safety Rules](#6-safety-rules)
7. [Troubleshooting](#7-troubleshooting)
8. [Automated Backup](#8-automated-backup)
9. [Default Users (Production)](#9-default-users-production)
10. [Security](#10-security)
11. [Multi-Tenant Architecture](#11-multi-tenant-architecture)
12. [Current Production State](#12-current-production-state)

---

## 1. Quick Reference

> The commands below target the **CRM pilot** (`crm.visionplusapps.com`,
> `/home/kashif/crm-app/`). For the **Ocean** tenant use the equivalent
> commands under `/home/kashif/ocean-crm/` — see §11.2 for the full list.

### Deploy CRM pilot (after code push)
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
./deploy-production.sh deploy
```

### Deploy CRM pilot — Backend Only
```bash
./deploy-production.sh deploy-api
```

### Deploy CRM pilot — Frontend Only
```bash
./deploy-production.sh deploy-frontend
```

### Backup CRM pilot database
```bash
./deploy-production.sh backup
```

### Deploy Ocean tenant (first customer)
```bash
ssh kashif@216.106.182.21
cd /home/kashif/ocean-crm
./deploy-ocean.sh deploy
```

### Backup Ocean database
```bash
cd /home/kashif/ocean-crm && ./deploy-ocean.sh backup
```

---

## 2. Server Details

| Property | Value |
|----------|-------|
| **Production IP** | `216.106.182.21` |
| **Production Domains** | `crm.visionplusapps.com` (pilot, VisionPlus), `ocean.visionplusapps.com` (first customer, Ocean) |
| **SSH Username** | `kashif` |
| **SSH Password** | `#Pakistan123#` |
| **Pilot project path** | `/home/kashif/crm-app` |
| **Ocean project path** | `/home/kashif/ocean-crm` |
| **GitHub Repo** | `https://github.com/kashifamin72/CRM.git` (single source for both tenants; see §11) |

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
│  │  crm-nginx  (nginx:alpine, shared reverse proxy) │   │
│  │  SSL termination for ALL tenant domains:          │   │
│  │    - crm.visionplusapps.com   → pilot            │   │
│  │    - ocean.visionplusapps.com → first customer   │   │
│  │    - (new tenants append a `server { ... }` blk) │   │
│  └──────────┬───────────────────┬──────────────────┘   │
│             │                   │                        │
│  ┌──────────▼─────────┐  ┌──────▼─────────────┐         │
│  │  Pilot (VisionPlus) │  │  Ocean (1st cust.) │         │
│  │  crm-frontend       │  │  ocean-crm-frontend│        │
│  │  crm-api            │  │  ocean-crm-api     │        │
│  │  crm-postgres       │  │  ocean-crm-postgres│        │
│  │  (crm_db / crm_user)│  │  (ocean_crm_db /   │        │
│  │                     │  │   ocean_crm_user)  │        │
│  └─────────────────────┘  └────────────────────┘        │
│   /home/kashif/crm-app/      /home/kashif/ocean-crm/     │
│   image: crm-app-*           image: ocean-crm-*          │
└─────────────────────────────────────────────────────────┘
```

### Docker Containers (Production)

The `crm-nginx` container is **shared** by all tenants. Everything else is
per-tenant and prefixed with the tenant slug so containers from different
tenants can share the `crm-app_crm-network` without collisions.

| Container | Image | Port | Tenant | Purpose |
|-----------|-------|------|--------|---------|
| `crm-nginx` | nginx:alpine | 80, 443 | (shared) | SSL + reverse proxy for every tenant domain |
| `crm-frontend` | crm-app-frontend:latest | 80 (internal) | pilot | Pilot React SPA |
| `crm-api` | crm-app-api:latest | 5000 (internal) | pilot | Pilot .NET API |
| `crm-postgres` | postgres:16-alpine | 5432 (internal) | pilot | Pilot database (`crm_db` / `crm_user`) |
| `ocean-crm-frontend` | ocean-crm-frontend:latest | 80 (internal) | ocean | Ocean React SPA |
| `ocean-crm-api` | ocean-crm-api:latest | 5000 (internal) | ocean | Ocean .NET API |
| `ocean-crm-postgres` | postgres:16-alpine | 5432 (internal) | ocean | Ocean database (`ocean_crm_db` / `ocean_crm_user`) |

For full per-tenant isolation details see **§11 Multi-Tenant Architecture**.

---

## 4. Deployment Commands

> All commands use `sshpass` so the script can be run from CI or a local
> terminal non-interactively. Run from any host that can reach
> `216.106.182.21`. Each command targets one tenant — pick the one you
> intend to deploy and **backup the matching database first** (RULE 1).

### 4.1 CRM pilot — `crm.visionplusapps.com`

#### Full Deploy (after both backend + frontend changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy"
```

#### Backend Only (after C# / API changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy-api"
```

#### Frontend Only (after React / TypeScript changes)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh deploy-frontend"
```

#### Backup Database (ALWAYS run before any deploy)
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh backup"
```

#### View Logs
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh logs"
```

#### Check Status
```bash
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/crm-app && ./deploy-production.sh status"
```

### 4.2 Ocean tenant — `ocean.visionplusapps.com` (first customer)

The same shape as the pilot, with project path `/home/kashif/ocean-crm/`
and script `./deploy-ocean.sh`:

```bash
# Full deploy
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh deploy"

# API only
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh deploy-api"

# Frontend only
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh deploy-frontend"

# Backup
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh backup"

# Logs / status
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh logs"
sshpass -p '#Pakistan123#' ssh -o StrictHostKeyChecking=no kashif@216.106.182.21 \
  "cd /home/kashif/ocean-crm && ./deploy-ocean.sh status"
```

---

## 5. Configuration Files

> Two tenants are live, each with its own `docker-compose.production.yml`
> and `.env` file. The samples below are for the **CRM pilot**; the Ocean
> tenant uses the same shape with different values, hosted under
> `/home/kashif/ocean-crm/`. The reference copies of Ocean's compose,
> deploy, and backup scripts are committed in the repo at
> `tenants/ocean-crm/`.

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
- Handles SSL termination for **all** tenant domains
- Currently routes:
  - `crm.visionplusapps.com` → `crm-api:5000` / `crm-frontend:80` (pilot)
  - `ocean.visionplusapps.com` → `ocean-crm-api:5000` / `ocean-crm-frontend:80` (first customer)
- Rate limiting on API (10 req/s)
- Security headers enabled
- Let's Encrypt SSL certificates for every tenant

### 5.4 Ocean tenant docker-compose (on server: `/home/kashif/ocean-crm/docker-compose.production.yml`)
Same structure as §5.1, with these key differences:

- **Container names** are prefixed with `ocean-crm-` (e.g. `ocean-crm-postgres`)
- **Service name** for Postgres is `ocean-postgres` (NOT `postgres`) to avoid DNS collision on the shared `crm-app_crm-network` (the API's `Host=ocean-postgres` reflects this)
- **Networks** references the shared `crm-app_crm-network` as `external: true` so `crm-nginx` can reach the new containers
- **Volume names** are prefixed with `ocean-` (e.g. `ocean-postgres-data`, `ocean-uploads_data`, `ocean-dataprotection_keys`)
- No `nginx` service — Ocean is reverse-proxied by the shared `crm-nginx`

Reference copy committed in the repo: `tenants/ocean-crm/docker-compose.production.yml`.

### 5.5 Ocean tenant .env (on server: `/home/kashif/ocean-crm/.env`)
```env
# Database Configuration (ISOLATED from the CRM pilot)
POSTGRES_DB=ocean_crm_db
POSTGRES_USER=ocean_crm_user
POSTGRES_PASSWORD=<unique strong random; never the same as the pilot's>

# JWT Configuration
JWT_SECRET_KEY=<unique 48+ char random; never the same as the pilot's>
JWT_ISSUER=ocean.visionplusapps.com
JWT_AUDIENCE=ocean.visionplusapps.com
JWT_EXPIRATION=60

# API Configuration
VITE_API_URL=https://ocean.visionplusapps.com/api
ALLOWED_ORIGINS=https://ocean.visionplusapps.com

# WhatsApp Integration
WHATSAPP_WEBHOOK_URL=http://host.docker.internal:5678/webhook/whatsapp-bridge
```

Secrets are generated with `openssl rand -base64 48 | tr -d '/+='` and stored
in `/home/kashif/ocean-crm/.env` with mode `600`. The file is **never**
committed to git.

---

## 6. Safety Rules

### RULE 1: ALWAYS Backup Before Deploy
The deploy scripts backup automatically, but for manual deploys the
exact command depends on which tenant you are touching:

```bash
# CRM pilot
docker exec crm-postgres pg_dump -U crm_user -d crm_db \
  > /home/kashif/crm-app/backups/crm_db_$(date +%Y%m%d_%H%M%S).sql

# Ocean
docker exec ocean-crm-postgres pg_dump -U ocean_crm_user -d ocean_crm_db \
  > /home/kashif/ocean-crm/backups/ocean_crm_db_$(date +%Y%m%d_%H%M%S).sql
```

### RULE 2: NEVER Delete Production Data
- NEVER run `docker volume rm` on any tenant's `*postgres-data` volume
  (e.g. `crm-app_postgres-data`, `ocean-crm_ocean-postgres-data`)
- NEVER run `docker compose down -v` (the `-v` flag deletes volumes)
- NEVER run `DROP TABLE` or `DELETE FROM` on a production database
- NEVER modify a tenant's `.env` file on production unless explicitly asked
- NEVER edit `nginx.conf` without first checking every tenant is unaffected

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
- **CRM pilot** backups: `/home/kashif/crm-app/backups/`
  - Format: `crm_db_YYYYMMDD_HHMMSS.sql`
  - Daily cron at **07:00 AM** (`/home/kashif/crm-app/backup-daily.sh`)
- **Ocean** backups: `/home/kashif/ocean-crm/backups/`
  - Format: `ocean_crm_db_YYYYMMDD_HHMMSS.sql`
  - Daily cron at **07:30 AM** (`/home/kashif/ocean-crm/backup-ocean-daily.sh`)
- Retention: **30 days** (auto-cleanup inside each backup script)

---

## 7. Troubleshooting

### Container Not Starting
```bash
ssh kashif@216.106.182.21

# CRM pilot
docker logs crm-api
docker logs crm-frontend
docker logs crm-postgres

# Ocean
docker logs ocean-crm-api
docker logs ocean-crm-frontend
docker logs ocean-crm-postgres

# Shared reverse proxy
docker logs crm-nginx
```

### Database Connection Issues
```bash
# CRM pilot
docker exec crm-postgres pg_isready -U crm_user -d crm_db
docker exec crm-postgres psql -U crm_user -d crm_db -c 'SELECT COUNT(*) FROM "AspNetUsers";'

# Ocean
docker exec ocean-crm-postgres pg_isready -U ocean_crm_user -d ocean_crm_db
docker exec ocean-crm-postgres psql -U ocean_crm_user -d ocean_crm_db -c 'SELECT COUNT(*) FROM "AspNetUsers";'
```

### SSL Certificate Issues
```bash
# CRM pilot cert
openssl x509 -in /home/kashif/crm-app/nginx/ssl/crm.visionplusapps.com/fullchain.pem -text -noout | grep "Not After"

# Ocean cert
openssl x509 -in /home/kashif/crm-app/nginx/ssl/ocean.visionplusapps.com/live/ocean.visionplusapps.com/fullchain.pem -text -noout | grep "Not After"
```

### Restore Database from Backup
```bash
# CRM pilot
ls -la /home/kashif/crm-app/backups/
docker exec -i crm-postgres psql -U crm_user -d crm_db \
  < /home/kashif/crm-app/backups/crm_db_YYYYMMDD_HHMMSS.sql

# Ocean
ls -la /home/kashif/ocean-crm/backups/
docker exec -i ocean-crm-postgres psql -U ocean_crm_user -d ocean_crm_db \
  < /home/kashif/ocean-crm/backups/ocean_crm_db_YYYYMMDD_HHMMSS.sql
```

### Force Rebuild (if images are cached)
```bash
# CRM pilot
cd /home/kashif/crm-app
docker compose -f docker-compose.production.yml build --no-cache api
docker compose -f docker-compose.production.yml up -d api

# Ocean
cd /home/kashif/ocean-crm
docker compose -f docker-compose.production.yml build --no-cache api
docker compose -f docker-compose.production.yml up -d api
```

---

## 8. Automated Backup

Two daily cron jobs are configured on the production server, one per
tenant, with a 30-minute offset to avoid simultaneous `pg_dump` runs:

```cron
# CRM pilot — daily at 07:00 AM
0 7 * * * /home/kashif/crm-app/backup-daily.sh

# Ocean (first customer) — daily at 07:30 AM
30 7 * * * /home/kashif/ocean-crm/backup-ocean-daily.sh
```

| Tenant | Backup file | Location | Cron |
|--------|-------------|----------|------|
| CRM pilot | `crm_db_YYYYMMDD_HHMMSS.sql` | `/home/kashif/crm-app/backups/` | `0 7 * * *` |
| Ocean | `ocean_crm_db_YYYYMMDD_HHMMSS.sql` | `/home/kashif/ocean-crm/backups/` | `30 7 * * *` |

Each script logs to `<backup-dir>/backup.log` and auto-deletes files older
than 30 days.

---

## 9. Default Users (Production)

Every tenant is seeded with the same six default users on first start
(`SeedDataService.SeedAsync`). They are **independent per tenant** — the
admin in the CRM pilot cannot log in to Ocean, and vice versa.

| Name | Email | Password | Role |
|------|-------|----------|------|
| System Admin | amin.kashif@gmail.com | Admin@123 | Administrator |
| Kashif | kashif@visionplus.com.pk | Manager@123 | Manager |
| Umer | sumer@visionplus.com.pk | Manager@123 | Manager |
| Salman | salman@visionplus.com.pk | Sales@123 | SalesOfficer |
| Abdullah | abdullah@visionplus.com.pk | Sales@123 | SalesOfficer |
| Faisal | faisal@visionplus.com.pk | Sales@123 | SalesOfficer |

> **Important:** change the Administrator password from `Admin@123` on
> every new tenant before giving the customer access. The seed is a
> convenience, not a security boundary.

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

## 11. Multi-Tenant Architecture

The same server hosts multiple isolated CRM instances. Each tenant has its
own:

- **Domain** (Let's Encrypt cert)
- **Project directory** under `/home/kashif/`
- **Docker containers** (prefixed with the tenant slug to avoid collisions)
- **PostgreSQL database** (own user + password)
- **JWT secret / issuer / audience** (so tokens from one tenant cannot be
  used against another)
- **Backup script + cron entry**
- **Docker volume** for postgres data, profile uploads and data-protection keys

All tenants share the **single** `crm-nginx` reverse proxy container. New
tenants are added by appending a `server { ... }` block to its
`/etc/nginx/nginx.conf` and (re)running `nginx -s reload`.

The compose files use the external `crm-app_crm-network` so nginx can reach
the new containers by name. To avoid DNS collisions on that shared network,
each tenant's postgres service is named after the tenant (e.g.
`ocean-postgres`) — never just `postgres`.

### 11.1 Tenant Inventory

| Tenant | Domain | Project Path | Stack (compose) | First Customer? |
|--------|--------|--------------|------------------|------------------|
| **CRM (pilot)** | `crm.visionplusapps.com` | `/home/kashif/crm-app` | `docker-compose.production.yml` | yes (internal pilot) |
| **Ocean CRM** | `ocean.visionplusapps.com` | `/home/kashif/ocean-crm` | `docker-compose.production.yml` | **yes (first paying customer)** |

### 11.2 Tenant: Ocean CRM (first customer)

| Property | Value |
|----------|-------|
| **Domain** | `ocean.visionplusapps.com` |
| **Project path** | `/home/kashif/ocean-crm` |
| **Compose file** | `docker-compose.production.yml` |
| **Deploy script** | `deploy-ocean.sh` |
| **Backup script** | `backup-ocean-daily.sh` (cron at **7:30 AM**, 30 min after CRM) |
| **Backup retention** | 30 days |
| **DB container** | `ocean-crm-postgres` (service name `ocean-postgres` to avoid DNS collision with the CRM tenant's `postgres`) |
| **API container** | `ocean-crm-api` |
| **Frontend container** | `ocean-crm-frontend` |
| **DB name** | `ocean_crm_db` |
| **DB user** | `ocean_crm_user` |
| **DB volume** | `ocean-crm_ocean-postgres-data` (local driver, fully isolated from CRM) |
| **Uploads volume** | `ocean-crm_ocean-uploads_data` |
| **Data Protection keys** | `ocean-crm_ocean-dataprotection_keys` |
| **JWT issuer / audience** | `ocean.visionplusapps.com` |
| **SSL** | Let's Encrypt, expires **Sep 23, 2026** (auto-renewal NOT yet scheduled — see § 11.3) |
| **SSL cert path on host** | `/home/kashif/crm-app/nginx/ssl/ocean.visionplusapps.com/live/ocean.visionplusapps.com/` (under crm-nginx's volume, but contents are tenant-scoped) |

**Deploy / operate Ocean CRM:**

```bash
ssh kashif@216.106.182.21
cd /home/kashif/ocean-crm

./deploy-ocean.sh deploy         # pull + build + restart everything
./deploy-ocean.sh deploy-api     # API only
./deploy-ocean.sh deploy-frontend
./deploy-ocean.sh status
./deploy-ocean.sh logs
./deploy-ocean.sh backup
```

**Add a new tenant — checklist:**

1. Add a DNS A record for the new domain → `216.106.182.21`
2. Copy `/home/kashif/ocean-crm` to `/home/kashif/<tenant>-crm`
3. Generate a new `POSTGRES_PASSWORD` and `JWT_SECRET_KEY` (use `openssl rand -base64 48`)
4. Edit the new tenant's `.env` (DB name, user, JWT issuer/audience, domain, ports as needed)
5. In the new tenant's `docker-compose.production.yml`, give the postgres service a tenant-specific name (e.g. `acme-postgres`) and use that name in the API's `Host=...`. This is **required** to avoid DNS collisions on the shared network.
6. Obtain the Let's Encrypt cert into `/home/kashif/crm-app/nginx/ssl/<domain>/`. Mount path inside the certbot container must be `…/certbot/www` (NOT `…/certbot`), otherwise ACME challenge files land in the wrong directory.
7. Append a new `server { listen 443 ssl; server_name <domain>; ... }` block to `/home/kashif/crm-app/nginx/nginx.conf` and `docker exec crm-nginx nginx -s reload`
8. Build & start: `cd /home/kashif/<tenant>-crm && docker compose -f docker-compose.production.yml up -d --build`
9. Add a daily backup cron entry: `30 7 * * * /home/kashif/<tenant>-crm/backup-<tenant>-daily.sh`
10. Update `PRODUCTION.md` § 11 with the new tenant

### 11.3 SSL auto-renewal (TODO)

Currently Let's Encrypt certs for both tenants were obtained manually with
`docker run certbot/certbot`. Auto-renewal via systemd timer or a
certbot-renew cron is **not yet scheduled**. Add this before the
Sep 5 / Sep 23 expiry dates — without it, the sites will start serving
expired certs.

Suggested cron entry (runs daily at 3 AM, renews any cert < 30 days from
expiry, then reloads nginx):

```cron
0 3 * * * docker run --rm -v /home/kashif/crm-app/nginx/certbot/www:/var/www/certbot -v /home/kashif/crm-app/nginx/ssl:/etc/letsencrypt certbot/certbot renew --webroot --webroot-path=/var/www/certbot && docker exec crm-nginx nginx -s reload
```

---

## 12. Current Production State

### CRM (pilot) — `crm.visionplusapps.com`

| Item | Value |
|------|-------|
| **Company name (in-app)** | `VisionPlus` (set via Branding settings) |
| **Tagline (in-app)** | `VisionPlus Technologies` |
| **Accent color** | (default `#2563eb`) |
| **Users** | 6 |
| **Leads** | 110 |
| **Lead Sources** | 12 |
| **Follow-ups** | 38+ |
| **SSL Expiry** | Sep 5, 2026 |
| **Docker Compose File** | `docker-compose.production.yml` |
| **Deploy Script** | `deploy-production.sh` |
| **Backup Script** | `backup-daily.sh` (cron at 7:00 AM) |
| **DB Password** | `CrM_Pr0d_S3cur3!2024#xK9` (see §5.1) |

### Ocean CRM (first customer) — `ocean.visionplusapps.com`

| Item | Value |
|------|-------|
| **Company name (in-app)** | `Ocean` (set via Branding settings) |
| **Tagline (in-app)** | `Ocean Sales CRM` |
| **Accent color** | `#0ea5e9` |
| **Users** | 6 (seeded, fresh) |
| **Leads** | 0 (fresh) |
| **Lead Sources** | 12 (seeded) |
| **SSL Expiry** | Sep 23, 2026 |
| **Docker Compose File** | `docker-compose.production.yml` |
| **Deploy Script** | `deploy-ocean.sh` |
| **Backup Script** | `backup-ocean-daily.sh` (cron at 7:30 AM) |

> In-app brand values (name, tagline, color, logo) are stored in the
> `TenantSettings` table and editable by any Administrator at
> `Settings → Branding` (no rebuild required).

---

*Last updated: June 25, 2026*
*Production server: 216.106.182.21 — tenants:*
- *`https://crm.visionplusapps.com` (pilot, VisionPlus)*
- *`https://ocean.visionplusapps.com` (first customer, Ocean)*
