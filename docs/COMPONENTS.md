# Component Documentation

This document describes the React components used in the Personal Portfolio Tracker application.

## Component Architecture Overview

The application uses a modular component architecture with clear separation of concerns:

- **Page Components**: Top-level components that represent full pages
- **Feature Components**: Complex components that implement business logic
- **UI Components**: Reusable presentational components from shadcn/ui
- **Layout Components**: Components that provide structure and navigation

## Core Application Components

### Portfolio Chart (`components/portfolio-chart.tsx`)

The main visualization component that displays portfolio performance over time. This component:

- Renders a line chart comparing portfolio value against S&P 500
- Handles responsive sizing for mobile and desktop views
- Displays key statistics in an overlay
- Supports toggling between different view modes
- Uses Recharts library for chart rendering

Key features include automatic data formatting, touch-friendly interactions on mobile, and real-time updates when data changes.

### Portfolio Horizontal Bar Chart (`components/portfolio-horizontal-bar-chart.tsx`)

Visualizes portfolio allocation as a horizontal bar chart. This component:

- Shows the percentage allocation of each holding
- Uses company-specific colors for visual distinction
- Displays gain/loss indicators for each position
- Adapts layout for mobile screens
- Provides hover states with detailed information

The component automatically calculates percentages based on total portfolio value and sorts holdings by allocation size.

### App Sidebar (`components/app-sidebar.tsx`)

The main navigation component that provides:

- Collapsible sidebar for desktop views
- Mobile-responsive hamburger menu
- Active route highlighting
- User profile section
- Theme toggle integration

This component manages navigation state and adapts its behavior based on screen size, providing a consistent navigation experience across devices.

### Navigation (`components/navigation.tsx`)

Handles the navigation menu structure and routing logic:

- Generates menu items from configuration
- Manages active state based on current route
- Supports nested navigation structures
- Integrates with Next.js routing

### Trade Form Modal (`components/trade-form-modal.tsx`)

Modal dialog for trade data entry:

- Comprehensive form validation
- Support for all trade types (Buy, Sell, Reinvestment)
- Currency selection with exchange rate handling
- Automatic value calculations
- Date picker integration

### Password Modal (`components/password-modal.tsx`)

Security modal for anonymization feature:

- Password input with visibility toggle
- Loading states during authentication
- Error handling for incorrect passwords
- Integrates with authentication API

## Page Components

### Home Page (`app/page.tsx`)

The main dashboard that serves as the application entry point:

- Fetches and displays portfolio data
- Renders summary cards with key metrics
- Shows holdings table with current positions
- Displays performance charts
- Lists exited positions

This component orchestrates data fetching and coordinates the display of multiple child components.

### Trades Page (`app/trades/page.tsx`)

The trade management interface that allows users to:

- View all trades in a grouped or flat view
- Add new trades via modal form
- Edit existing trades inline or via modal
- Delete trades with confirmation
- Stage changes before committing to database
- Search and filter trades
- View trade statistics by company

### News Page (`app/news/page.tsx`)

AI-powered news analysis page featuring:

- Real-time news fetching for portfolio companies
- Sentiment analysis and impact assessment
- Grouped news by company with visual indicators
- Expandable details with source links
- Caching for performance optimization

### Reports Pages (`app/reports/*/page.tsx`)

Individual report pages that display:

- Quarterly or yearly performance summaries
- Custom visualizations for the period
- Markdown content for detailed analysis
- Period-specific metrics and insights

Each report page can have custom layouts and visualizations while maintaining consistent styling.

### Analyses Pages (`app/analyses/*/page.tsx`)

Company-specific analysis pages featuring:

- Detailed company research and notes
- Custom theming based on company colors
- Markdown rendering for rich content
- Integration with portfolio data

## UI Component Library

The application uses shadcn/ui components as a foundation. Key components include:

### Layout Components
- **Card**: Container component for content sections
- **Sidebar**: Navigation sidebar with responsive behavior
- **Sheet**: Slide-out panels for mobile navigation

### Data Display
- **Table**: Responsive tables with mobile adaptations
- **Badge**: Status indicators and labels
- **Skeleton**: Loading state placeholders

### Interactive Elements
- **Button**: Consistent button styling with variants
- **Dialog**: Modal dialogs for user interactions
- **Toast**: Notification system for user feedback
- **Select**: Dropdown selections with custom styling

### Form Components
- **Input**: Text input fields with consistent styling
- **Label**: Form labels with proper accessibility
- **Checkbox**: Boolean input controls
- **Switch**: Toggle switches for settings

## Component Patterns

### Data Flow

Components follow a unidirectional data flow:
1. Page components fetch data from API routes
2. Data is passed down through props
3. Child components render based on received data
4. User interactions trigger callbacks up the component tree

### State Management

The application uses React's built-in state management:
- `useState` for local component state
- `useEffect` for side effects and data fetching
- Custom hooks for shared logic
- Server state managed through API calls

### Responsive Design

All components implement responsive design through:
- Tailwind CSS responsive utilities
- Conditional rendering based on screen size
- Mobile-first design approach
- Touch-friendly interaction targets

### Performance Optimization

Components are optimized for performance through:
- Lazy loading of heavy components
- Memoization of expensive calculations
- Efficient re-render prevention
- Proper key usage in lists

## Custom Hooks

### useIsMobile

Detects mobile viewport for responsive behavior:
- Returns boolean indicating mobile screen size
- Updates on window resize
- Used for conditional rendering and behavior

### useToast

Manages toast notifications:
- Provides methods to show/dismiss toasts
- Handles toast queue and timing
- Integrates with the toast component

## Styling Approach

Components use a consistent styling approach:

- Tailwind CSS for utility-first styling
- CSS variables for theme customization
- Consistent spacing and sizing scales
- Dark mode support through CSS variables

### Theme System

The application supports light and dark themes:
- Theme provider wraps the application
- Components use theme-aware color variables
- User preference is persisted
- System preference detection

## Component Guidelines

When working with components:

### Understanding Component Responsibility
- Each component has a single, clear purpose
- Business logic is separated from presentation
- Data fetching happens at appropriate levels
- Side effects are properly managed

### Modifying Components
- Maintain existing prop interfaces
- Preserve responsive behavior
- Consider performance implications
- Update TypeScript types as needed

### Creating New Components
- Follow existing naming conventions
- Implement responsive design from the start
- Use TypeScript for type safety
- Consider reusability and composition

## Component Dependencies

Key libraries used by components:

- **React**: Core component framework
- **Recharts**: Chart rendering
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

## Future Component Considerations

Areas for component enhancement:

- Additional chart types for different visualizations
- Enhanced mobile interactions
- More sophisticated loading states
- Improved error boundaries
- Advanced filtering and sorting controls

The component architecture is designed to be extensible while maintaining consistency and performance across the application.