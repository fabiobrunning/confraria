# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Confraria Pedra Branca - A consortium management system (sistema de gestao de consorcios) built with Next.js 14 and Supabase. The app manages consortium groups, members, quotas, and draws.

## Commands

```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Run production server
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with RLS)
- **UI**: shadcn/ui components with Tailwind CSS
- **State**: TanStack Query for server state
- **Forms**: React Hook Form + Zod validation

### Directory Structure
```
app/
  (auth)/           # Public auth routes (/auth)
  (protected)/      # Auth-required routes with Sidebar layout
  api/              # API routes (draws endpoints)
components/
  ui/               # shadcn/ui components
  draw/             # Draw-specific components
  providers/        # React Query provider
hooks/              # Custom hooks (use-admin, use-toast)
lib/
  supabase/         # Supabase client (client.ts, server.ts, types.ts)
  schemas.ts        # Zod validation schemas
supabase/
  migrations/       # Database migrations
```

### Authentication Flow
1. Middleware (`middleware.ts`) checks for Supabase auth cookies
2. Protected routes redirect to `/auth` if unauthenticated
3. `app/(protected)/layout.tsx` validates session server-side and loads user profile
4. Client-side: `useAdmin()` hook checks admin role

### Supabase Client Usage
- **Server Components/Actions**: Use `createClient()` from `@/lib/supabase/server`
- **Client Components**: Use `createClient()` from `@/lib/supabase/client`

### Database Schema (key tables)
- `profiles`: User profiles linked to Supabase auth (role: admin/member)
- `groups`: Consortium groups with asset value, quotas, monthly value
- `quotas`: Individual quotas linking members to groups (status: active/contemplated)
- `draws`: Draw history for groups with winning numbers
- `companies`: Company entities
- `member_companies`: Links members to companies

### User Roles
- `admin`: Full access to all features
- `member`: Limited access to own data

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## TypeScript

Strict mode enabled with noUnusedLocals/Parameters. Database types are manually maintained in `lib/supabase/types.ts`.

## Path Aliases

`@/*` maps to project root (e.g., `@/components`, `@/lib/supabase/client`)
