# Portfolio X-Ray - Project Guide

## Overview

Full-stack app for analyzing Indian mutual fund portfolios. Users enter their MF holdings and allocation percentages; the app fetches underlying stock holdings and computes true stock-level exposure.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (dark theme) + custom CSS vars
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **MF Scheme Search**: mfapi.in (free, no API key)
- **MF Holdings Data**: RapidAPI "India Mutual Funds Portfolio Holding"
- **Charts**: Recharts
- **Validation**: Zod v4
- **Package manager**: pnpm

## Design System (Linear-inspired Dark UI)

All UI follows a Linear-inspired dark aesthetic:

- **Background**: `#000212` (deep dark blue-black)
- **Card/Surface**: `#0f1011`
- **Text Primary**: `#f7f8f8`
- **Text Secondary**: `#b4bcd0`
- **Text Tertiary**: `#8a8f98`
- **Border**: `rgba(255, 255, 255, 0.08)` (normal), `rgba(255, 255, 255, 0.15)` (hover)
- **Accent/Brand**: `#5e6ad2` (indigo), hover: `#6e7ae2`
- **Destructive**: `#e5484d`
- **Font**: Inter Variable (primary), monospace for numbers
- **Radii**: 8px (inputs), 12px (cards), 16px (modals)
- **Navbar**: 72px height, backdrop-blur, border-bottom

## Project Conventions

### File Organization
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components by domain (auth/, portfolio/, analysis/, layout/, ui/)
- `src/lib/` - Utilities (supabase/, api/, aggregation/, validation/)
- `src/types/` - TypeScript type definitions
- `supabase/migrations/` - SQL migration files

### Patterns
- Server components by default; `"use client"` only when needed
- Supabase server client for server components, browser client for client components
- Admin client (service role) only in API routes for cache writes
- RLS enforced on all user tables; cache tables readable by authenticated users
- Zod for all input validation
- Toast notifications via Sonner

### Security
- `RAPIDAPI_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only (no `NEXT_PUBLIC_` prefix)
- Middleware handles session refresh and auth redirects
- All protected routes under `(protected)/` route group
