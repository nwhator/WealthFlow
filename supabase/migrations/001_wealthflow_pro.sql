-- ============================================================
-- WealthFlow Pro — Database Migration
-- Run this in your Supabase SQL editor or via CLI
-- ============================================================

-- ── Subscriptions ────────────────────────────────────────────
create table if not exists subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references auth.users(id) on delete cascade not null,
  plan                    text not null default 'free',      -- 'free' | 'premium'
  status                  text not null default 'active',    -- 'active' | 'inactive' | 'cancelled'
  paddle_customer_id      text,
  paddle_subscription_id  text,
  paddle_price_id         text,
  paystack_customer_id    text,
  current_period_end      timestamp with time zone,
  created_at              timestamp with time zone default now(),
  updated_at              timestamp with time zone default now(),
  constraint subscriptions_user_id_key unique (user_id)
);

alter table subscriptions enable row level security;
create policy "Users read own subscription"  on subscriptions for select using (auth.uid() = user_id);
create policy "Users update own subscription" on subscriptions for update using (auth.uid() = user_id);

-- ── Predictions Cache ─────────────────────────────────────────
create table if not exists predictions_cache (
  id             uuid primary key default gen_random_uuid(),
  match          text not null,
  sport          text,
  market         text,
  prediction     text,
  odds           numeric,
  confidence     integer check (confidence between 0 and 100),
  reason         text,
  edge           numeric default 0,
  market_average numeric default 0,
  market_margin  numeric default 0,
  commence_time  text,
  bookmaker      text,
  fetched_at     timestamp with time zone default now()
);

-- ── Arbitrage Cache ───────────────────────────────────────────
create table if not exists arbitrage_cache (
  id                    uuid primary key default gen_random_uuid(),
  match                 text not null,
  sport                 text,
  market                text,
  commence_time         text,
  arbitrage_percentage  numeric,
  guaranteed_profit     numeric,
  implied_prob          numeric,
  stake_distribution    jsonb,
  outcomes              jsonb,
  fetched_at            timestamp with time zone default now()
);

-- Index for efficient cache freshness checks
create index if not exists predictions_cache_fetched_at_idx on predictions_cache(fetched_at desc);
create index if not exists arbitrage_cache_fetched_at_idx   on arbitrage_cache(fetched_at desc);
