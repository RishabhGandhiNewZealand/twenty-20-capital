# Report Pages - Technical Debt

## Current State
The quarterly report pages (q1-2025, q2-2025) and annual review (2024-review) currently contain hardcoded values for:
- Portfolio returns and statistics
- Individual stock holdings and prices
- Performance percentages
- Portfolio values

## Recommended Improvements
These values should be dynamically calculated from:
1. The CSV trade data (for historical positions and cost basis)
2. Yahoo Finance API (for historical prices at quarter-end dates)
3. Calculated metrics based on actual data

## Implementation Approach
To properly refactor these pages:

1. Create a `generateQuarterlyReport` function that:
   - Takes a quarter end date as input
   - Reads trades from CSV up to that date
   - Fetches historical prices for that date
   - Calculates actual returns and portfolio values
   - Returns structured data for the report

2. Create API endpoints like `/api/reports/quarterly` that:
   - Accept quarter and year parameters
   - Use the portfolio calculation logic
   - Return the calculated report data

3. Update report pages to:
   - Fetch data from the API on load
   - Display loading states while fetching
   - Show actual calculated values instead of hardcoded ones

## Why This Wasn't Done Now
This refactoring would require:
- Significant changes to the report page structure
- New API endpoints
- Historical price fetching for specific dates
- Complex calculations for quarter-over-quarter returns
- Testing to ensure accuracy

This represents a larger refactoring effort that should be done as a separate task to avoid breaking existing functionality.