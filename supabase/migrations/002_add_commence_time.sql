-- ── Migration 002: Add commence_time to arbitrage_opportunities ───────────────
-- Run this in your Supabase SQL Editor

ALTER TABLE public.arbitrage_opportunities
  ADD COLUMN IF NOT EXISTS commence_time TEXT;
