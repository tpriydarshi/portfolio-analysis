create table if not exists public.analysis_cache (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  result jsonb not null,
  holdings_hash text not null,
  computed_at timestamptz not null default now(),
  unique(portfolio_id)
);

-- Allow authenticated users to read, admin to write
alter table public.analysis_cache enable row level security;

create policy "Users can read own analysis cache" on public.analysis_cache for select using (
  portfolio_id in (select id from portfolios where user_id = auth.uid())
);
