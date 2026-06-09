# CRM Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Domain `crm.visionplusapps.com` pointing to your server IP
- Ports 80 and 443 open on your server

## Quick Start

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh deploy
```

## Deployment Options

### 1. Self-Signed Certificate (Testing)

For testing purposes, the deployment script generates a self-signed certificate automatically.

### 2. Let's Encrypt Certificate (Production)

For production, obtain a proper SSL certificate:

```bash
# First, ensure your domain points to the server
./deploy.sh ssl
```

## Manual Deployment Steps

### Step 1: Create Environment File

Copy and customize the `.env` file:

```bash
cp .env.example .env
nano .env
```

Update the following variables:
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET_KEY` - Secret key for JWT tokens (at least 32 characters)
- `WHATSAPP_WEBHOOK_URL` - WhatsApp integration URL

### Step 2: Build and Start Services

```bash
# Build all containers
docker-compose up -d --build

# Or using docker compose
docker compose up -d --build
```

### Step 3: Run Database Migrations

```bash
# Access the API container
docker exec -it crm-api bash

# Run migrations
dotnet ef database update

# Exit container
exit
```

### Step 4: Seed Initial Data

```bash
# Seed roles, users, and lead sources
docker exec crm-api dotnet run --seed
```

## Service Architecture

```
┌─────────────────────────────────────────────┐
│              Nginx (Port 80/443)            │
│         SSL Termination + Reverse Proxy     │
└─────────────┬───────────────┬───────────────┘
              │               │
    ┌─────────▼─────┐ ┌──────▼────────┐
    │  React App    │ │   .NET API    │
    │  (Port 80)    │ │   (Port 5000) │
    └───────────────┘ └───────┬───────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    │   (Port 5432)     │
                    └───────────────────┘
```

## Domain Configuration

### DNS Setup

Add these DNS records for `crm.visionplusapps.com`:

```
Type    Name                        Value           TTL
A       crm.visionplusapps.com      YOUR_SERVER_IP  300
```

### Nginx Configuration

The Nginx configuration is included in `nginx/nginx.conf`. It handles:
- SSL termination
- Reverse proxy to API and frontend
- Rate limiting
- Security headers
- Static asset caching

## Management Commands

```bash
# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Backup database
./deploy.sh backup

# Restore database
./deploy.sh restore backups/crm_db_20240101_120000.sql
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `crm_db` |
| `POSTGRES_USER` | Database user | `crm_user` |
| `POSTGRES_PASSWORD` | Database password | `SecureP@ssw0rd2024!` |
| `JWT_SECRET_KEY` | JWT secret key | `YourSuperSecretKeyAtLeast32CharactersLong!` |
| `JWT_ISSUER` | JWT issuer | `crm.visionplusapps.com` |
| `JWT_AUDIENCE` | JWT audience | `crm.visionplusapps.com` |
| `JWT_EXPIRATION` | Token expiration (minutes) | `60` |
| `VITE_API_URL` | Frontend API URL | `https://crm.visionplusapps.com/api` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://crm.visionplusapps.com` |
| `WHATSAPP_WEBHOOK_URL` | WhatsApp webhook URL | `http://n8n:5678/webhook/whatsapp-bridge` |

## Default Users

After seeding, these users are available:

| Name | Email | Password | Role |
|------|-------|----------|------|
| System Admin | amin.kashif@gmail.com | Admin@123 | Administrator |
| Kashif | kashif@visionplus.com.pk | Manager@123 | Manager |
| Umer | sumer@visionplus.com.pk | Manager@123 | Manager |
| Salman | salman@visionplus.com.pk | Sales@123 | SalesOfficer |
| Abdullah | abdullah@visionplus.com.pk | Sales@123 | SalesOfficer |
| Faisal | faisal@visionplus.com.pk | Sales@123 | SalesOfficer |

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs crm-api
docker logs crm-postgres
docker logs crm-nginx

# Check container status
docker ps -a
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it crm-postgres psql -U crm_user -d crm_db

# Check if PostgreSQL is ready
docker exec crm-postgres pg_isready -U crm_user
```

### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Regenerate self-signed certificate
rm nginx/ssl/*.pem
./deploy.sh deploy
```

### Permission Issues

```bash
# Fix upload directory permissions
sudo chown -R 1000:1000 uploads/
chmod -R 755 uploads/
```

## Production Checklist

- [ ] Change default database password
- [ ] Change JWT secret key
- [ ] Obtain Let's Encrypt SSL certificate
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Monitor container health
- [ ] Configure log rotation

## Backup Strategy

### Automated Daily Backup

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/crm-react/deploy.sh backup

# Cleanup old backups (keep 7 days)
0 3 * * * find /path/to/crm-react/backups -name "*.sql" -mtime +7 -delete
```

### Manual Backup

```bash
./deploy.sh backup
```

## Support

For issues or questions, contact:
- Email: admin@visionplusapps.com
- Website: visionplus.com.pk
