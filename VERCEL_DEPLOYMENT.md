# 🚀 Vercel + Railway Deployment Guide

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│     Vercel      │ ──API──▶│     Railway     │
│   (Frontend)    │         │    (Backend)    │
│   React + Vite  │         │   Express API   │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            │   (Railway)     │
                            └─────────────────┘
```

## Quick Deployment (5 minutes)

### Option 1: Automated Script
```bash
./deploy-vercel-railway.sh
```

### Option 2: Manual Steps

## 📦 Backend Deployment (Railway)

### 1. Create Railway Account
- Sign up at [railway.app](https://railway.app)
- No credit card required for $5/month free tier

### 2. Deploy Backend
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables
Add these in Railway dashboard (Settings → Variables):

```env
JWT_SECRET=<generate-with-script>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port

### 4. Get Your Railway URL
Your backend will be available at:
```
https://your-app-name.railway.app
```

## 🎨 Frontend Deployment (Vercel)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Configure Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://your-app.railway.app/api/v1
VITE_AUTH_TOKEN_KEY=steel_auth_token
```

### 3. Deploy to Vercel
```bash
# From project root
vercel --prod
```

### 4. Your Frontend URL
```
https://steel-construction-mvp.vercel.app
```

## ✅ Post-Deployment Checklist

### Immediate Actions
- [ ] Test health endpoint: `https://your-backend.railway.app/health`
- [ ] Test authentication flow
- [ ] Verify CORS is working
- [ ] Check browser console for errors

### Security Setup
- [ ] Generate new JWT_SECRET
- [ ] Update ALLOWED_ORIGINS with Vercel URL
- [ ] Enable 2FA on both accounts
- [ ] Review rate limiting settings

### Monitoring
- [ ] Check Railway logs: `railway logs`
- [ ] Check Vercel logs: Function tab in dashboard
- [ ] Set up uptime monitoring
- [ ] Configure error alerts

## 🔧 Environment Variables Reference

### Railway (Backend)
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | 64-char hex string | Generate with script |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | Auto-provided | PostgreSQL URL |
| `PORT` | Auto-provided | Server port |
| `ALLOWED_ORIGINS` | CORS origins | Vercel URLs |

### Vercel (Frontend)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://app.railway.app/api/v1` |
| `VITE_AUTH_TOKEN_KEY` | Token storage key | `steel_auth_token` |

## 🚨 Troubleshooting

### CORS Errors
```bash
# Update Railway env:
ALLOWED_ORIGINS=https://steel-construction-mvp.vercel.app,https://steel-construction-mvp-*.vercel.app
```

### Database Connection
```bash
# Railway provides PostgreSQL automatically
# Check connection:
railway logs
```

### Build Failures
```bash
# Clear cache and redeploy
vercel --force
```

### API Connection Issues
1. Verify Railway is running: Check Railway dashboard
2. Test health endpoint: `curl https://your-app.railway.app/health`
3. Check VITE_API_URL in Vercel env vars

## 🎯 Custom Domain Setup

### Vercel (Frontend)
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records

### Railway (Backend)
1. Go to Settings → Domains
2. Add custom domain
3. Update CNAME record

## 📊 Monitoring & Logs

### Railway Logs
```bash
railway logs --tail
```

### Vercel Logs
- Real-time in dashboard
- Or via CLI: `vercel logs`

## 💰 Pricing

### Railway
- **Free**: $5/month credit
- **Hobby**: $5/month
- **Pro**: $20/month
- PostgreSQL included

### Vercel
- **Hobby**: Free (personal)
- **Pro**: $20/month (commercial)
- Unlimited deployments

## 🔄 Continuous Deployment

### Auto-deploy on Git Push

#### Railway
```bash
# Connect GitHub
railway link
# Pushes auto-deploy
```

#### Vercel
```bash
# Already connected
# Pushes to main auto-deploy
```

## 📝 Database Migration

Since Railway uses PostgreSQL instead of SQLite:

1. Schema is compatible (mostly)
2. Update connection in backend:
```javascript
// Railway provides DATABASE_URL automatically
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

## 🎉 Success Metrics

Your deployment is successful when:
- ✅ Health check returns 200: `https://backend.railway.app/health`
- ✅ Frontend loads at Vercel URL
- ✅ Authentication works (register/login)
- ✅ No CORS errors in console
- ✅ API calls succeed

## 🆘 Need Help?

- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Vercel Discord**: [vercel.com/discord](https://vercel.com/discord)
- **GitHub Issues**: Open issue in your repo

---

**Quick Deploy Command:**
```bash
./deploy-vercel-railway.sh
```

This will guide you through the entire process! 🚀