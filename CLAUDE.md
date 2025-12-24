# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CNC Quality Inspection KPI Application - A bilingual (Vietnamese/Korean) web application for digitizing CNC quality inspection processes and providing real-time KPI monitoring. Built for factory floor use on mobile/tablet devices.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Server runs at http://localhost:5173

### Build for Production
```bash
npm run build
```
TypeScript compilation + Vite production build

### Lint Code
```bash
npm run lint
```
ESLint with TypeScript rules

### Preview Production Build
```bash
npm run preview
```

### Add shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```
Example: `npx shadcn@latest add button input card`

## Critical: Internationalization (i18n)

**ALL UI text MUST support both Vietnamese and Korean languages.**

### Required Pattern for ALL Components

```typescript
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()

  return <button>{t('common.save')}</button>  // ✅ Correct
  // NOT: <button>저장</button>  // ❌ Never hardcode text
}
```

### Form Validation with Zod + i18n

```typescript
function createFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.email'))
  })
}

export function MyForm() {
  const { t } = useTranslation()
  const formSchema = createFormSchema(t)
  // ... use with React Hook Form
}
```

### Translation Files
- Korean: `src/locales/ko/translation.json`
- Vietnamese: `src/locales/vi/translation.json`
- Config: `src/i18n/config.ts`
- Always update BOTH languages when adding new keys

### Common Translation Keys
- `common.*` - save, cancel, delete, edit, add, etc.
- `nav.*` - dashboard, inspection, defects, analytics, reports, management
- `validation.*` - required, email, number, etc.
- `{page}.*` - Page-specific translations

## Architecture Overview

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (Radix UI components)
- **State Management**:
  - Zustand for client state
  - TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Charts**: Recharts

### Mock Mode vs Real Mode

The app supports two modes controlled by `src/config/app.config.ts`:

```typescript
export const USE_MOCK_MODE = true  // true = Mock, false = Supabase
```

**Mock Mode** (default):
- No Supabase connection needed
- Uses mock services in `src/ui_test/mockServices/`
- Perfect for frontend development/testing
- Test accounts: admin@test.com, manager@test.com, inspector@test.com (all password: password123)

**Real Mode**:
- Requires Supabase connection
- Set environment variables in `.env`
- Uses actual database and authentication

### Key Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components (DO NOT modify directly)
│   ├── layout/         # Header, Sidebar, Layout
│   ├── analytics/      # Analytics charts and filters
│   ├── defects/        # Defect management components
│   ├── inspection/     # Inspection form components
│   ├── management/     # Master data management
│   └── reports/        # Report generation components
├── pages/              # Route page components
├── hooks/              # Custom React hooks (useAuth, use-toast)
├── stores/             # Zustand stores (authStore)
├── lib/                # Utilities (supabase client, utils)
├── types/              # TypeScript type definitions
├── i18n/               # i18n configuration
├── locales/            # Translation files (ko, vi)
├── services/           # Real API services
├── ui_test/            # Mock data and services
│   ├── mockData/       # Mock data generators
│   └── mockServices/   # Mock service implementations
└── config/             # App configuration
```

### Database Schema (Supabase)

Core tables defined in `src/types/database.ts`:
- `users` - User profiles with role-based access (admin, manager, inspector)
- `machines` - CNC machine information
- `product_models` - Product model catalog
- `inspection_items` - Inspection criteria per model (specs, tolerances)
- `inspections` - Inspection execution records
- `inspection_results` - Detailed measurement data per inspection
- `defects` - Defect tracking and resolution

### Authentication & Authorization

Role-based access control:
- **Admin**: Full access to all features
- **Manager**: Analytics, reports, master data management
- **Inspector**: Dashboard, inspection execution, defect management

Routes are protected via `ProtectedRoute` component with `allowedRoles` prop.

### State Management Patterns

**Server State** (TanStack Query):
- Configured in `App.tsx` with 5-minute stale time
- Use for all data fetched from backend/mock services
- Automatic caching, refetching, and synchronization

**Client State** (Zustand):
- `authStore` - User authentication state
- Keep minimal, prefer server state when possible

**Form State** (React Hook Form):
- All forms use React Hook Form + Zod validation
- Always integrate with i18n for validation messages

### Inspection Process Flow

Core business logic for quality inspections:

1. **Setup** (`InspectionSetup.tsx`): Select machine and product model
2. **Execution** (`InspectionForm.tsx`):
   - Load inspection items for selected model
   - Enter measured values
   - Auto-validation against tolerances (min/max)
   - Real-time pass/fail determination
3. **Results**:
   - Pass: Save to inspections table
   - Fail: Auto-create defect record
4. **Photo Upload**: Defect photos stored in Supabase Storage bucket `defect-photos`

### Key Component Patterns

**Analytics Dashboard Components** (`src/components/analytics/`):
- KPICards - Summary metrics
- DefectRateTrendChart - Time series defect trends
- DefectTypeChart - Defect distribution by type
- MachinePerformanceChart - Per-machine pass rates
- ModelDefectChart - Per-model quality metrics
- InspectorPerformanceChart - Inspector productivity
- HourlyDistributionChart - Inspection timing patterns

All charts use Recharts and support responsive design.

**Management Components** (`src/components/management/`):
- ProductModelManagement - CRUD for product models
- InspectionItemManagement - CRUD for inspection criteria
- Dialog pattern for add/edit forms

### Mock Data System

600 inspection records across 90 days with realistic patterns:
- 10 machines with varying defect rates (2-5.5%)
- 15 product models
- 15 users (2 admin, 3 manager, 10 inspector)
- Time-based patterns (work hours, lunch break, weekday variations)
- Automatic defect generation for failed inspections

See `MOCK_DATA_INFO.md` for complete mock data documentation.

## Development Guidelines

### Adding New Features

1. Check if UI text is needed → Add to BOTH translation files
2. Import and use `useTranslation` hook
3. Follow existing component patterns in same feature area
4. Use shadcn/ui components for consistency
5. Implement mobile-first responsive design
6. Test in both mock and real mode if applicable

### Working with Forms

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

function createSchema(t: (key: string) => string) {
  return z.object({
    field: z.string().min(1, t('validation.required'))
  })
}

export function MyForm() {
  const { t } = useTranslation()
  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: { field: '' }
  })

  // ... render form
}
```

### Working with shadcn/ui

- Components live in `src/components/ui/`
- DO NOT manually edit these files
- Add new components via CLI: `npx shadcn@latest add [component]`
- Customize via `components.json` config
- Use `@/components/ui/[component]` imports

### Path Aliases

`@/` resolves to `src/` directory (configured in `vite.config.ts` and `tsconfig.json`)

```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
```

## Testing & Mock Accounts

When `USE_MOCK_MODE = true`:

```
Admin: admin@test.com / password123
Manager: manager@test.com / password123
Inspector: inspector@test.com / password123
```

Check browser console (F12) on login page for full list of test accounts.

## Important Files

- `src/config/app.config.ts` - Toggle mock/real mode, configure delays
- `src/types/database.ts` - Complete database schema
- `src/hooks/useAuth.ts` - Authentication logic with mock/real switching
- `src/App.tsx` - Route configuration and providers
- `Docs/claude.md` - Original detailed i18n guide
- `Docs/PRD.md` - Product requirements
- `Docs/STACK.md` - Technology stack details

## Supabase Setup (Real Mode)

1. Create `.env` file from `.env.example`
2. Add Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Set `USE_MOCK_MODE = false` in `src/config/app.config.ts`
4. Create database tables per schema in `src/types/database.ts`
5. Set up Row Level Security (RLS) policies for role-based access
6. Create Storage bucket `defect-photos` for defect photos

## Code Style

- TypeScript strict mode enabled
- ESLint configured for React + TypeScript
- PascalCase for components
- camelCase for variables/functions
- File naming: kebab-case (except components)
- No unused imports/variables
- Explicit types preferred over `any`
