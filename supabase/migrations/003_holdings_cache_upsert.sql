-- Add unique constraint on (scheme_code, stock_isin) to support atomic upserts
-- instead of non-atomic delete-then-insert pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_cache_scheme_isin
  ON public.holdings_cache (scheme_code, stock_isin);
