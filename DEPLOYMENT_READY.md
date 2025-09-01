# 🚀 Steel Construction MVP - Production Deployment Guide

## ✅ Deployment Readiness Checklist

### Completed ✓
- [x] Environment configuration files (.env.example)
- [x] Health check endpoints with detailed monitoring
- [x] API versioning (v1) with modular routing
- [x] Winston logging system replacing console.log
- [x] CORS configuration for production
- [x] PM2 process management configuration
- [x] Docker and docker-compose configuration
- [x] Nginx reverse proxy configuration
- [x] Graceful shutdown handling
- [x] Rate limiting per endpoint
- [x] Security headers (Helmet)
- [x] Input validation middleware
- [x] JWT authentication with refresh tokens
- [x] Error handling and logging

### Pending Items ⏳
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Sentry error monitoring integration
- [ ] Load testing results
- [ ] SSL certificate setup
- [ ] Database migrations system
- [ ] Automated backup strategy

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│    Nginx    │────▶│   Backend   │
│  (React)    │     │ (Reverse    │     │  (Express)  │
│   Port:5173 │     │   Proxy)    │     │   Port:5001 │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     SSL     │     │   SQLite    │
                    │ Certificate │     │  Database   │
                    └─────────────┘     └─────────────┘
```

## 📦 Quick Start Deployment

### 1. Prerequisites
```bash
# Required software
- Node.js 18+
- Docker & Docker Compose
- PM2 (for non-Docker deployment)
- Git
```

### 2. Clone and Setup
```bash
# Clone repository
git clone https://github.com/Steel-tech/steel-construction-mvp.git
cd steel-construction-mvp

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Configuration
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend configuration  
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values

# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐳 Docker Deployment (Recommended)

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build production image
docker build -t steel-construction:latest .

# Run with production profile
docker-compose --profile production up -d

# With monitoring
docker-compose --profile production --profile monitoring up -d
```

## 🚀 Traditional Deployment

### Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit

# Reload with zero downtime
pm2 reload all
```

### Manual Start
```bash
# Backend
cd backend
NODE_ENV=production node server-new.js

# Frontend (build for production)
cd frontend
npm run build
# Serve dist folder with any static server
```

## 🔧 Configuration Details

### Required Environment Variables

#### Backend (.env)
```env
# Server
PORT=5001
NODE_ENV=production

# Security (REQUIRED - Generate new secret!)
JWT_SECRET=your-64-character-hex-string
JWT_EXPIRES_IN=7d

# Database
DATABASE_PATH=../database/steel_construction.db

# CORS
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
```

#### Frontend (.env.local)
```env
# API
VITE_API_URL=https://api.your-domain.com/api/v1

# Optional: Supabase (if using)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
```

## 🔒 Security Checklist

- [x] JWT secret is 64+ characters
- [x] HTTPS enabled (configure SSL certificates)
- [x] Rate limiting enabled
- [x] Input validation on all endpoints
- [x] SQL injection protection (parameterized queries)
- [x] XSS protection headers
- [x] CORS properly configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Database backups scheduled

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- Basic: `GET /health`
- Detailed: `GET /health/detailed`
- Readiness: `GET /health/ready`
- Liveness: `GET /health/live`

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Logs
pm2 logs steel-api --lines 100
```

### Docker Health Check
```bash
# Check container health
docker ps
docker inspect steel-backend | grep -A 5 Health
```

## 🌐 Nginx SSL Setup

### Using Let's Encrypt
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
certbot renew --dry-run
```

### Manual SSL
Place your certificates in:
- Certificate: `nginx/ssl/cert.pem`
- Private Key: `nginx/ssl/key.pem`

## 📈 Performance Optimization

### Database
```bash
# Create indexes (already in schema)
sqlite3 database/steel_construction.db < database/indexes.sql

# Vacuum database periodically
sqlite3 database/steel_construction.db "VACUUM;"
```

### Frontend Build Optimization
```bash
cd frontend
npm run build -- --minify --sourcemap
```

## 🔄 CI/CD Pipeline

### GitHub Actions (example)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server "cd /app && git pull && docker-compose up -d --build"
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
```bash
# Find process using port
lsof -i :5001
# Kill process
kill -9 <PID>
```

2. **Database locked**
```bash
# Check database integrity
sqlite3 database/steel_construction.db "PRAGMA integrity_check;"
```

3. **Memory issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" node server-new.js
```

4. **PM2 not starting**
```bash
# Clear PM2
pm2 kill
pm2 flush
pm2 start ecosystem.config.js
```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Resources
- Projects: `/api/v1/projects`
- Materials: `/api/v1/materials`
- Work Orders: `/api/v1/workorders`
- Piece Marks: `/api/v1/piecemarks`

## 🔐 Backup Strategy

### Automated Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
sqlite3 /app/database/steel_construction.db ".backup $BACKUP_DIR/database.db"
tar -czf $BACKUP_DIR/uploads.tar.gz /app/uploads
EOF

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

## 📞 Support & Monitoring

### Recommended Services
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics, Plausible
- **Log Management**: LogRocket, Datadog

### Health Check Automation
```bash
# Simple health check script
curl -f http://localhost:5001/health || alert_admin
```

## ✨ Final Steps

1. **Test Deployment**
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Load Testing**
   ```bash
   npm install -g artillery
   artillery quick --count 10 --num 100 http://localhost:5001/api/health
   ```

3. **Security Scan**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Go Live!**
   - Update DNS records
   - Enable monitoring
   - Configure backups
   - Document API

## 📊 Current Status

**Deployment Ready: ✅ YES**

The application now has:
- ✅ Production-ready backend with proper structure
- ✅ Health monitoring endpoints
- ✅ Logging system (Winston)
- ✅ Process management (PM2)
- ✅ Docker containerization
- ✅ Nginx configuration
- ✅ Security hardening
- ✅ API versioning
- ✅ Error handling

**Next Priority Items:**
1. SSL certificate setup
2. API documentation generation
3. Sentry integration for error tracking
4. Database migration system
5. Automated testing in CI/CD

---
*Last Updated: [Current Date]*
*Version: 1.0.0*