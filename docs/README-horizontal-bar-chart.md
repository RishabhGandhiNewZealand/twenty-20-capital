# Horizontal Bar Chart Implementation

## Overview
This document describes the fund exposure horizontal bar chart visualization used on the main page of the Twenty 20 Capital console.

## Component Details

### 1. Component Location
- **File**: `components/portfolio-horizontal-bar-chart.tsx`
- **Description**: A React component that displays portfolio holdings as a horizontal bar chart
- **Features**:
  - Displays top 15 holdings sorted by value
  - Shows company logos and ticker symbols on the Y-axis
  - Displays allocation percentages to the right of bars
  - Shows market values inside bars (when space permits)
  - Includes time slider with play/pause functionality
  - Supports playback speed controls (0.5x, 1x, 2x)
  - Fully responsive for mobile and desktop

### 2. Integration
- **Used in**: `app/page.tsx`
- **Props**: Accepts current holdings data from the main page

### 3. Company Colors
- **File**: `lib/company-colors.ts`
- **Details**:
  - Uses blue-based colors matching the website theme
  - Predefined colors for major companies using various shades of blue, indigo, teal, and purple
  - Fallback color generation stays within the blue spectrum

### 4. Key Features

#### Layout Structure
The horizontal bar chart follows this layout pattern:
```
[Logo] [Ticker] [Bar with value inside] [Percentage]
```

#### Positioning Details
- **Y-axis width**: 75px (provides space for logo and ticker)
- **Logo position**: x={-50} (50px left of Y-axis line)
- **Ticker position**: x={-25} (25px left of Y-axis line)
- **Chart margins**: top: 5, right: 50, left: 0, bottom: 5
- **Bar corner radius**: 4px for polished appearance

#### Animation Settings
- **Default speed (1x)**: 50ms intervals (20 updates/second)
- **Slow speed (0.5x)**: 100ms intervals (10 updates/second)
- **Fast speed (2x)**: 25ms intervals (40 updates/second)

#### Responsive Design
- Mobile-optimized with smaller fonts and adjusted spacing
- Company names hidden on mobile to save space
- Responsive padding and margins
- Touch-friendly controls

### 5. Data Handling
- Filters holdings with < 0.1% allocation
- Validates numeric values to prevent NaN errors
- Rounds values to avoid decimal precision issues
- Supports historical data playback via portfolio-compositions.json

### 6. Visual Enhancements
- Company logos displayed using existing `getLogoUrl` utility
- Consistent blue-based color scheme
- Smooth transitions during data updates
- Clean grid lines with 30% opacity
- Custom tooltips showing company details

## Technical Implementation

### Dependencies
- Recharts for charting functionality
- Existing UI components from shadcn/ui
- Company utilities for logos and colors

### Performance Considerations
- Limited to top 15 holdings for readability
- Efficient caching of historical data
- Smooth animations with configurable intervals
- Responsive sizing calculations

## Usage
The horizontal bar chart automatically loads on the main page and displays current portfolio holdings. Users can:
- Use the time slider to view historical allocations
- Click play/pause to animate through time
- Adjust playback speed with speed controls
- Hover over bars for detailed information

## Future Enhancements
Potential improvements could include:
- Configurable number of holdings displayed
- Export functionality for chart data
- Additional sorting options
- Drill-down capabilities for detailed analysis