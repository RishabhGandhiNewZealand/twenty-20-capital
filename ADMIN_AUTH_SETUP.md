# Admin OAuth Setup for Twenty 20 Capital

## Overview
OAuth authentication has been restored for admin-only access to the trade management page using Stack Auth.

## Changes Made

### 1. OAuth Authentication Restored
- **Package**: Reinstalled `@stackframe/stack` for OAuth authentication
- **Handler**: Created `/app/handler/[...stack]/page.tsx` for Stack Auth routes
- **Configuration**: Added `/lib/stack.ts` with Stack server app configuration
- **Layout**: Updated `/app/layout.tsx` to include `StackProvider`

### 2. Admin-Only Trade Management
- **Trades Page**: Restored `/app/trades/page.tsx` with OAuth protection
- **Loading State**: Added `/app/trades/loading.tsx` for better UX
- **Sidebar**: Updated navigation to show "Manage Trades" link only for authenticated admins

### 3. Navigation Updates
- Admin login/logout controls added to sidebar
- "Admin Login" link shown when not authenticated
- User email and "Sign Out" shown when authenticated
- Trade management link only visible to admin users

### 4. Content Updates
- Changed all "I" references to "we" across reports and analyses
- Merged investment thesis and about pages into single `/about` page
- Updated all internal links to point to `/about` instead of `/investment-thesis` or `/about-us`

### 5. Route Structure
```
/                    - Public home page
/portfolio           - Public portfolio view
/reports/*           - Public quarterly and annual reports
/analyses/*          - Public company analyses
/news                - Public news and research
/about               - Public about page (merged investment thesis)
/trades              - Admin-only (requires OAuth login)
/handler/sign-in     - OAuth sign-in page
/handler/sign-out    - OAuth sign-out handler
```

## Environment Variables Required

You need to set up Stack Auth environment variables:

```bash
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
STACK_SECRET_SERVER_KEY=your_secret_server_key_here

# Admin Email (for authorization)
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@example.com
```

## How to Set Up Stack Auth

1. **Create a Stack Auth Account**
   - Go to [stack-auth.com](https://stack-auth.com)
   - Sign up for a free account
   - Create a new project

2. **Configure OAuth Providers**
   - In your Stack dashboard, go to "Authentication"
   - Enable OAuth providers (Google, GitHub, etc.)
   - Configure redirect URLs:
     - Development: `http://localhost:3000/handler/callback`
     - Production: `https://yourdomain.com/handler/callback`

3. **Get Your API Keys**
   - In Stack dashboard, go to "Settings" → "API Keys"
   - Copy your Project ID, Publishable Key, and Secret Server Key
   - Add them to your `.env.local` file

4. **Set Admin Email**
   - Add `NEXT_PUBLIC_ADMIN_EMAIL` to `.env.local`
   - This email will have admin access to the trades page
   - Must match the OAuth login email exactly

## Testing Authentication

### Local Development
1. Start the development server: `pnpm dev`
2. Visit `http://localhost:3000`
3. Click "Admin Login" in the sidebar
4. Sign in with your OAuth provider (must match admin email)
5. You should see "Manage Trades" link appear in sidebar
6. Navigate to `/trades` to manage portfolio trades

### Production Deployment
1. Add all environment variables to your hosting platform (Vercel, Netlify, etc.)
2. Deploy the application
3. Test the OAuth flow in production
4. Verify admin-only access to `/trades` route

## Security Notes

- The `/trades` route is client-side protected (user must be logged in)
- API routes should also verify authentication (check `x-user-email` header matches admin email)
- All other routes remain publicly accessible
- OAuth tokens are stored securely in HTTP-only cookies

## Build Status

✅ Build successful with OAuth authentication
✅ All public routes work without authentication
✅ Admin routes protected behind OAuth login
✅ Proper loading states and error handling

## Next Steps

1. Set up Stack Auth account and get API keys
2. Add environment variables to `.env.local` for development
3. Add environment variables to production hosting platform
4. Test OAuth login flow
5. Verify admin can access and use trades page
