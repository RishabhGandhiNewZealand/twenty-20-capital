# Neon Database with Clerk Authentication Setup Guide

## Overview

This portfolio tracking application uses **Neon Database** with **Clerk Authentication** to provide a secure, multi-tenant platform. Each user has complete data isolation through Row-Level Security (RLS) at the database level, with authentication handled by Clerk.

## Why Neon + Clerk?

- **Neon Database**: Serverless Postgres with built-in branching, autoscaling, and excellent developer experience
- **Clerk Authentication**: Production-ready authentication with social logins, multi-factor auth, and seamless integration
- **Perfect Integration**: Clerk user IDs work directly with Neon's RLS policies for secure data isolation

## Prerequisites

1. **Neon Database Account**: Sign up at [neon.tech](https://neon.tech)
2. **Clerk Account**: Sign up at [clerk.com](https://clerk.com)
3. **Node.js 18+** and **npm/pnpm** installed

## Setup Instructions

### 1. Neon Database Setup

1. **Create a Neon Project**:
   - Go to [console.neon.tech](https://console.neon.tech)
   - Create a new project
   - Copy your connection string (it looks like: `postgresql://user:pass@host.neon.tech/dbname`)

2. **Enable Row-Level Security**:
   - Neon supports standard Postgres RLS
   - Our migration scripts will handle the RLS setup

### 2. Clerk Authentication Setup

1. **Create a Clerk Application**:
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create a new application
   - Choose your authentication methods (Google, GitHub, Email, etc.)

2. **Configure Clerk Settings**:
   - In Clerk Dashboard → **API Keys**, copy:
     - Publishable Key
     - Secret Key
   - In **Paths**, set:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in URL: `/portfolio`
     - After sign-up URL: `/portfolio`

3. **Enable Social Providers** (optional):
   - Go to **User & Authentication** → **Social Connections**
   - Enable Google, GitHub, or other providers
   - Follow Clerk's guides to set up OAuth apps

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/portfolio
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/portfolio

# Admin Configuration (optional)
ADMIN_USER_ID=user_xxxxx  # Get this from Clerk dashboard after creating admin account
ADMIN_EMAIL=admin@example.com

# Optional: Google AI for news
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

### 4. Database Migration

Run the database setup scripts:

```bash
# Install dependencies
npm install

# Create initial tables
npm run setup:trade-data-table

# Add multi-user support with RLS
npm run migrate:multi-user
```

The migration will:
- Add `user_id` column to `trade_data` table
- Enable Row-Level Security
- Create RLS policies that use Clerk user IDs
- Add performance indexes

### 5. Migrate Existing Data (Optional)

If you have existing trade data to assign to a specific user:

1. Create an account in Clerk
2. Get the user ID from Clerk Dashboard → **Users**
3. Set `ADMIN_USER_ID` in `.env.local`
4. Run: `npm run migrate:multi-user`

### 6. Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

## Architecture Details

### Database Schema with RLS

The `trade_data` table includes:
- `user_id`: Clerk user ID (e.g., `user_2abc123...`)
- RLS policies ensure users only see their own data

```sql
-- Example RLS Policy
CREATE POLICY trade_data_select_policy 
ON application.trade_data 
FOR SELECT 
USING (user_id = current_setting('app.user_id', true));
```

### Authentication Flow

1. User signs in via Clerk (OAuth or email)
2. Clerk creates a secure session
3. API routes verify the session using Clerk's middleware
4. Database queries include the Clerk user ID for RLS
5. Users only see and modify their own data

### How It Works

1. **Middleware Protection**: 
   - Clerk middleware protects routes automatically
   - Public routes are explicitly defined
   - API routes require authentication

2. **Database Queries**:
   - Each query includes the authenticated user's ID
   - RLS policies at the database level ensure data isolation
   - Even if there's a bug in the application code, RLS prevents data leaks

3. **User Experience**:
   - Sign in with Google, GitHub, or email
   - Each user has their own portfolio
   - Complete data isolation between users

## Security Features

### Multi-Layer Security

1. **Authentication Layer** (Clerk):
   - Secure session management
   - OAuth 2.0 providers
   - Multi-factor authentication support
   - Session invalidation

2. **Application Layer**:
   - API routes check authentication
   - User ID validation
   - CSRF protection

3. **Database Layer** (Neon RLS):
   - Row-Level Security policies
   - User context in every query
   - Impossible to access other users' data

### Best Practices

- Always use HTTPS in production
- Keep Clerk keys secret
- Regularly rotate API keys
- Monitor authentication logs in Clerk dashboard
- Use Neon's branching for testing

## User Management

### Regular Users

- Sign up with email or social providers
- Automatically get their own portfolio space
- Can manage their own trades
- Complete data isolation

### Admin Users

- Identified by `ADMIN_USER_ID` environment variable
- **Important**: Admins only see their own portfolio data
- No special database privileges
- Same UI as regular users

### Getting User IDs

To find a user's Clerk ID:
1. Go to Clerk Dashboard → **Users**
2. Click on the user
3. Copy the User ID (format: `user_2abc...`)

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**:
   ```bash
   # Check environment variables
   echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   echo $CLERK_SECRET_KEY
   ```

2. **Database connection errors**:
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **RLS policy errors**:
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'application';
   ```

4. **Empty portfolio for new users**:
   - This is expected - new users start with no trades
   - Add trades via the Trades page

### Debug Mode

Enable debug logging:

```env
# In .env.local
CLERK_LOGGING=true
DEBUG=*
```

### Clerk Dashboard

Monitor your application:
- **Users**: See all registered users
- **Sessions**: Active sessions
- **Logs**: Authentication events
- **Analytics**: Usage statistics

## Development Tips

### Local Development

1. Use Clerk's development instance for testing
2. Create multiple test accounts
3. Use Neon's branching for isolated testing:
   ```bash
   neon branches create --name feature-test
   ```

### Testing Multi-User

1. Open multiple browsers/incognito windows
2. Sign in with different accounts
3. Verify data isolation
4. Test concurrent updates

### Database Migrations

When updating schema:
1. Test on a Neon branch first
2. Update migration scripts in `lib/db-migrations.ts`
3. Document changes
4. Run migrations in this order:
   - Development branch
   - Staging
   - Production

## Performance Optimization

### Neon Features

- **Autoscaling**: Automatically scales compute
- **Connection Pooling**: Built-in pooler
- **Regional Deployment**: Deploy close to users

### Caching Strategy

- User-specific cache keys: `portfolio-${userId}`
- 20-minute TTL for portfolio data
- Automatic invalidation on updates

### Database Indexes

Optimized for common queries:
```sql
-- User's trades by date
CREATE INDEX idx_trade_data_user_date 
ON trade_data(user_id, date DESC);

-- Active trades per user
CREATE INDEX idx_trade_data_user_not_deleted 
ON trade_data(user_id, deleted_flag) 
WHERE deleted_flag = FALSE;
```

## Deployment

### Vercel Deployment

1. Connect GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy:
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

Add these in Project Settings → Environment Variables:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- All other Clerk URLs
- Optional: `ADMIN_USER_ID`, `GOOGLE_GENERATIVE_AI_API_KEY`

### Production Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] RLS policies verified
- [ ] Clerk production keys used
- [ ] Error monitoring configured
- [ ] Backups configured in Neon

## Monitoring

### Neon Monitoring

- Query performance in Neon console
- Connection metrics
- Storage usage
- Compute usage

### Clerk Analytics

- User growth
- Authentication methods
- Session duration
- Failed login attempts

## Support Resources

- **Neon Documentation**: [neon.tech/docs](https://neon.tech/docs)
- **Clerk Documentation**: [clerk.com/docs](https://clerk.com/docs)
- **Discord Communities**: Both Neon and Clerk have active Discord servers
- **GitHub Issues**: Report bugs in the repository

## License

[Your License Here]