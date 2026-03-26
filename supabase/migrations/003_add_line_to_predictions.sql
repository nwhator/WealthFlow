-- ── Migration 003: Add line column to predictions_cache ──────────────────────
-- Stores the numeric point value for totals/spreads (e.g. 2.5 for Over/Under 2.5)
-- Run this in your Supabase SQL Editor

ALTER TABLE public.predictions_cache
  ADD COLUMN IF NOT EXISTS line NUMERIC;
