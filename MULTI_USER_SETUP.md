# Multi-User Portfolio System Setup Guide

## Overview

This portfolio tracking application has been architected as a secure, multi-tenant platform where each user has a private and consistent experience. The implementation is centered around a robust Row-Level Security (RLS) model using Neon Database and Stack Authentication.

## Key Features

- **Complete Data Isolation**: Each user can only see and manage their own portfolio data
- **Row-Level Security (RLS)**: Database-level security ensures data isolation
- **Stack Authentication**: OAuth integration with Google and GitHub
- **Admin Account**: Admin users have the same data isolation as regular users (they only see their own data)
- **Dynamic Portfolio Pages**: Fully dynamic portfolio rendering for each user
- **Secure Trade Management**: All users can manage their own trades with full CRUD operations
- **Robust Error Handling**: Graceful handling of edge cases like empty portfolios

## Prerequisites

1. **Neon Database Account**: Sign up at [neon.tech](https://neon.tech)
2. **Stack Authentication Account**: Sign up at [stack-auth.com](https://stack-auth.com)
3. **Node.js 18+** and **npm/pnpm** installed

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in the required environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Stack Authentication Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_key
STACK_SECRET_SERVER_KEY=your_stack_secret_key

# Admin Configuration (optional)
ADMIN_USER_ID=your_admin_user_id

# Optional: Google AI for news summaries
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

### 2. Database Setup

#### Create the Initial Tables

```bash
npm run setup:trade-data-table
```

#### Add Multi-User Support

```bash
npm run migrate:multi-user
```

This migration will:
- Add a `user_id` column to the `trade_data` table
- Enable Row-Level Security (RLS)
- Create RLS policies for SELECT, INSERT, UPDATE, and DELETE operations
- Create necessary indexes for performance

#### Migrate Existing Data (Optional)

If you have existing trade data and want to assign it to a specific user (e.g., admin):

1. Set the `ADMIN_USER_ID` environment variable
2. Run the migration script again:

```bash
ADMIN_USER_ID=your_user_id npm run migrate:multi-user
```

### 3. Stack Authentication Setup

1. **Create a Stack Project**:
   - Go to [app.stack-auth.com](https://app.stack-auth.com)
   - Create a new project
   - Note your Project ID and API keys

2. **Configure OAuth Providers**:
   - In Stack dashboard, go to "Authentication" → "OAuth Providers"
   - Enable Google and/or GitHub OAuth
   - Add your OAuth redirect URLs:
     - Development: `http://localhost:3000/handler/stack/callback`
     - Production: `https://yourdomain.com/handler/stack/callback`

3. **Update Environment Variables**:
   - Add the Stack configuration to your `.env.local` file

### 4. Running the Application

#### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000`

#### Production Build

```bash
npm run build
npm run start
```

## Architecture Details

### Database Schema

The `trade_data` table includes:
- `user_id`: Links each trade to a specific user
- RLS policies ensure users can only access their own data
- Indexes on `user_id` for performance

### Row-Level Security (RLS)

RLS policies are implemented at the database level:

```sql
-- Users can only see their own trades
CREATE POLICY trade_data_select_policy 
ON application.trade_data 
FOR SELECT 
USING (user_id = current_setting('app.user_id', true));

-- Similar policies for INSERT, UPDATE, DELETE
```

### Authentication Flow

1. User signs in via Stack (Google/GitHub OAuth)
2. Stack creates a session cookie
3. API endpoints verify the session and extract user ID
4. Database queries are executed with user context for RLS

### API Security

All API endpoints:
- Require authentication via `requireAuth` middleware
- Filter data by authenticated user's ID
- Use `executeInUserContext` for database operations
- Return proper 401 errors for unauthenticated requests

## User Experience

### For Regular Users

- Sign up/login via Google or GitHub
- View their personal portfolio dashboard
- Manage trades (add, edit, delete)
- See portfolio performance and allocations
- All data is completely isolated from other users

### For Admin Users

- Admin users are identified by `ADMIN_USER_ID` environment variable
- **Important**: Admins see only their own portfolio data
- No special privileges to view other users' data
- Same interface and features as regular users

## Security Considerations

1. **Data Isolation**: RLS ensures complete data isolation at the database level
2. **Authentication**: All routes require authentication
3. **Authorization**: Users can only modify their own data
4. **Session Management**: Handled securely by Stack
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env` files to version control

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**:
   - Ensure Stack environment variables are set correctly
   - Check that cookies are enabled in your browser

2. **Empty portfolio for new users**:
   - This is expected behavior
   - New users start with no trades
   - Add trades via the "Trades" page

3. **Database connection errors**:
   - Verify `DATABASE_URL` is correct
   - Ensure Neon database is active
   - Check SSL mode is set to `require`

4. **RLS policy errors**:
   - Run the migration script to ensure policies are created
   - Check that `user_id` is being set in database context

### Error Handling

The system includes robust error handling for:
- Empty portfolios (returns 0 values instead of NaN)
- Missing trade data
- Failed API requests
- Invalid calculations

## Development Tips

### Testing Multi-User Functionality

1. Create multiple Stack accounts with different email addresses
2. Sign in with different accounts in different browsers/incognito windows
3. Verify data isolation by adding trades to each account
4. Confirm that each user only sees their own data

### Database Migrations

When modifying the database schema:

1. Update the migration functions in `lib/db-migrations.ts`
2. Create a new migration script in `scripts/`
3. Add the script to `package.json`
4. Document the migration in this guide

### Adding New Features

When adding features that involve user data:

1. Always filter by `user_id` in database queries
2. Use `executeInUserContext` for database operations
3. Include authentication checks in new API endpoints
4. Test with multiple user accounts

## Performance Optimization

### Caching Strategy

- User-specific caches with keys like `portfolio-history-${userId}`
- Cache invalidation on trade updates
- 20-minute TTL for portfolio data
- 5-minute TTL for volatile stock prices

### Database Indexes

Optimized indexes for common queries:
- `idx_trade_data_user_id`: Fast user filtering
- `idx_trade_data_user_date`: User trades by date
- `idx_trade_data_user_not_deleted`: Active trades per user

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Database Considerations

- Use connection pooling for production
- Monitor query performance
- Set up automated backups
- Consider read replicas for scaling

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Stack and Neon documentation
3. Check application logs for detailed error messages

## License

[Your License Here]