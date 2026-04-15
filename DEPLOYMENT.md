# MediClinic Deployment Guide

This guide provides step-by-step instructions to deploy MediClinic to production.

---

## Pre-Deployment Checklist

- [ ] PostgreSQL 14+ installed and running
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Domain name configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Server: Linux (Ubuntu 22.04+ recommended)
- [ ] Docker & Docker Compose installed (optional but recommended)
- [ ] 2GB+ RAM, 20GB+ storage minimum

---

## Option 1: Docker Deployment (Recommended)

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/mediclinic.git
cd mediclinic
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
nano .env

# Update these with production values:
# - DATABASE_URL: postgresql://user:password@db:5432/mediclinic
# - SECRET_KEY: (generate 256-char random string)
# - ENVIRONMENT: production
# - BACKEND_CORS_ORIGINS: ["https://yourdomain.com"]
# - STRIPE_API_KEY: (if using payments)

cd ../frontend
cp .env.example .env
nano .env

# Update:
# - VITE_API_BASE_URL: https://yourdomain.com/api/v1
```

### 4. Generate Secure Keys

```bash
# Generate a strong SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate database password
python3 -c "import secrets; print(secrets.token_urlsafe(16))"
```

### 5. Create docker-compose.prod.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mediclinic
      POSTGRES_USER: mediclinic_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mediclinic_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://mediclinic_user:${DB_PASSWORD}@db:5432/mediclinic
      SECRET_KEY: ${SECRET_KEY}
      ENVIRONMENT: production
      BACKEND_CORS_ORIGINS: '["https://yourdomain.com"]'
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    command: gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: https://yourdomain.com/api/v1
    ports:
      - "3000:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
```

### 6. Create Dockerfile for Backend

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations
RUN alembic upgrade head

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
```

### 7. Create Dockerfile for Frontend

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 8. Configure Nginx

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
    }
    
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 9. Deploy with Docker Compose

```bash
# Set environment variables
export DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")
export SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create admin user
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.services.services import create_clinic, create_user
from app.db.session import SessionLocal
from app.schemas.schemas import ClinicCreate, UserCreate
from app.models.models import UserRole

db = SessionLocal()
clinic = create_clinic(db, ClinicCreate(name='My Clinic', slug='my-clinic', email='admin@clinic.com'))
user = create_user(db, UserCreate(
    clinic_id=clinic.id,
    email='admin@clinic.com',
    password='ChangeMe123!',
    full_name='Admin User',
    role=UserRole.ADMIN
))
print(f'Clinic created: {clinic.id}')
print(f'Admin user created: {user.id}')
"
```

---

## Option 2: Manual Deployment

### 1. Install Dependencies

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build
```

### 2. Configure Database

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb mediclinic
sudo -u postgres createuser mediclinic_user
sudo -u postgres psql -c "ALTER USER mediclinic_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "ALTER ROLE mediclinic_user SET client_encoding TO 'utf8';"
```

### 3. Run Migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 4. Start Backend

```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

# Or using Systemd service
sudo nano /etc/systemd/system/mediclinic-api.service
```

```ini
[Unit]
Description=MediClinic API
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/opt/mediclinic/backend
Environment="PATH=/opt/mediclinic/backend/venv/bin"
ExecStart=/opt/mediclinic/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app.main:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### 5. Start Frontend

```bash
# Using Nginx
sudo cp nginx.conf /etc/nginx/sites-available/mediclinic
sudo ln -s /etc/nginx/sites-available/mediclinic /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## SSL/TLS Setup

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Monitoring & Maintenance

### Health Check

```bash
curl https://yourdomain.com/health
# Expected: {"status": "ok"}
```

### Database Backups

```bash
# Daily backup
0 2 * * * sudo -u postgres pg_dump mediclinic > /backups/mediclinic-$(date +\%Y\%m\%d).sql
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/mediclinic
```

```
/var/log/mediclinic/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Monitoring with Prometheus

```bash
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -U mediclinic_user -d mediclinic -h localhost

# Reset password
sudo -u postgres psql
ALTER USER mediclinic_user WITH PASSWORD 'new_password';
```

### API Not Responding

```bash
# Check logs
docker-compose logs -f backend

# Verify port
netstat -tlnp | grep 8000

# Test locally
curl http://localhost:8000/health
```

### Certificate Issues

```bash
# Renew certificate
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates
```

---

## Performance Optimization

### Database Indexing

```sql
-- These should be created automatically by alembic
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
```

### Caching with Redis

```bash
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

### CDN for Static Assets

```nginx
location /static/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## Production Checklist

- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] WAF (Web Application Firewall) enabled
- [ ] Rate limiting configured
- [ ] Monitoring & alerting set up
- [ ] Error tracking (Sentry) configured
- [ ] Log aggregation (ELK) configured
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Disaster recovery plan tested

---

## Support

For deployment issues or questions:
- 📧 Email: deployment@mediclinic.app
- 📖 Docs: https://docs.mediclinic.app
- 🐛 Issues: https://github.com/mediclinic/mediclinic/issues

