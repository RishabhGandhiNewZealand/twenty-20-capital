# Shareable Anonymized View Feature

**Date Implemented:** January 2025  
**Last Updated:** January 2025

## Overview

This feature implements a comprehensive anonymization system for the portfolio website, enabling safe sharing of the site URL while protecting sensitive financial information. The system includes a password-protected toggle that allows authorized users to view actual data.

## Purpose

The primary goal is to create an "anonymized mode" that:
- Hides sensitive financial numbers by replacing them with asterisks
- Modifies the main performance graph display to obscure absolute values
- Maintains the educational and analytical value of the content
- Provides controlled access via password authentication

## Architecture

### Core Components

#### 1. AnonymizationContext (`/contexts/AnonymizationContext.tsx`)
- React Context provider managing global anonymization state
- Provides `isAnonymized`, `toggleAnonymization`, and `setAnonymized` to consumers
- Defaults to `isAnonymized = true` for security

#### 2. Anonymization Utilities (`/lib/anonymization-utils.ts`)
- `maskValue()`: Generic value masking function
- `maskCurrency()`: Currency-specific masking with locale formatting
- `maskShares()`: Share count masking
- `logUncertainValue()`: Debug helper for identifying uncertain values

#### 3. Password Modal (`/components/password-modal.tsx`)
- Modal dialog for password entry
- Includes password visibility toggle
- Loading states and error handling
- Communicates with authentication API

#### 4. Authentication API (`/app/api/auth/verify-password/route.ts`)
- Server-side endpoint for password verification
- Validates against `ADMIN_PASSWORD` environment variable
- Returns success/failure response

## Data Masking Rules

### Hidden When Anonymized
- Total portfolio value
- Total invested capital
- Individual position share counts
- Position market values
- Absolute monetary amounts in narrative text
- Investment targets and goals
- Any personal trade history values

### Always Visible
- Percentage changes (daily, monthly, yearly)
- CAGR (Compound Annual Growth Rate)
- Allocation percentages
- Performance ratios
- Market prices (current stock prices)
- Per-share cost basis
- Company names and symbols
- Educational content and analysis

## Implementation Details

### Portfolio Page
- Summary statistics masked using `maskCurrency()`
- Holdings table hides shares and values
- Performance chart modifications:
  - Y-axis labels hidden (`tick={false}`)
  - Tooltip values masked
  - Stats overlay position adjusted for consistency
- Allocation chart shows percentages only

### Report Pages
All report pages (Q1 2025, Q2 2025, 2024 Annual Review) include:
- Masked portfolio values in summary cards
- Hidden share counts in holdings tables
- Company detail sections with masked positions
- Narrative text with dynamic value masking

### Narrative Text Anonymization
Investment actions and amounts in prose are dynamically masked:
```tsx
// Example from 2024 review
<p>I held {isAnonymized ? "***" : "19"} shares...</p>
<p>...position of {isAnonymized ? "***" : "2500"} NZD...</p>
```

## User Flow

1. **Default State**: Site loads with anonymization enabled
2. **Toggle Interaction**: User clicks shield icon in navigation
3. **Authentication**: Password modal appears
4. **Verification**: Password sent to server for validation
5. **Success**: Anonymization disabled for session
6. **Session End**: Refresh or new session resets to anonymized

## Security Considerations

### Password Storage
- `ADMIN_PASSWORD` stored as server-side environment variable
- Never exposed to client-side code
- Not included in repository

### Session Management
- Authentication state is session-specific
- No persistence across browsers or devices
- Automatic reset on page refresh
- No cookies or local storage used

### Default Behavior
- Anonymization enabled by default
- Fail-safe approach to data protection
- Explicit action required to reveal data

## Configuration

### Environment Variables
```bash
# Server-side only (production)
ADMIN_PASSWORD=your_secure_password_here

# Note: Do NOT use NEXT_PUBLIC_ prefix
# This would expose the password to client-side code
```

### Testing
To test the feature locally:
1. Set `ADMIN_PASSWORD` in your environment or `.env.local`
2. Navigate to any page with financial data
3. Click the shield icon in the navigation
4. Enter the password to disable anonymization

## Affected Files

### New Files Created
- `/contexts/AnonymizationContext.tsx`
- `/lib/anonymization-utils.ts`
- `/components/password-modal.tsx`
- `/app/api/auth/verify-password/route.ts`

### Modified Files
- `/app/layout.tsx` - Added AnonymizationProvider wrapper
- `/components/sidebar-navigation.tsx` - Added toggle button
- `/app/portfolio/page.tsx` - Implemented masking throughout
- `/components/portfolio-chart.tsx` - Chart modifications
- `/components/portfolio-horizontal-bar-chart.tsx` - Allocation chart updates
- `/app/reports/*.tsx` - All report pages updated
- `/app/about/page.tsx` - Removed specific monetary amount

## Maintenance Notes

### Adding New Financial Data
When adding new financial displays:
1. Import `useAnonymization` hook and masking utilities
2. Apply appropriate masking function to sensitive values
3. Test both anonymized and revealed states
4. Consider logging uncertain values for review

### Updating Masking Rules
Masking functions are centralized in `/lib/anonymization-utils.ts`. Modify these functions to change masking behavior globally.

### Password Changes
Update the `ADMIN_PASSWORD` environment variable in your deployment environment. No code changes required.

## Future Enhancements

Potential improvements for consideration:
- Multiple authentication levels with different data visibility
- Time-based session expiration
- Audit logging for authentication attempts
- Customizable masking patterns
- Export functionality with anonymization applied

## Troubleshooting

### Common Issues

**Authentication fails despite correct password**
- Verify `ADMIN_PASSWORD` is set in environment
- Check it's not prefixed with `NEXT_PUBLIC_`
- Ensure server has access to environment variable

**Values not masking properly**
- Confirm component is wrapped in AnonymizationProvider
- Check component is client-side (`"use client"`)
- Verify masking function is applied to value

**State not persisting**
- This is intentional - state is session-specific
- Use authentication for each new session

## Contact

For questions or issues with this feature, please refer to the main project documentation or contact the repository maintainer.