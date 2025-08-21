# Q7 CRM Dashboard V2

A modern practice management dashboard providing accountants with real-time visibility into client work progress, deadline management, and automated workflow tracking.

## What Was Kept

This repository has been refactored to contain only the Dashboard V2 page and its true dependencies:

### Core Files (47 total)
- **Entry & Routing (4)**: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- **Dashboard V2 Components (24)**: Complete DashboardV2 page with Board, List, Calendar views, modals, and UI components
- **Utilities (6)**: Status management, metrics calculation, calendar mapping, design tokens
- **Data (4)**: Demo data, type definitions, client data, navigation config
- **Configuration (9)**: TypeScript, Vite, Tailwind, PostCSS, ESLint configs

### Dependencies Kept
- **React Ecosystem**: react, react-dom, react-router-dom
- **UI Components**: @radix-ui/* (dialog, tabs, etc.), lucide-react
- **Charts & Calendar**: chart.js, react-chartjs-2, recharts, react-big-calendar, date-fns
- **Styling**: tailwindcss, class-variance-authority, clsx, tailwind-merge
- **Build Tools**: vite, typescript, autoprefixer, postcss

## What Was Removed

### Pages Removed (12)
- Original dashboard, penalties, reminders, clients, todo, performance, team, settings, client-portal, share pages, control board

### Components Removed (40+)
- Authentication system, legacy dashboard components, TodoList, Calendar, Clients, ClientPortal, PenaltyAlerts, ReminderQueue, WorkflowSettings, Automations, Profile, Layout components

### Dependencies Removed
- **Drag & Drop**: @dnd-kit/* (only used by removed Kanban)
- **Duplicate Chart.js**: Removed duplicate chart.js entry
- **Unused UI**: @radix-ui/react-dropdown-menu

### Data & Utilities Removed
- Legacy seed data, KPI calculations, data selectors, authentication hooks, mock data types

## How to Run

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will automatically redirect to `/dashboard-v2` from any route.

## How to Customize

### Design Tokens
- **Colors & Theme**: Edit `tailwind.config.js` and `src/lib/tokens.ts`
- **Component Styles**: Modify files in `src/components/ui/`

### Data
- **Demo Periods**: Edit `src/pages/DashboardV2/demo-data.ts`
- **Client Data**: Edit `src/pages/DashboardV2/data.ts`
- **Status Workflows**: Edit `src/pages/DashboardV2/status.ts`

### Layout
- **Kanban Lanes**: Configure in `src/pages/DashboardV2/lanes5.ts`
- **Navigation**: Edit `src/persona/nav.ts`

## How to Add New Pages

1. Create your new page component in `src/pages/`
2. Add the route in `src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Reuse existing UI components from `src/components/ui/`
4. Avoid pulling back removed legacy components

## Architecture

- **Framework**: Vite + React 18 + TypeScript
- **Routing**: React Router DOM (code-defined)
- **Styling**: Tailwind CSS with utility-first approach
- **UI Components**: Radix UI primitives with shadcn/ui wrappers
- **Charts**: Chart.js and Recharts for analytics
- **Calendar**: react-big-calendar for deadline visualization
- **Data**: In-memory demo dataset (245+ realistic periods)

## Features

- **Multi-view Interface**: Kanban board, table list, and calendar views
- **Advanced Filtering**: Service type, status, assignee, text search with persistence
- **Real-time Analytics**: KPI cards, status breakdown charts, deadline trends
- **Drag-and-drop Workflow**: Native HTML5 DnD between valid status columns
- **Period Management**: Detailed modals with communication logs and document tracking
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: ARIA labels, keyboard navigation

## Status Workflows

The system supports three service types with specific status progressions:

- **VAT**: Awaiting Docs → In Progress → Awaiting Approval → Ready to Submit → Submitted → Paid → Closed
- **ACCOUNTS**: Awaiting Docs → In Progress → Draft Sent → Awaiting Approval → Ready to File → Filed → Closed
- **SA**: Awaiting Questionnaire → Reminders Sent → In Progress → Awaiting Approval → Submitted → Done