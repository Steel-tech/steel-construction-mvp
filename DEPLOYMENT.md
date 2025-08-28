# Steel Construction MVP - Deployment Guide

## Prerequisites

1. **Supabase Account**: Create a Supabase project at [supabase.com](https://supabase.com)
2. **Node.js 18+**: Required for building the frontend
3. **Hosting Platform**: Choose Vercel, Netlify, or similar

## Supabase Setup

### 1. Create Database Schema

Execute the SQL schema in your Supabase SQL Editor:

```bash
# Copy the schema from database/supabase_schema.sql to Supabase SQL Editor
```

### 2. Configure Authentication

In your Supabase dashboard:
- Go to Authentication > Settings
- Configure your site URL and redirect URLs
- Enable email authentication
- Set up RLS policies (already included in schema)

### 3. Get API Keys

From your Supabase project dashboard:
- Copy your Project URL
- Copy your `anon` public key

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env.local
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Local Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Production Deployment

### Option 1: Vercel

1. **Connect Repository**
   - Fork this repository
   - Connect to Vercel
   - Import the project

2. **Configure Build Settings**
   ```json
   {
     "framework": "vite",
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/dist",
     "installCommand": "cd frontend && npm install"
   }
   ```

3. **Set Environment Variables**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

4. **Deploy**
   - Push to main branch or deploy manually
   - Vercel will automatically build and deploy

### Option 2: Netlify

1. **Connect Repository**
   - Fork this repository
   - Connect to Netlify

2. **Configure Build Settings**
   ```toml
   [build]
     publish = "frontend/dist"
     command = "cd frontend && npm install && npm run build"
   ```

3. **Set Environment Variables**
   - `VITE_SUPABASE_URL`: Your Supabase project URL  
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

4. **Deploy**
   - Push to main branch or deploy manually

### Option 3: Manual Deployment

```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Deploy the frontend/dist folder to your hosting service
```

## GitHub Actions CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. **Tests** the build on every push/PR
2. **Deploys previews** for pull requests
3. **Deploys to production** on main branch pushes

### Required Secrets

Add these to your GitHub repository secrets:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key  
- `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
- `NETLIFY_SITE_ID`: Your Netlify site ID

## Performance Optimizations

The production build includes:

- **Code splitting** for vendor, UI, and route-based chunks
- **Tree shaking** to remove unused code
- **Minification** with Terser
- **Console/debugger removal** in production
- **Source maps** for debugging
- **Image optimization** recommendations

## Database Schema Deployment

Ensure your Supabase database has all required tables:

```sql
-- Tables included in schema:
- profiles (user management)
- projects (project tracking)  
- piece_marks (steel pieces)
- work_orders (work management)
- deliveries & delivery_items (logistics)
- crew_assignments (field operations)
- field_activities (activity logging)
- production_workflow (manufacturing)
- quality_inspections (quality control)
```

## Monitoring and Debugging

### Performance Monitoring
- Use browser dev tools to check bundle sizes
- Monitor Core Web Vitals in production
- Set up error tracking (Sentry recommended)

### Database Monitoring
- Monitor Supabase dashboard for query performance
- Check RLS policy effectiveness  
- Monitor database size and usage

### Logs
- Check Vercel/Netlify function logs
- Monitor Supabase logs for database issues
- Set up alerts for critical errors

## Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ Environment variables properly configured
- ✅ HTTPS enforced in production
- ✅ API keys not exposed in frontend code
- ✅ User authentication required for sensitive operations
- ✅ Input validation on all forms

## Troubleshooting

### Build Errors
- Check Node.js version (18+ required)
- Verify all dependencies installed
- Check TypeScript compilation

### Runtime Errors  
- Verify environment variables set correctly
- Check Supabase connection and permissions
- Verify database schema matches application code

### Performance Issues
- Enable browser caching headers
- Use CDN for static assets
- Optimize database queries
- Implement proper loading states

## Support

For deployment issues:
1. Check the GitHub Actions logs
2. Verify environment variables
3. Test the build locally first
4. Check Supabase dashboard for database issues

## Cost Optimization

### Supabase
- Monitor database size and query usage
- Use appropriate RLS policies to limit data access
- Consider upgrading plan based on usage

### Hosting
- Vercel/Netlify free tiers work for development
- Monitor bandwidth and build minutes usage
- Consider upgrading for production workloads
