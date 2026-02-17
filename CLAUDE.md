# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Confraria Pedra Branca** — A consortium and networking management system for a members' club. Built with Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), shadcn/ui, Tailwind CSS, TanStack React Query, and Zod validation.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
npx playwright test  # Run all E2E tests
npx playwright test e2e/api.spec.ts  # Run single E2E test file
```

## Architecture

### Route Groups (App Router)

- `app/(auth)/` — Login page, unauthenticated layout
- `app/(protected)/` — All authenticated pages (dashboard, members, companies, groups, profile, business-transactions)
- `app/(protected)/admin/` — Admin-only pages (pre-registrations, prospects, companies, consortium, link-company)
- `app/api/` — API routes organized by domain (admin/, auth/, members/, companies/, dashboard/, reports/, etc.)
- `app/quero-conhecer/` — Public landing page for prospects

### Authentication Flow

1. **Middleware** (`middleware.ts`): Edge middleware using `@supabase/ssr`, validates JWT via `supabase.auth.getUser()`, protects all routes under `/(protected)/`, redirects unauthenticated users to `/auth`
2. **Supabase clients** (`lib/supabase/`):
   - `client.ts` → `createClient()` for browser (createBrowserClient)
   - `server.ts` → `createClient()` for server components/API routes (uses cookies)
   - `server.ts` → `createAdminClient()` for admin operations (uses SERVICE_ROLE_KEY, bypasses RLS)
3. **Roles**: `admin` and `member` stored in `profiles.role`. Admin checks happen in API routes by querying the profile.

### Pre-Registration System

Core business feature. Admin creates a pre-registration → system generates a 12-char temporary password → hashed with bcrypt (salt: 12) → stored in `pre_registration_attempts` → plain text returned once for WhatsApp delivery → synced to Supabase Auth. Has rate limiting (10/hr), expiration (30 days), max attempts (5), lockout (15min).

### API Route Pattern

All API routes follow this structure:
1. Rate limit check (`lib/rate-limit.ts` — in-memory, resets on restart)
2. Auth check via `supabase.auth.getSession()`
3. Admin authorization via `profiles.role` query
4. Zod validation of request body
5. Supabase database operation
6. Activity logging (`lib/activity-log.ts` — fire-and-forget)
7. Standardized response via `apiSuccess()`/`apiError()` from `lib/api-response.ts`

### Data Fetching Patterns

- **Server components**: Direct Supabase queries via `await createClient()`
- **Client components**: React Query (`useQuery`/`useMutation`) calling `/api/` routes. Config: `staleTime: 60s`, `retry: 1`, `refetchOnWindowFocus: false`

### Key Database Tables

- `profiles` — Users (extends auth.users). Has soft delete (`deleted_at`). Fields: full_name, phone, role, instagram, full address (cep, street, number, complement, neighborhood, city, state)
- `companies` — Member businesses with CNPJ
- `groups` — Consortium groups (replaced deprecated `consortium_groups`)
- `quotas` — Group membership slots (active/contemplated)
- `draws` — Lottery draws per group
- `prospects` — Potential members (status: new/contacted/in_progress/converted/rejected)
- `pre_registration_attempts` — Temporary password tracking with security fields
- `activity_logs` — Audit trail (admin-only readable)
- `member_companies` — Many-to-many junction between profiles and companies
- **RLS everywhere**: Admins see all, members see only their own data

### Validation Schemas

`lib/schemas.ts` contains all Zod schemas. Common format validations:
- Phone: `(00) 00000-0000`, normalize with `phone.replace(/\D/g, '')`
- CNPJ: `00.000.000/0000-00`
- CEP: `00000-000`
- Instagram: `@username`

### Component Organization

- `components/ui/` — 50+ shadcn/ui primitives (style: default, baseColor: slate, CSS variables)
- `components/layout/` — PageContainer, PageHeader, EmptyState
- `components/{feature}/` — Reusable feature components (auth, members, companies, etc.)
- Feature-specific components colocated in `app/(protected)/.../components/`
- shadcn aliases: `@/components`, `@/components/ui`, `@/lib/utils`

### Styling

Tailwind CSS 3 with custom fonts: Inter (sans), Archive (display), Cormorant Garamond (serif). Dark mode enabled via `class` strategy. Uses `tailwindcss-animate` plugin.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Required
NEXT_PUBLIC_SUPABASE_ANON_KEY # Required
SUPABASE_SERVICE_ROLE_KEY     # Required for admin operations (server-only)
```

## Testing

Playwright E2E tests in `e2e/`. Tests are designed to be resilient to DB being offline — API tests verify status codes without assuming DB availability. Zod validation tests always return 400 regardless of DB state.

Config: Chromium only, baseURL from `PLAYWRIGHT_BASE_URL` or `localhost:3000`, auto-starts dev server.

## Key Conventions

- TypeScript strict mode enabled
- `export const dynamic = 'force-dynamic'` on protected page routes
- Soft delete pattern: set `deleted_at` instead of physical DELETE, filter with `deleted_at IS NULL`
- Server Actions in `app/actions/auth.ts`
- All conversations with the user must be in **Portuguese (Brazil)**; code, variables, and commits stay in English
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
