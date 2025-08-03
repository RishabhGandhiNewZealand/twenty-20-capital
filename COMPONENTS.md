# Component Documentation

This document provides detailed information about all React components used in the Personal Portfolio Tracker application.

## Component Architecture

The application uses a modular component architecture with:

- **UI Components**: Reusable components from shadcn/ui
- **Feature Components**: Business logic components
- **Layout Components**: Page structure and navigation

## Core Components

### Portfolio Chart (`components/portfolio-chart.tsx`)

Interactive chart component for displaying portfolio performance over time.

**Props:**

```typescript
interface PortfolioChartProps {
  data: PortfolioDataPoint[]
  height?: number
  showComparison?: boolean
}

interface PortfolioDataPoint {
  date: string
  portfolioValue: number
  sp500Value?: number
  costBasis: number
}
```

**Usage:**

```tsx
<PortfolioChart 
  data={portfolioHistory} 
  height={400}
  showComparison={true}
/>
```

**Features:**
- Line chart with multiple series
- Responsive design
- Tooltip with detailed information
- S&P 500 comparison overlay
- Customizable colors and styling

---

### Portfolio Horizontal Bar Chart (`components/portfolio-horizontal-bar-chart.tsx`)

Displays portfolio allocation as a horizontal bar chart.

**Props:**

```typescript
interface PortfolioHorizontalBarChartProps {
  holdings: Holding[]
  totalValue: number
  showLabels?: boolean
  height?: number
}

interface Holding {
  symbol: string
  name: string
  currentValueNZD: number
  allocation: number
  gainPercent: number
}
```

**Usage:**

```tsx
<PortfolioHorizontalBarChart
  holdings={currentHoldings}
  totalValue={portfolioTotal}
  showLabels={true}
/>
```

**Features:**
- Company-specific color coding
- Percentage allocation display
- Gain/loss indicators
- Interactive hover states
- Mobile-responsive design

---

### App Sidebar (`components/app-sidebar.tsx`)

Main navigation sidebar component.

**Props:**

```typescript
interface AppSidebarProps {
  className?: string
  defaultCollapsed?: boolean
}
```

**Usage:**

```tsx
<AppSidebar className="border-r" />
```

**Features:**
- Collapsible navigation
- Active route highlighting
- User profile section
- Responsive mobile menu
- Theme toggle integration

---

### Navigation (`components/navigation.tsx`)

Navigation menu component with route management.

**Props:**

```typescript
interface NavigationProps {
  items: NavItem[]
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType
  badge?: string | number
}
```

**Features:**
- Dynamic route generation
- Icon support
- Badge notifications
- Keyboard navigation

---

### Theme Provider (`components/theme-provider.tsx`)

Provides theme context for dark/light mode switching.

**Props:**

```typescript
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
  storageKey?: string
}
```

**Usage:**

```tsx
<ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
  <App />
</ThemeProvider>
```

---

## UI Component Library

The application uses shadcn/ui components. Here are the most commonly used ones:

### Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Variants:**
- `default`: Primary button
- `destructive`: Danger/delete actions
- `outline`: Secondary button
- `secondary`: Alternative style
- `ghost`: Minimal style
- `link`: Link style

**Sizes:**
- `sm`: Small
- `default`: Medium
- `lg`: Large
- `icon`: Icon-only button

---

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Portfolio Value</CardTitle>
  </CardHeader>
  <CardContent>
    <p>$150,000</p>
  </CardContent>
</Card>
```

---

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content here</p>
  </DialogContent>
</Dialog>
```

---

### Toast

```tsx
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Success",
  description: "Portfolio updated successfully",
  variant: "default", // or "destructive"
})
```

---

### Form Components

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<div>
  <Label htmlFor="symbol">Stock Symbol</Label>
  <Input id="symbol" placeholder="AAPL" />
</div>

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select currency" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="usd">USD</SelectItem>
    <SelectItem value="nzd">NZD</SelectItem>
  </SelectContent>
</Select>
```

---

## Custom Hooks

### useMobile (`hooks/use-mobile.tsx`)

Detects mobile viewport for responsive behavior.

```tsx
const isMobile = useMobile()

if (isMobile) {
  // Mobile-specific logic
}
```

### useToast (`hooks/use-toast.ts`)

Toast notification system.

```tsx
const { toast, toasts, dismiss } = useToast()

// Show toast
toast({
  title: "Success",
  description: "Action completed",
})

// Dismiss specific toast
dismiss(toastId)
```

---

## Component Best Practices

### 1. Component Structure

```tsx
// components/example-component.tsx
import { cn } from "@/lib/utils"

interface ExampleComponentProps {
  className?: string
  children?: React.ReactNode
  // other props
}

export function ExampleComponent({ 
  className, 
  children,
  ...props 
}: ExampleComponentProps) {
  return (
    <div 
      className={cn(
        "default-styles",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}
```

### 2. Styling Guidelines

- Use Tailwind CSS classes
- Use `cn()` utility for conditional classes
- Keep component-specific styles minimal
- Use CSS variables for theming

### 3. Performance Optimization

- Use `React.memo` for expensive components
- Implement proper key props for lists
- Lazy load heavy components
- Optimize re-renders with proper dependency arrays

### 4. Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation
- Maintain focus management

### 5. Testing

Components should be tested for:
- Rendering with different props
- User interactions
- Edge cases
- Accessibility compliance

---

## Component Categories

### Layout Components
- `AppSidebar`: Main navigation
- `Navigation`: Route management
- `ThemeProvider`: Theme context

### Data Display
- `PortfolioChart`: Line charts
- `PortfolioHorizontalBarChart`: Bar charts
- `Card`: Content containers
- `Table`: Data tables

### Form Controls
- `Button`: Interactive buttons
- `Input`: Text inputs
- `Select`: Dropdown selections
- `Checkbox`: Boolean inputs
- `Switch`: Toggle controls

### Feedback
- `Toast`: Notifications
- `Alert`: Inline messages
- `Progress`: Loading states
- `Skeleton`: Loading placeholders

### Overlays
- `Dialog`: Modal dialogs
- `Sheet`: Slide-out panels
- `Popover`: Contextual overlays
- `Tooltip`: Hover information

---

## Future Component Plans

- [ ] Portfolio comparison chart
- [ ] Trade history table
- [ ] Stock watchlist component
- [ ] News feed integration
- [ ] Advanced filtering controls
- [ ] Export functionality
- [ ] Real-time price ticker