# CRM Application

A Customer Relationship Management system built with React, .NET 10 Web API, and PostgreSQL.

## Quick Start

### Local Development (Auto-rebuild)

```bash
# Start development environment with hot-reload
./dev.sh start

# View logs
./dev.sh logs

# Stop development environment
./dev.sh stop
```

**Features:**
- **Backend**: Hot-reload with `dotnet watch` (auto-rebuilds on .cs changes)
- **Frontend**: Vite HMR (auto-reloads on .tsx/.ts/.css changes)
- **Database**: Persistent PostgreSQL volume

**Access:**
- Frontend (Vite dev server): http://localhost:5173
- API (hot-reload): http://localhost:5000
- Nginx (full stack): http://localhost:80

### Production Deployment (Explicit only)

```bash
# Deploy to production (requires confirmation)
./deploy.sh deploy

# Deploy only API
./deploy.sh deploy-api

# Deploy only frontend
./deploy.sh deploy-frontend
```

**⚠️ WARNING:** Production deployment requires explicit confirmation. Always backup before deploying!

## Available Scripts

### Development (`dev.sh`)
- `./dev.sh start` - Start development environment
- `./dev.sh stop` - Stop development environment
- `./dev.sh restart` - Restart development environment
- `./dev.sh logs` - View logs from all services
- `./dev.sh status` - Show status of all services
- `./dev.sh build` - Force rebuild all images
- `./dev.sh backup` - Create database backup

### Production (`deploy.sh`)
- `./deploy.sh deploy` - Deploy all services to production
- `./deploy.sh deploy-api` - Deploy API to production
- `./deploy.sh deploy-frontend` - Deploy frontend to production
- `./deploy.sh stop` - Stop all services
- `./deploy.sh start` - Start all services
- `./deploy.sh restart` - Restart all services
- `./deploy.sh logs` - View logs
- `./deploy.sh status` - Show status
- `./deploy.sh backup` - Create database backup
- `./deploy.sh restore <file>` - Restore from backup

## Architecture

```
├── frontend/          # React (Vite) + TypeScript
├── backend/           # .NET 10 Web API
├── nginx/             # Nginx reverse proxy config
├── docker-compose.yml # Production services
├── docker-compose.dev.yml # Development override (hot-reload)
├── dev.sh             # Development script
└── deploy.sh          # Production deployment script
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET_KEY=your_32_char_secret_key
JWT_ISSUER=opencode.visionplusapps.com
JWT_AUDIENCE=opencode.visionplusapps.com
JWT_EXPIRATION=60

# API
VITE_API_URL=https://opencode.visionplusapps.com/api
ALLOWED_ORIGINS=https://opencode.visionplusapps.com

# WhatsApp
WHATSAPP_WEBHOOK_URL=http://n8n:5678/webhook/whatsapp-bridge
```

## Data Safety

- **NEVER** run `docker compose down -v` (deletes volumes/data)
- Production deployments always create backups first
- Database schema changes only via additive EF Core migrations
- PostgreSQL data lives in named Docker volumes

## License

© 2026 Visionplus Technologies Pvt.
