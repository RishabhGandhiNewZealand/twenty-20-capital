# Dynamic Portfolio Race Chart

## Overview

The portfolio allocation visualization on the homepage now features a horizontal bar race chart with an interactive timeline slider and play button, allowing users to watch how portfolio holdings compete and change over time.

## Features

1. **Race Chart Visualization**: Horizontal bars show the top 10 holdings racing against each other as values change
2. **Interactive Timeline Slider**: Users can drag a slider to view portfolio composition at any date from inception to today
3. **Play Button Animation**: Automatically animate through the portfolio history at 50ms intervals to see holdings compete
4. **Pre-cached Data**: All historical portfolio compositions are cached at build time for smooth performance
5. **Fallback to API**: If a date is not in the cache, the system falls back to the API endpoint
6. **Smooth Transitions**: Bars animate smoothly between positions as holdings grow or shrink
7. **Consistent Company Colors**: Each company maintains the same color throughout time for easy visual tracking

## Implementation Details

### New Components/Files

1. **`/app/api/portfolio-composition/[date]/route.ts`**: API endpoint that calculates portfolio composition for a specific date
2. **`/scripts/cache-portfolio-compositions.ts`**: Script that pre-caches all historical compositions at build time
3. **`/lib/company-colors.ts`**: Utility to generate consistent colors for companies based on their ticker symbols
4. **`/components/portfolio-race-chart.tsx`**: Race chart component with timeline controls showing top 10 holdings
5. **Updated `portfolio-chart.tsx`**: Now operates independently from the allocation visualization

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
2. Race chart component updates the selected date based on slider position
3. Component checks for data in this order:
   - First: In-memory cache
   - Second: Pre-cached JSON file (`/public/data/portfolio-compositions.json`)
   - Third: API endpoint (if not found in cache)
4. Race chart displays the top 10 holdings as horizontal bars
5. If playing, automatically advances through dates at 50ms intervals
6. Bars animate and reorder based on changing values

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
   - Click the Play button to watch the race animation
   - The horizontal bars will show the top 10 holdings racing against each other
   - Holdings will reorder and resize based on their values at each date

## Performance Considerations

- The pre-cached data file is ~900KB and contains all historical compositions
- The file is loaded once when the race chart component mounts
- Subsequent date changes use the in-memory data for instant updates
- The API endpoint is only used as a fallback for dates not in the cache

## Future Enhancements

- Consider implementing data compression for the cached file
- Add loading states for smoother transitions
- Implement partial loading of cached data for very large portfolios
- Add date range selection for comparing compositions across periods