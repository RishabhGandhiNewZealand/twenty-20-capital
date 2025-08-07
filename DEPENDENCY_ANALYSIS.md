# Dependency Analysis Report

## Currently Used UI Components
Based on the codebase analysis, these are the UI components actually in use:
- **card** - Used extensively across all pages
- **button** - Used in portfolio-horizontal-bar-chart and news page
- **sheet** - Used in news page
- **avatar** - Used in nav-user component
- **dropdown-menu** - Used in nav-user component
- **sidebar** - Used in app-sidebar and nav-user
- **switch** - Used in portfolio-chart
- **label** - Used in portfolio-chart
- **slider** - Used in portfolio-horizontal-bar-chart
- **toast** - Used via use-toast hook

## Unused UI Components (Can be removed)
These UI components exist but are never imported:
- alert
- badge
- breadcrumb
- calendar
- carousel
- chart
- checkbox
- collapsible
- command
- dialog
- drawer
- form
- input
- input-otp
- pagination
- resizable
- select
- separator
- skeleton
- sonner
- table
- tabs
- textarea
- toggle
- tooltip

## Unused Radix Packages (Can be removed)
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-tabs
- @radix-ui/react-toggle
- @radix-ui/react-tooltip

## Other Potentially Unused Dependencies
- react-hook-form (no forms detected in the codebase)
- input-otp (UI component exists but never imported)
- sonner (UI component exists but never imported)
- react-day-picker (calendar component exists but never imported)
- embla-carousel-react (carousel component exists but never imported)
- react-resizable-panels (resizable component exists but never imported)
- cmdk (command component exists but never imported)
- vaul (drawer component exists but never imported)

## Bundle Size Impact
Removing these unused dependencies could save approximately:
- ~150KB from unused Radix packages
- ~50KB from react-hook-form
- ~80KB from embla-carousel
- ~40KB from react-day-picker
- ~30KB from other misc packages
**Total potential savings: ~350KB**

## Recommended Updates
### Critical Updates (Security/Performance):
1. **next**: 15.2.4 → 15.4.6 (bug fixes and performance improvements)
2. **lucide-react**: ^0.454.0 → ^0.536.0 (smaller bundle, better tree-shaking)

### Minor Updates (Bug fixes):
1. All Radix UI packages that are actually used should be updated to latest
2. **recharts**: ^2.15.0 → ^3.1.2 (major version with better performance)

### Can Skip (Breaking changes with minimal benefit):
1. **tailwindcss**: v3 → v4 (major breaking changes, wait for stable)
2. **date-fns**: Keep at v3 for now (v4 just released)