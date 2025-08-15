# Row Level Security (RLS) Implementation

## Overview
This document describes the Row Level Security (RLS) implementation for the portfolio application using Neon Database.

## Configuration

### Environment Variable
The application uses the `ADMIN_USER_ID` environment variable to authenticate as the admin user when accessing the `application.trade_data` table.

```bash
# .env or .env.local
ADMIN_USER_ID=your_admin_user_id_here
```

## Implementation Details

### RLS Helper Module (`lib/rls-auth.ts`)
The RLS authentication module provides functions to create authenticated database connections:

- `getAuthenticatedDb(userId)` - Creates a database connection with RLS context for a specific user
- `getAdminDb()` - Creates an admin-authenticated database connection using `ADMIN_USER_ID`
- `getUserDb(userId)` - Creates a user-specific authenticated connection
- `getAdminUserId()` - Returns the admin user ID from environment variable
- `isAdmin(userId)` - Checks if a user ID matches the admin ID

### How Authentication Works
The application uses PostgreSQL session variables to pass the authenticated user ID to RLS policies:

1. Before each query, the connection sets a session variable: `app.current_user_id`
2. RLS policies check this variable using `current_setting('app.current_user_id')`
3. Access is granted or denied based on the policy rules

### Updated Modules

#### Trade Data Cache (`lib/trade-data-cache.ts`)
- All database queries now use `getAdminDb()` for authenticated access
- Fetches trade data with proper RLS authentication

#### API Routes
All trade-related API routes have been updated to use RLS authentication:

- `/api/trades` - GET and POST operations
- `/api/trades/[id]` - PUT and DELETE operations  
- `/api/trades/batch` - Batch operations
- `/api/portfolio-current` - Portfolio data fetching (via trade-data-cache)

## Database Setup

### Prerequisites

1. **Enable RLS on the table:**
```sql
ALTER TABLE application.trade_data ENABLE ROW LEVEL SECURITY;
```

2. **Create RLS policies for admin access:**

Option A: Admin-only access policy
```sql
-- Drop existing policy if it exists
DROP POLICY IF EXISTS admin_trade_data_policy ON application.trade_data;

-- Create policy that allows access only to the admin user
CREATE POLICY admin_trade_data_policy
ON application.trade_data
FOR ALL
USING (
  current_setting('app.current_user_id', true) = 'your_admin_user_id_here'
);
```

Option B: User-specific access with admin override
```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_trade_data_policy ON application.trade_data;
DROP POLICY IF EXISTS admin_override_policy ON application.trade_data;

-- Policy for regular users (if you have a user_id column in the table)
CREATE POLICY user_trade_data_policy
ON application.trade_data
FOR SELECT
USING (
  user_id = current_setting('app.current_user_id', true)::text
);

-- Policy for admin to see all data
CREATE POLICY admin_override_policy
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

1. When the application starts, it reads the `ADMIN_USER_ID` from environment variables
2. All database queries for trade data use `getAdminDb()` which:
   - Creates a new database connection
   - Sets the session variable `app.current_user_id` with the admin user ID
   - Executes queries with proper authentication
3. The RLS policies in the database check the session variable and grant access accordingly

## Testing the Implementation

### Test RLS Policies
You can test the RLS policies directly in your database:

```sql
-- Set the session variable (simulating the application)
SELECT set_config('app.current_user_id', 'your_admin_user_id_here', false);

-- Try to query the table
SELECT * FROM application.trade_data LIMIT 10;

-- Reset the session variable and try again (should fail or return empty)
SELECT set_config('app.current_user_id', 'some_other_user', false);
SELECT * FROM application.trade_data LIMIT 10;
```

### Application Testing

1. Set the `ADMIN_USER_ID` environment variable
2. Restart the application
3. Access the portfolio pages and trades functionality
4. Verify that data loads correctly with authentication
5. Check server logs for RLS authentication messages

## Security Considerations

- **Never expose the `ADMIN_USER_ID`** in client-side code
- Keep the admin user ID secure and rotate it periodically
- Monitor database access logs for unauthorized attempts
- Use HTTPS for all API communications
- Consider implementing additional authentication layers (JWT, OAuth, etc.)

## Troubleshooting

### Common Issues

1. **"ADMIN_USER_ID not set" warning**
   - Ensure the environment variable is properly configured
   - Restart the application after setting the variable

2. **"permission denied for table trade_data"**
   - Ensure RLS is enabled on the table
   - Check that the policies are correctly configured
   - Verify the session variable is being set properly

3. **No data returned from queries**
   - Test the RLS policies directly in the database
   - Verify the admin user ID matches the policy configuration
   - Check that the session variable name matches in both code and policies

4. **"current_setting() error"**
   - Make sure to use `current_setting('app.current_user_id', true)` with the second parameter set to `true` to avoid errors when the variable is not set

## References

- [Neon RLS Documentation](https://neon.com/docs/guides/neon-rls)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Session Variables](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET)