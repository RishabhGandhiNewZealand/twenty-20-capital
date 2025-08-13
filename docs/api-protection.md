# API Protection Middleware

This project implements middleware to protect internal API routes from direct browser access in production (non-preview) Vercel environments.

## How It Works

The middleware automatically:
- **Blocks** direct browser access to `/api/*` routes in production environments
- **Allows** all requests in development and Vercel preview environments
- **Allows** legitimate API calls with proper headers (JSON, API keys, etc.)
- **Allows** server-side rendering and internal Next.js requests

## Files

- `/middleware.ts` - Main middleware that intercepts and filters requests
- `/lib/api-protection.ts` - Utility functions for environment detection and request validation
- `/app/api/test-protection/route.ts` - Test endpoint to verify protection is working
- `/scripts/test-api-protection.js` - Test script to validate the middleware

## Testing

### Local Development
```bash
# Start your dev server
npm run dev

# In another terminal, run the test script
node scripts/test-api-protection.js http://localhost:3000
```

### Vercel Preview (v0 deployments, etc.)
```bash
node scripts/test-api-protection.js https://v0-rish-investing-website-q96l1soe7.vercel.app
```

### Production (rishinvests.xyz)
```bash
node scripts/test-api-protection.js https://rishinvests.xyz
```

## Customization

### Excluding Specific Routes

To make certain API routes publicly accessible via browser, edit `/lib/api-protection.ts`:

```typescript
export const APIProtectionConfig = {
  publicRoutes: [
    '/api/health',      // Health check endpoint
    '/api/status',      // Status endpoint
    '/api/public',      // Any public API routes
  ],
  // ...
}
```

### Adding Custom Headers

Your frontend code should include proper headers when calling protected APIs:

```javascript
// Example: Fetch with JSON headers
fetch('/api/portfolio', {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
})

// Example: With API key
fetch('/api/trades', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Accept': 'application/json',
  }
})

// Example: With Authorization
fetch('/api/portfolio', {
  headers: {
    'Authorization': 'Bearer your-token',
    'Accept': 'application/json',
  }
})
```

## Environment Variables

The middleware uses these Vercel environment variables:
- `VERCEL` - Set to "1" when running on Vercel
- `VERCEL_ENV` - Can be "production", "preview", or "development"
- `NODE_ENV` - Standard Node.js environment variable

## How Requests Are Validated

### Blocked Requests (in production only)
- Direct browser navigation (typing URL in address bar)
- Browser requests without proper API headers
- Requests with `Sec-Fetch-Mode: navigate` header

### Allowed Requests
- Any request with `Accept: application/json` header
- Requests with `X-API-Key` header
- Requests with `Authorization` header
- AJAX requests (`X-Requested-With: XMLHttpRequest`)
- Server-side rendering requests
- Internal Next.js requests
- All requests in development and preview environments

## Troubleshooting

### APIs blocked in development
- Check that `NODE_ENV` is set to "development"
- Ensure you're not manually setting `VERCEL_ENV` to "production"

### APIs not blocked in production
- Verify you're testing on the production domain (not preview)
- Check that the middleware is properly deployed
- Use the test script to validate: `node scripts/test-api-protection.js https://your-domain.com`

### Legitimate API calls being blocked
- Ensure your frontend includes `Accept: application/json` header
- Add an API key or authorization header
- Check the browser console for the exact error message

## Security Notes

1. This middleware provides basic protection against casual browser access
2. For sensitive data, always implement proper authentication/authorization
3. Consider adding rate limiting for additional protection
4. Use HTTPS in production to prevent header spoofing
5. Regularly review and update the protection rules based on your security requirements