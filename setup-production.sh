#!/bin/bash

# Production Setup Script for Steel Construction MVP
# This script helps you prepare the application for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     Steel Construction MVP - Production Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to generate secure secrets
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Function to prompt for input with default
prompt_with_default() {
    local prompt=$1
    local default=$2
    local response
    
    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Generating secure secrets...${NC}"
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)
echo -e "${GREEN}✓ Secrets generated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Production Configuration${NC}"
echo "Please provide the following information:"
echo ""

# Get production domain
DOMAIN=$(prompt_with_default "Enter your production domain (without https://)" "example.com")
API_DOMAIN=$(prompt_with_default "Enter your API domain" "api.$DOMAIN")

# Database choice
echo ""
echo "Select your database:"
echo "1) SQLite (Simple, good for small-medium projects)"
echo "2) PostgreSQL (Recommended for production)"
read -p "Choice [1-2]: " DB_CHOICE

if [ "$DB_CHOICE" = "2" ]; then
    DB_HOST=$(prompt_with_default "PostgreSQL host" "localhost")
    DB_PORT=$(prompt_with_default "PostgreSQL port" "5432")
    DB_NAME=$(prompt_with_default "Database name" "steel_construction")
    DB_USER=$(prompt_with_default "Database user" "postgres")
    read -s -p "Database password: " DB_PASS
    echo ""
    DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
else
    DATABASE_URL="sqlite:../database/steel_construction.db"
fi

# Monitoring
echo ""
read -p "Do you have a Sentry DSN for error monitoring? (y/n): " HAS_SENTRY
if [ "$HAS_SENTRY" = "y" ]; then
    read -p "Enter Sentry DSN: " SENTRY_DSN
else
    SENTRY_DSN=""
fi

echo ""
echo -e "${YELLOW}Step 3: Creating production environment files...${NC}"

# Create backend production .env
cat > backend/.env.production << EOF
# Production Environment Configuration
# Generated on $(date)

# Server Configuration
PORT=5001
NODE_ENV=production

# Security
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
SESSION_SECRET=$SESSION_SECRET

# Database Configuration
DATABASE_URL=$DATABASE_URL

# CORS Configuration
FRONTEND_URL=https://$DOMAIN
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://$API_DOMAIN

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Error Monitoring
SENTRY_DSN=$SENTRY_DSN
SENTRY_ENVIRONMENT=production

# API Configuration
API_VERSION=v1
API_PREFIX=/api
EOF

echo -e "${GREEN}✓ Backend production config created${NC}"

# Create frontend production .env
cat > frontend/.env.production << EOF
# Production Environment Configuration
# Generated on $(date)

# API Configuration
VITE_API_URL=https://$API_DOMAIN/api/v1
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_TOKEN_KEY=steel_auth_token

# Application Settings
VITE_APP_NAME="Steel Construction MVP"
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# External Services
VITE_SENTRY_DSN=$SENTRY_DSN

# Production Settings
VITE_SHOW_DEV_TOOLS=false
VITE_MOCK_API=false
EOF

echo -e "${GREEN}✓ Frontend production config created${NC}"

echo ""
echo -e "${YELLOW}Step 4: Creating deployment checklist...${NC}"

# Create deployment checklist
cat > DEPLOY_CHECKLIST.md << EOF
# Deployment Checklist - $(date +%Y-%m-%d)

## Pre-Deployment

- [ ] Run tests: \`npm test\`
- [ ] Build frontend: \`cd frontend && npm run build\`
- [ ] Run load tests: \`./load-testing/run-tests.sh smoke\`
- [ ] Backup database (if updating existing)
- [ ] Review security settings in .env.production

## SSL Setup

- [ ] Obtain SSL certificate for $DOMAIN
- [ ] Obtain SSL certificate for $API_DOMAIN
- [ ] Configure nginx with SSL
- [ ] Test HTTPS redirect

## Database

$(if [ "$DB_CHOICE" = "2" ]; then
echo "- [ ] Create PostgreSQL database: $DB_NAME
- [ ] Run migrations: \`psql -U $DB_USER -d $DB_NAME -f database/schema.sql\`
- [ ] Test database connection"
else
echo "- [ ] Ensure database directory exists
- [ ] Set proper file permissions
- [ ] Test database connection"
fi)

## Deployment

- [ ] Upload files to server
- [ ] Install dependencies: \`npm install --production\`
- [ ] Start with PM2: \`pm2 start ecosystem.config.js --env production\`
- [ ] Configure nginx reverse proxy
- [ ] Set up monitoring alerts
- [ ] Test all endpoints
- [ ] Verify health checks: https://$API_DOMAIN/health

## Post-Deployment

- [ ] Monitor error logs for first 24 hours
- [ ] Check performance metrics
- [ ] Verify backup system
- [ ] Document any issues

## Important URLs

- Frontend: https://$DOMAIN
- API: https://$API_DOMAIN
- Health Check: https://$API_DOMAIN/health
- API Docs: https://$API_DOMAIN/api/v1

## Secrets Backup

⚠️ **IMPORTANT**: Store these securely and never commit to git!

- JWT_SECRET: $JWT_SECRET
- SESSION_SECRET: $SESSION_SECRET
$(if [ "$DB_CHOICE" = "2" ]; then
echo "- DATABASE_URL: $DATABASE_URL"
fi)
EOF

echo -e "${GREEN}✓ Deployment checklist created${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Production setup complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the generated .env.production files"
echo "2. Follow the DEPLOY_CHECKLIST.md"
echo "3. Set up SSL certificates"
echo "4. Deploy to your server"
echo ""
echo -e "${RED}⚠️  Security Reminders:${NC}"
echo "- Never commit .env.production files to git"
echo "- Keep your JWT_SECRET secure"
echo "- Use HTTPS in production"
echo "- Enable firewall on your server"
echo "- Set up regular backups"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"