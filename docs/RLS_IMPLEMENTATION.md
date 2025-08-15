# Row Level Security (RLS) Implementation

## Overview
This document describes the Row Level Security (RLS) implementation for the portfolio application using Neon Database. The system supports both admin access (for portfolio management) and user-specific access (for personal trade management).

## Configuration

### Environment Variables

```bash
# .env or .env.local

# Admin user ID for RLS authentication
ADMIN_USER_ID=your_admin_user_id_here

# Admin email for identifying admin users in the UI
ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# Database connection
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Database Schema Updates

### 1. Add user_id column to trade_data table

Run the migration script to add user ownership:

```bash
npm run migrate:add-user-id
# or
node scripts/add-user-id-to-trades.ts
```

This migration:
- Adds a `user_id` column to the `application.trade_data` table
- Creates indexes for efficient user-specific queries
- Assigns existing trades to the admin user (if ADMIN_USER_ID is set)

## Implementation Details

### RLS Helper Module (`lib/rls-auth.ts`)
The RLS authentication module provides functions to create authenticated database connections:

- `getAuthenticatedDb(userId)` - Creates a database connection with RLS context for a specific user
- `getAdminDb()` - Creates an admin-authenticated database connection using `ADMIN_USER_ID`
- `getUserDb(userId)` - Creates a user-specific authenticated connection
- `getDbForUser(user)` - Automatically selects admin or user DB based on user type
- `getUserIdFromStackUser(user)` - Extracts user ID from Stack authentication
- `isAdminUser(user)` - Checks if a user is admin based on email
- `getAdminUserId()` - Returns the admin user ID from environment variable
- `isAdmin(userId)` - Checks if a user ID matches the admin ID

### How Authentication Works
The application uses PostgreSQL session variables to pass the authenticated user ID to RLS policies:

1. Before each query, the connection sets a session variable: `app.current_user_id`
2. RLS policies check this variable using `current_setting('app.current_user_id')`
3. Access is granted or denied based on the policy rules

### Updated Modules

#### Trade Data Cache (`lib/trade-data-cache.ts`)
- All database queries use `getAdminDb()` for authenticated access
- Used for portfolio pages (admin-only access)

#### API Routes
All trade-related API routes support both admin and user authentication:

- `/api/trades` - GET and POST operations (user-specific)
- `/api/trades/[id]` - PUT and DELETE operations (user-specific)
- `/api/trades/batch` - Batch operations (user-specific)
- `/api/portfolio-current` - Portfolio data fetching (admin-only via trade-data-cache)

#### UI Components
- **Trades Page** (`app/trades/page.tsx`) - Supports both admin and regular users
  - Admin users see all trades
  - Regular users see only their own trades
- **Portfolio Pages** - Admin-only access using ADMIN_USER_ID

## Database Setup

### Prerequisites

1. **Enable RLS on the table:**
```sql
ALTER TABLE application.trade_data ENABLE ROW LEVEL SECURITY;
```

2. **Create RLS policies for user-specific access:**

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_own_trades_policy ON application.trade_data;
DROP POLICY IF EXISTS admin_all_trades_policy ON application.trade_data;

-- Policy for users to manage their own trades
CREATE POLICY user_own_trades_policy
ON application.trade_data
FOR ALL
USING (
  user_id = current_setting('app.current_user_id', true)
);

-- Policy for admin to see and manage all trades
CREATE POLICY admin_all_trades_policy
ON application.trade_data
FOR ALL
USING (
  current_setting('app.current_user_id', true) = 'your_admin_user_id_here'
);
```

3. **Grant necessary permissions:**
```sql
-- Grant usage on the schema
GRANT USAGE ON SCHEMA application TO authenticated;

-- Grant necessary permissions on the table
GRANT SELECT, INSERT, UPDATE, DELETE ON application.trade_data TO authenticated;

-- Grant usage on the sequence (for auto-increment ID)
GRANT USAGE, SELECT ON SEQUENCE application.trade_data_id_seq TO authenticated;
```

## How It Works

### For Admin Users (Portfolio Management)
1. Admin is identified by matching email with `ADMIN_EMAIL` environment variable
2. Queries use `getAdminDb()` which sets session context with `ADMIN_USER_ID`
3. Admin can see and manage all trades in the system
4. Portfolio pages use admin authentication to aggregate all trade data

### For Regular Users (Personal Trade Management)
1. User is authenticated via Stack authentication
2. User ID is extracted from Stack user object
3. Queries use `getUserDb(userId)` which sets session context with the user's ID
4. Users can only see and manage their own trades
5. New trades are automatically assigned to the creating user

## Testing the Implementation

### Test RLS Policies
You can test the RLS policies directly in your database:

```sql
-- Test as admin user
SELECT set_config('app.current_user_id', 'your_admin_user_id_here', false);
SELECT COUNT(*) FROM application.trade_data; -- Should see all trades

-- Test as regular user
SELECT set_config('app.current_user_id', 'user123', false);
SELECT COUNT(*) FROM application.trade_data WHERE user_id = 'user123'; -- Should only see own trades

-- Test creating a trade as user
INSERT INTO application.trade_data (code, name, user_id, ...) 
VALUES ('AAPL', 'Apple Inc.', 'user123', ...);
-- Should succeed and create trade owned by user123
```

### Application Testing

1. **Test Admin Access:**
   - Set `ADMIN_EMAIL` to your test admin email
   - Log in with that email
   - Navigate to trades page - should see "Admin Trade Management"
   - Should be able to see and manage all trades
   - Portfolio pages should work with all trade data

2. **Test User Access:**
   - Log in with a non-admin email
   - Navigate to trades page - should see "My Trades"
   - Should only see trades you created
   - Should be able to create, edit, delete only your own trades
   - Should not see admin trades

## Security Considerations

- **Never expose the `ADMIN_USER_ID`** in client-side code
- **Use `NEXT_PUBLIC_ADMIN_EMAIL`** for client-side admin detection
- Keep the admin user ID and email secure
- Monitor database access logs for unauthorized attempts
- Use HTTPS for all API communications
- Consider implementing rate limiting on trade operations
- Regular users cannot access other users' trades

## Troubleshooting

### Common Issues

1. **"ADMIN_USER_ID not set" warning**
   - Ensure the environment variable is properly configured
   - Restart the application after setting the variable

2. **"permission denied for table trade_data"**
   - Ensure RLS is enabled on the table
   - Check that the policies are correctly configured
   - Verify the session variable is being set properly

3. **Users can't see their trades**
   - Check that the user_id column exists in the table
   - Verify trades have the correct user_id assigned
   - Test the RLS policy with the user's ID directly in SQL

4. **Admin can't see all trades**
   - Verify ADMIN_USER_ID matches the policy configuration
   - Check that admin email is correctly set
   - Test the admin policy directly in SQL

5. **"current_setting() error"**
   - Make sure to use `current_setting('app.current_user_id', true)` with the second parameter set to `true`

## Migration Path

For existing applications:

1. Run the migration script to add user_id column
2. Set ADMIN_USER_ID environment variable
3. Run migration to assign existing trades to admin
4. Enable RLS and create policies
5. Test with both admin and regular user accounts
6. Monitor for any access issues

## References

- [Neon RLS Documentation](https://neon.com/docs/guides/neon-rls)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Session Variables](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET)
- [Stack Authentication Documentation](https://docs.stack-auth.com/)