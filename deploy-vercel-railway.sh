#!/bin/bash

# Deployment Script for Vercel (Frontend) + Railway (Backend)
# This script helps deploy your Steel Construction MVP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Steel Construction MVP - Vercel + Railway Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        echo "Please install $1 first"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
check_command "git"
check_command "node"
check_command "npm"
check_command "vercel"

if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not installed. Install it? (y/n)${NC}"
    read -r install_railway
    if [ "$install_railway" = "y" ]; then
        npm install -g @railway/cli
    fi
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Step 1: Backend Deployment to Railway${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Have you created a Railway account? (y/n)"
read -r has_railway

if [ "$has_railway" != "y" ]; then
    echo -e "${YELLOW}Please create an account at https://railway.app${NC}"
    echo "Press Enter when ready..."
    read
fi

echo ""
echo -e "${YELLOW}Deploying Backend to Railway...${NC}"
echo ""

# Generate secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}Generated JWT Secret (save this securely!):${NC}"
echo "$JWT_SECRET"
echo ""

cat << EOF
${YELLOW}Railway Deployment Steps:${NC}

1. Run: ${GREEN}railway login${NC}
2. Run: ${GREEN}railway init${NC}
3. Select "Empty Project"
4. Run: ${GREEN}railway up${NC}

${YELLOW}Then add these environment variables in Railway Dashboard:${NC}

JWT_SECRET=$JWT_SECRET
NODE_ENV=production
ALLOWED_ORIGINS=https://steel-construction-mvp.vercel.app,https://steel-construction-mvp-*.vercel.app

${YELLOW}Railway will provide:${NC}
- DATABASE_URL (PostgreSQL)
- PORT (automatically)

Press Enter after Railway deployment is complete...
EOF
read

echo "Enter your Railway backend URL (e.g., https://your-app.railway.app):"
read -r RAILWAY_URL

# Update frontend environment
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Step 2: Frontend Deployment to Vercel${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

# Create temporary environment file for Vercel
cat > .env.production.local << EOF
VITE_API_URL=${RAILWAY_URL}/api/v1
VITE_AUTH_TOKEN_KEY=steel_auth_token
EOF

echo -e "${GREEN}Created .env.production.local with Railway backend URL${NC}"

echo ""
echo -e "${YELLOW}Deploying Frontend to Vercel...${NC}"
echo ""

# Check if Vercel is linked
if [ ! -d ".vercel" ]; then
    echo "Linking to Vercel project..."
    vercel link
fi

# Set environment variables in Vercel
echo -e "${YELLOW}Setting Vercel environment variables...${NC}"
vercel env add VITE_API_URL production < <(echo "${RAILWAY_URL}/api/v1")
vercel env add VITE_AUTH_TOKEN_KEY production < <(echo "steel_auth_token")

# Deploy to Vercel
echo -e "${YELLOW}Building and deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""

# Get Vercel URL
VERCEL_URL=$(vercel inspect --json | grep -o '"url": "[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}Your application is deployed!${NC}"
echo ""
echo "Frontend URL: ${GREEN}https://${VERCEL_URL}${NC}"
echo "Backend URL: ${GREEN}${RAILWAY_URL}${NC}"
echo "Health Check: ${GREEN}${RAILWAY_URL}/health${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update ALLOWED_ORIGINS in Railway to include: https://${VERCEL_URL}"
echo "2. Test the authentication flow"
echo "3. Monitor logs in both Railway and Vercel dashboards"
echo "4. Set up custom domain if desired"
echo ""

echo -e "${RED}⚠️  Security Reminders:${NC}"
echo "- Keep your JWT_SECRET secure"
echo "- Enable 2FA on Railway and Vercel accounts"
echo "- Review and update rate limiting settings"
echo "- Set up monitoring and alerts"
echo ""

# Clean up
rm -f .env.production.local

echo -e "${GREEN}Deployment script complete! 🚀${NC}"