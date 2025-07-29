# Dynamic Treemap Update

## Overview

The portfolio treemap on the homepage now includes an interactive timeline slider and play button, allowing users to explore how portfolio composition has changed over time independently from the portfolio chart.

## Features

1. **Interactive Timeline Slider**: Users can drag a slider to view portfolio composition at any date from inception to today
2. **Play Button Animation**: Automatically animate through the portfolio history to see how allocations evolved
3. **Pre-cached Data**: All historical portfolio compositions are cached at build time for smooth performance
4. **Fallback to API**: If a date is not in the cache, the system falls back to the API endpoint
5. **Smooth Transitions**: The treemap animates between different compositions
6. **Consistent Company Colors**: Each company maintains the same color throughout time for easy visual tracking

## Implementation Details

### New Components/Files

1. **`/app/api/portfolio-composition/[date]/route.ts`**: API endpoint that calculates portfolio composition for a specific date
2. **`/scripts/cache-portfolio-compositions.ts`**: Script that pre-caches all historical compositions at build time
3. **`/lib/company-colors.ts`**: Utility to generate consistent colors for companies based on their ticker symbols
4. **Updated `portfolio-treemap.tsx`**: Now accepts a `hoveredDate` prop and fetches/displays historical data with consistent colors
5. **Updated `portfolio-chart.tsx`**: Emits hover events with the date being hovered

### Build Process

The build process now includes a caching step:
```bash
npm run build  # This runs cache-compositions before next build
```

### Environment Variables

Required environment variable:
```
TRADE_DATA_BLOB_URL=<your-blob-storage-url>
```

This should be set in your environment or deployment configuration.

### Data Flow

1. User interacts with the timeline slider or clicks play button
2. Treemap component updates the selected date based on slider position
3. Component checks for data in this order:
   - First: In-memory cache
   - Second: Pre-cached JSON file (`/public/data/portfolio-compositions.json`)
   - Third: API endpoint (if not found in cache)
4. Treemap displays the composition for that date with smooth animation
5. If playing, automatically advances through dates at 100ms intervals

## Testing

To test the functionality:

1. Set up the environment variable:
   ```bash
   export TRADE_DATA_BLOB_URL="<your-blob-storage-url>"
   ```

2. Run the caching script:
   ```bash
   npm run cache-compositions
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Navigate to the homepage and:
   - Use the slider to explore different dates
   - Click the Play button to see an animated progression
   - The treemap will update to show portfolio composition at each selected date

## Performance Considerations

- The pre-cached data file is ~900KB and contains all historical compositions
- The file is loaded once when the treemap component mounts
- Subsequent date changes use the in-memory data for instant updates
- The API endpoint is only used as a fallback for dates not in the cache

## Future Enhancements

- Consider implementing data compression for the cached file
- Add loading states for smoother transitions
- Implement partial loading of cached data for very large portfolios
- Add date range selection for comparing compositions across periods