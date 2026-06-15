# CRM Production Deployment Plan

## Architecture

```
Development Server (opencode.visionplusapps.com)
├── Git Push → GitHub
└── Database backups (manual)

Production Server (216.106.182.21 / crm.visionplusapps.com)
├── Git Pull → Build → Deploy
├── Nginx Proxy Manager (SSL + Reverse Proxy)
├── .NET API Backend
├── React Frontend
└── PostgreSQL Database
```

## Servers

| Server | IP | Domain | Purpose |
|--------|-----|--------|---------|
| Development | Current | opencode.visionplusapps.com | Local development |
| Production | 216.106.182.21 | crm.visionplusapps.com | Live application |

## First-Time Setup (Production Server)

### 1. Clone Repository
```bash
ssh kashif@216.106.182.21
cd /home/kashif
git clone <your-github-repo-url> crm-app
cd crm-app
```

### 2. Create Production Environment File
```bash
cp .env.example .env
nano .env
```

Production `.env` values:
```env
# Database
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=<strong-random-password>

# JWT
JWT_SECRET_KEY=<64-char-random-key>
JWT_ISSUER=crm.visionplusapps.com
JWT_AUDIENCE=crm.visionplusapps.com
JWT_EXPIRATION=60

# API
VITE_API_URL=https://crm.visionplusapps.com/api
ALLOWED_ORIGINS=https://crm.visionplusapps.com

# WhatsApp
WHATSAPP_WEBHOOK_URL=http://host.docker.internal:5678/webhook/whatsapp-bridge
```

### 3. Deploy
```bash
./deploy.sh deploy
```

## Update Deployment (After Git Push)

### Backend Only (after C# changes)
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
git pull origin main
./deploy.sh deploy-api
```

### Frontend Only (after React changes)
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
git pull origin main
./deploy.sh deploy-frontend
```

### Full Deploy (after both changes)
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
git pull origin main
./deploy.sh deploy
```

### Database Schema Changes Only
```bash
ssh kashif@216.106.182.21
cd /home/kashif/crm-app
git pull origin main
./deploy.sh deploy-api   # API runs migrations on startup
```

## File Structure on Production

```
/home/kashif/crm-app/
├── backend/              # .NET API source
├── frontend/             # React source
├── nginx/                # Nginx config
├── docker-compose.yml    # Service definitions
├── deploy.sh             # Deployment script
├── .env                  # Production environment (NOT in git)
└── backups/              # Database backups
```

## Environment Differences

| Setting | Development | Production |
|---------|-------------|------------|
| Domain | opencode.visionplusapps.com | crm.visionplusapps.com |
| SSL | Let's Encrypt | Let's Encrypt (Nginx Proxy Manager) |
| Database | PostgreSQL (local) | PostgreSQL (Docker) |
| WhatsApp | n8n webhook | n8n webhook (if available) |

## Backup Strategy

### Manual Backup
```bash
./deploy.sh backup
```

### Automated Daily Backup (add to crontab)
```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * cd /home/kashif/crm-app && ./deploy.sh backup >> /home/kashif/crm-app/backups/cron.log 2>&1

# Cleanup old backups (keep 30 days)
0 3 * * * find /home/kashif/crm-app/backups -name "*.sql" -mtime +30 -delete
```

### Restore from Backup
```bash
./deploy.sh restore backups/crm_db_YYYYMMDD_HHMMSS.sql
```

## SSL Certificate

Using Nginx Proxy Manager (already installed):
1. Access admin panel at http://216.106.182.21:81
2. Login: admin@example.com / changeme
3. Add Proxy Host: crm.visionplusapps.com → crm-frontend:80
4. Enable SSL with Let's Encrypt

## Troubleshooting

### Check Container Status
```bash
docker ps -a
```

### View Logs
```bash
docker logs crm-api
docker logs crm-frontend
docker logs crm-postgres
```

### Restart Services
```bash
./deploy.sh stop
./deploy.sh start
```

### Database Connection Test
```bash
docker exec crm-postgres pg_isready -U crm_user -d crm_db
```

## Security Notes

- `.env` file contains secrets - NEVER commit to Git
- PostgreSQL port only exposed internally (127.0.0.1:5433)
- API port only exposed internally (5000)
- Only ports 80 and 443 exposed publicly
- Nginx Proxy Manager handles SSL termination
