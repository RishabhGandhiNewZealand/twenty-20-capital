# Deployment Guide

This guide provides detailed instructions for deploying the Personal Portfolio Tracker application to production using Vercel.

## Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub account with the repository
- [ ] A Vercel account (free tier is sufficient)
- [ ] A Neon database account with trade data
- [ ] Node.js 18.17+ installed locally

## Deployment Options

### Option 1: Deploy with Vercel (Recommended)

The easiest way to deploy is using Vercel's GitHub integration.

#### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Verify your repository structure:**
   - Ensure `package.json` exists
   - Check that `.gitignore` excludes `.env.local`
   - Confirm all files are committed

#### Step 2: Import to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "New Project"**

3. **Import your GitHub repository:**
   - Click "Import Git Repository"
   - Select your GitHub account
   - Choose your portfolio tracker repository

4. **Configure your project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

#### Step 3: Set Up Database

1. **Create a Neon Database account at [neon.tech](https://neon.tech)**

2. **Create a new database:**
   - Click "Create Database"
   - Choose your region
   - Note your connection string

3. **Set up your trade data table:**
   - Use the Neon SQL editor or a PostgreSQL client
   - Create the `application.trade_data` table
   - Import your trade data

#### Step 4: Configure Environment Variables

1. **In your Vercel project settings, go to "Environment Variables"**

2. **Add the following variables:**

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `DATABASE_URL` | Your Neon connection string | All |
   | `GEMINI_API_KEY` | (Optional) Gemini API key | All |
   | `ADMIN_PASSWORD` | (Optional) Admin password | All |

3. **Ensure the connection string includes SSL mode for production**

#### Step 5: Deploy

1. **Click "Deploy"**
2. **Wait for the build to complete** (usually 2-3 minutes)
3. **Your app is now live!**

### Option 2: Deploy via Vercel CLI

For more control over the deployment process:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Configure settings
   - Set environment variables

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Post-Deployment Setup

### 1. Custom Domain (Optional)

1. **In Vercel project settings, go to "Domains"**
2. **Add your custom domain**
3. **Follow DNS configuration instructions**
4. **SSL certificates are automatic**

### 2. Set Up Analytics

1. **Enable Vercel Analytics:**
   - Go to project settings
   - Navigate to "Analytics"
   - Click "Enable"

2. **Verify analytics script:**
   ```tsx
   // Already included in layout.tsx
   import { Analytics } from '@vercel/analytics/react'
   ```

### 3. Configure Security Headers

Add to `next.config.mjs`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon database connection string | `postgresql://user:pass@host/db?sslmode=require` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's URL | Auto-detected |
| `ANALYZE` | Enable bundle analysis | `false` |

## Deployment Checklist

### Pre-deployment

- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Trade data CSV prepared
- [ ] Dependencies up to date
- [ ] Build runs successfully locally

### During Deployment

- [ ] Vercel project created
- [ ] Database configured
- [ ] Environment variables set
- [ ] Domain configured (if custom)
- [ ] Initial deployment successful

### Post-deployment

- [ ] Site accessible via URL
- [ ] Portfolio data loading correctly
- [ ] API endpoints responding
- [ ] Analytics enabled
- [ ] Error monitoring set up

## Updating Your Deployment

### Automatic Updates

With GitHub integration, every push to `main` triggers a new deployment:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

### Manual Deployment

Using Vercel CLI:

```bash
vercel --prod
```

### Updating Trade Data

1. **Update trade data in database via the Trades page**
2. **Or use SQL commands to bulk update data**
3. **No redeployment needed** - changes are immediate

## Rollback Procedures

### Via Vercel Dashboard

1. Go to your project's "Deployments" tab
2. Find a previous successful deployment
3. Click the three dots menu
4. Select "Promote to Production"

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## Monitoring

### 1. Vercel Dashboard

Monitor from your project dashboard:

- **Deployments**: Build status and history
- **Functions**: API route performance
- **Analytics**: Traffic and Web Vitals
- **Logs**: Real-time function logs

### 2. Error Tracking

Check function logs for errors:

```bash
vercel logs [deployment-url]
```

### 3. Performance Monitoring

- **Web Vitals**: Automatically tracked
- **API Performance**: Function execution times
- **Error Rate**: Failed requests percentage

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `Module not found`
- **Solution**: Check all imports are correct
- Run `npm install` locally
- Ensure `package.json` includes all dependencies

**Error**: `Environment variable not found`
- **Solution**: Verify all env vars are set in Vercel
- Check variable names match exactly

#### 2. Runtime Errors

**Error**: `Failed to fetch portfolio data`
- **Check**: Database connection string is correct
- **Verify**: Database is accessible and contains data
- **Test**: API routes locally first

#### 3. Performance Issues

**Slow Initial Load**
- Enable Vercel Edge Network
- Optimize images and assets
- Check bundle size with `npm run analyze`

### Debug Mode

Enable detailed logging:

```typescript
// lib/logger.ts
const DEBUG = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, data?: any) => {
    if (DEBUG) console.log(message, data)
  },
  error: (message: string, error?: any) => {
    console.error(message, error)
  }
}
```

## Production Best Practices

### 1. Security

- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set security headers
- [ ] Validate all user inputs
- [ ] Keep dependencies updated

### 2. Performance

- [ ] Enable caching where appropriate
- [ ] Optimize images
- [ ] Minimize bundle size
- [ ] Use CDN for static assets
- [ ] Enable compression

### 3. Reliability

- [ ] Set up error monitoring
- [ ] Configure alerts for failures
- [ ] Implement graceful error handling
- [ ] Regular backups of trade data
- [ ] Test rollback procedures

### 4. Maintenance

- [ ] Regular dependency updates
- [ ] Monitor security advisories
- [ ] Review performance metrics
- [ ] Update documentation
- [ ] Plan for scaling

## Scaling Considerations

As your application grows:

### 1. Optimize Build Times

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/portfolio/route.ts": {
      "maxDuration": 10
    }
  }
}
```

### 2. Configure Edge Functions

For better global performance:

```typescript
// app/api/portfolio/route.ts
export const runtime = 'edge'
```

### 3. Implement Caching

```typescript
// Cache responses
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate'
    }
  })
}
```

## Conclusion

Your Personal Portfolio Tracker is now deployed and ready to use! Remember to:

- Keep your trade data CSV updated
- Monitor performance and errors
- Regular updates and maintenance
- Backup your data regularly

For additional help, consult:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Project issues on GitHub