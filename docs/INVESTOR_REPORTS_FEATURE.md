# Investor Reports Feature Documentation

## Overview
This document describes the investor reports feature that was built for the earnings calendar but is currently disabled. The feature allowed users to click on earnings cards to view quarterly and annual reports from company investor relations pages.

## Architecture

### Components Built

1. **API Endpoint** (`/app/api/investor-reports/route.ts`)
   - Accepts company symbol as parameter
   - Returns investor relations URL and report links
   - Uses both web scraping and pattern-based URL generation

2. **Investor Relations URLs** (`/lib/investor-relations-urls.ts`)
   - Mapping of company symbols to IR page URLs
   - Covers major US, NZ, and AU companies
   - Falls back to Yahoo Finance for unknown companies

3. **Web Scraper** (`/lib/investor-reports-scraper.ts`)
   - Uses Cheerio to parse HTML from IR pages
   - Identifies PDF links using regex patterns
   - Extracts report titles and dates
   - Includes caching mechanism (24 hours)

4. **URL Pattern Generator** (`/lib/investor-reports-patterns.ts`)
   - Pre-configured URL patterns for major companies
   - Generates report URLs based on year/quarter
   - Used as fallback when scraping fails

## How It Worked

1. User clicks on an earnings card
2. Modal opens showing company details
3. API fetches reports using this priority:
   - Try web scraping the IR page
   - If scraping fails, use URL patterns
   - Always show link to IR page as fallback
4. Reports displayed in two tabs: Quarterly and Annual

## Why It Was Disabled

### Technical Challenges
- **CORS Restrictions**: Many IR sites block cross-origin requests
- **Dynamic Content**: Some sites load reports via JavaScript
- **Rate Limiting**: Automated requests often get blocked
- **Inconsistent Structures**: Each company's IR page is different

### User Experience Issues
- Reports often failed to load
- Inconsistent results between companies
- Slow performance when scraping

## Re-enabling the Feature

To re-enable this feature:

1. **Update the earnings calendar component**:
```typescript
// Add click handler to Card component
onClick={() => handleCardClick(earning)}

// Add state for selected company and reports
const [selectedCompany, setSelectedCompany] = useState<EarningsData | null>(null)

// Add Dialog component for modal display
```

2. **Improve the scraping approach**:
```typescript
// Consider server-side scraping with Puppeteer
// Add proxy support to avoid rate limiting
// Implement retry logic with exponential backoff
```

3. **Build a reports database**:
```typescript
// Store successful scraping results
// Update periodically via background jobs
// Manual curation for important companies
```

## Alternative Approaches

1. **Third-party APIs**
   - Alpha Vantage, IEX Cloud, or similar services
   - More reliable but requires API keys and possibly payment

2. **Manual Curation**
   - Build database of report URLs manually
   - Update quarterly as new reports are released
   - Most reliable but labor-intensive

3. **Hybrid Approach**
   - Use APIs for major companies
   - Manual curation for portfolio companies
   - Web scraping as last resort

## Code References

Key files to review:
- `/app/api/investor-reports/route.ts` - Main API logic
- `/lib/investor-reports-scraper.ts` - Scraping implementation
- `/lib/investor-reports-patterns.ts` - URL patterns
- `/components/earnings-calendar.tsx` - UI implementation (see comments)

## Testing

To test the API manually:
```bash
curl "http://localhost:3000/api/investor-reports?symbol=AAPL"
```

The API will return:
- `investorRelationsUrl`: Always present
- `reports.quarterly`: Array of quarterly reports
- `reports.annual`: Array of annual reports
- `message`: Shown when no reports found