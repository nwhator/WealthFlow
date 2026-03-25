-- ==========================================
-- WealthFlow Supabase Schema Initialization
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Tables Creation
-- ==========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Savings', 'Betting', 'Liquidity'
  balance NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'bet')),
  amount NUMERIC NOT NULL,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bets table
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match TEXT NOT NULL,
  odds NUMERIC NOT NULL,
  stake NUMERIC NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'win', 'loss')),
  profit_loss NUMERIC DEFAULT 0.00,
  bookmaker TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Savings logs table
CREATE TABLE IF NOT EXISTS public.savings_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. Triggers for Default User Setup
-- ==========================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create the user profile in public.users
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);

  -- 2. Create default accounts for the new user
  INSERT INTO public.accounts (user_id, name, balance)
  VALUES 
    (new.id, 'Liquidity', 0.00),
    (new.id, 'Savings', 0.00),
    (new.id, 'Betting', 0.00);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (Supabase managed auth table)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. Row Level Security (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile." 
  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Accounts policies
CREATE POLICY "Users can manage their own accounts." 
  ON public.accounts FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage their own transactions." 
  ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Bets policies
CREATE POLICY "Users can manage their own bets." 
  ON public.bets FOR ALL USING (auth.uid() = user_id);

-- Savings logs policies
CREATE POLICY "Users can manage their own savings logs." 
  ON public.savings_logs FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. Utility Database Functions
-- ==========================================
-- Function to safely process a double-entry transaction
CREATE OR REPLACE FUNCTION public.process_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC,
  p_from_account UUID DEFAULT NULL,
  p_to_account UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Validation based on type
  IF p_type = 'transfer' AND (p_from_account IS NULL OR p_to_account IS NULL) THEN
    RAISE EXCEPTION 'Transfer must have both from and to accounts';
  END IF;

  -- Insert the transaction record
  INSERT INTO public.transactions (user_id, type, amount, from_account_id, to_account_id, note)
  VALUES (p_user_id, p_type, p_amount, p_from_account, p_to_account, p_note)
  RETURNING id INTO v_transaction_id;

  -- Update balances based on type
  IF p_type = 'expense' THEN
    UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account AND user_id = p_user_id;
  ELSIF p_type = 'income' THEN
    UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account AND user_id = p_user_id;
  ELSIF p_type = 'transfer' THEN
    UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account AND user_id = p_user_id;
    UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account AND user_id = p_user_id;
  END IF;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ==========================================
-- 5. Arbitrage System Tables
-- ==========================================

-- Bookmakers table
CREATE TABLE IF NOT EXISTS public.bookmakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Arbitrage opportunities table
CREATE TABLE IF NOT EXISTS public.arbitrage_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match TEXT NOT NULL,
  sport TEXT,
  market TEXT NOT NULL,
  arbitrage_percentage NUMERIC NOT NULL,
  profit_estimate NUMERIC NOT NULL,
  details JSONB NOT NULL, -- To store stake distribution, odds, and bookmaker names
  is_bookmarked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view bookmakers." ON public.bookmakers FOR SELECT USING (true);
CREATE POLICY "Users can manage their own arbitrage opportunities." 
  ON public.arbitrage_opportunities FOR ALL USING (auth.uid() = user_id);

-- Seed some common bookmakers
INSERT INTO public.bookmakers (name) VALUES 
('Bet365'), ('1xBet'), ('BetWay'), ('SportyBet'), ('BetKing'), ('Melbet'), ('Bwin')
ON CONFLICT (name) DO NOTHING;

-- Updated