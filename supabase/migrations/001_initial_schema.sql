-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Portfolios table
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  total_value_inr numeric check (total_value_inr is null or total_value_inr > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolios enable row level security;

create policy "Users can view own portfolios"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "Users can create own portfolios"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update own portfolios"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete own portfolios"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- Portfolio Funds table
create table public.portfolio_funds (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  scheme_code integer not null,
  scheme_name text not null,
  allocation_pct numeric not null check (allocation_pct > 0 and allocation_pct <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_funds enable row level security;

create policy "Users can view own portfolio funds"
  on public.portfolio_funds for select
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = portfolio_funds.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can create own portfolio funds"
  on public.portfolio_funds for insert
  with check (
    exists (
      select 1 from public.portfolios
      where portfolios.id = portfolio_funds.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can update own portfolio funds"
  on public.portfolio_funds for update
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = portfolio_funds.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

create policy "Users can delete own portfolio funds"
  on public.portfolio_funds for delete
  using (
    exists (
      select 1 from public.portfolios
      where portfolios.id = portfolio_funds.portfolio_id
        and portfolios.user_id = auth.uid()
    )
  );

-- Holdings Cache table (read by authenticated, write by service role)
create table public.holdings_cache (
  id uuid primary key default gen_random_uuid(),
  scheme_code integer not null,
  stock_isin text not null,
  stock_name text not null,
  holding_pct numeric not null,
  sector text,
  fetched_at timestamptz not null default now()
);

create index idx_holdings_cache_scheme on public.holdings_cache(scheme_code);
create index idx_holdings_cache_fetched on public.holdings_cache(scheme_code, fetched_at);

alter table public.holdings_cache enable row level security;

create policy "Authenticated users can read holdings cache"
  on public.holdings_cache for select
  to authenticated
  using (true);

-- Scheme Search Cache table
create table public.scheme_search_cache (
  scheme_code integer primary key,
  scheme_name text not null,
  fund_house text,
  cached_at timestamptz not null default now()
);

alter table public.scheme_search_cache enable row level security;

create policy "Authenticated users can read scheme cache"
  on public.scheme_search_cache for select
  to authenticated
  using (true);
