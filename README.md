# Portfolio X-Ray

A full-stack app for analyzing Indian mutual fund portfolios. Enter your MF holdings and allocation percentages — the app fetches underlying stock holdings from official AMC disclosures and computes your true stock-level exposure across funds.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (dark theme, Linear-inspired)
- **Database & Auth**: Supabase (PostgreSQL + Auth + RLS)
- **MF Scheme Search**: mfapi.in (free, no API key)
- **MF Holdings Data**: AMFI official AMC portfolio Excel files (SEBI-mandated monthly disclosures)
- **Excel Parsing**: ExcelJS
- **Charts**: Recharts
- **Validation**: Zod v4
- **Package Manager**: pnpm

## Features

- Search and add mutual fund schemes (powered by mfapi.in)
- Set allocation percentages per fund
- Analyze true stock-level exposure across your portfolio
- Detect stock overlap between funds
- Sector-wise breakdown with pie and bar charts
- Holdings data sourced from official SEBI-mandated AMC disclosures (not third-party APIs)

## Project Structure

```
├── scripts/
│   └── refresh-holdings.ts      # CLI script to refresh holdings from AMC Excel files
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login & signup pages
│   │   ├── (protected)/          # Dashboard, portfolio detail, analysis pages
│   │   ├── api/
│   │   │   ├── holdings/[schemeCode]/  # Holdings API (cache + on-demand fetch)
│   │   │   ├── portfolios/[id]/analyze/  # Portfolio analysis endpoint
│   │   │   └── schemes/search/   # Scheme search proxy
│   │   └── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── analysis/             # Charts, tables, overlap highlights
│   │   ├── auth/                 # Login/signup forms
│   │   ├── layout/               # Navbar, footer
│   │   ├── portfolio/            # Fund search, allocation list, portfolio form
│   │   └── ui/                   # shadcn/ui primitives
│   ├── lib/
│   │   ├── aggregation/          # Stock exposure computation logic
│   │   ├── api/
│   │   │   ├── amfi/             # AMC registry, Excel parser, scheme mapper
│   │   │   ├── holdings-provider.ts  # Holdings fetch with AMFI fallback
│   │   │   └── mfapi.ts          # mfapi.in client
│   │   ├── supabase/             # Server, client, and admin Supabase clients
│   │   └── validation/           # Zod schemas for portfolio input
│   └── types/                    # TypeScript types (database, holdings)
├── supabase/migrations/          # SQL migrations
└── package.json
```

## Prerequisites

- Node.js 18+
- pnpm
- A Supabase project (for database & auth)

## Setup

1. **Clone and install dependencies**:

   ```bash
   git clone <repo-url>
   cd portfolio-analysis
   pnpm install
   ```

2. **Configure environment variables** — create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run Supabase migrations** — apply the SQL files in `supabase/migrations/` to your Supabase project (via the Supabase dashboard SQL editor or CLI).

4. **Populate holdings data**:

   ```bash
   pnpm run refresh-holdings
   ```

   This downloads portfolio Excel files from 12 supported AMCs, parses them, and populates the `holdings_cache` table in Supabase. Defaults to the previous month's data.

5. **Start the dev server**:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Holdings Data Refresh

Holdings data comes from official SEBI-mandated monthly portfolio disclosures published by each AMC as Excel files. The refresh script downloads and parses these.

```bash
# Refresh all 12 AMCs (defaults to previous month)
pnpm run refresh-holdings

# Refresh a specific AMC only
pnpm run refresh-holdings --amc hdfc

# Refresh for a specific month/year
pnpm run refresh-holdings --month 01 --year 2026
```

### Supported AMCs

HDFC, ICICI Prudential, SBI, Mirae Asset, Axis, PPFAS (Parag Parikh), UTI, Kotak, Motilal Oswal, Navi, HSBC, Bandhan

### On-demand fallback

If a scheme isn't in the cache when a user triggers analysis, the app attempts an on-demand download and parse of the relevant AMC's Excel file. For best results, run the refresh script monthly.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm run refresh-holdings` | Refresh MF holdings from AMC Excel files |

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

Tests cover: stock exposure computation, Excel parser (header detection, multi-scheme files, ISIN filtering), mfapi.in client, and input validation.
