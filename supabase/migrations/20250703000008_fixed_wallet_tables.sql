-- Fixed wallet tables migration
-- This handles the enum type creation properly

-- First, create the enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_source') THEN
    CREATE TYPE expense_source AS ENUM ('manual', 'voice', 'wallet');
  END IF;
END $$;

-- Add source column to expenses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'source') THEN
    ALTER TABLE public.expenses ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
  END IF;
END $$;

-- Safely change the column type to the new enum
DO $$
BEGIN
  -- Only alter if the column exists and is not already the enum type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'source' AND data_type = 'USER-DEFINED') THEN
    -- Column is already enum type, do nothing
    NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'source') THEN
    -- Remove the default first
    ALTER TABLE public.expenses ALTER COLUMN source DROP DEFAULT;
    -- Update any invalid values to 'manual'
    UPDATE public.expenses SET source = 'manual' WHERE source NOT IN ('manual', 'voice', 'wallet');
    -- Change the column type to the new enum
    ALTER TABLE public.expenses ALTER COLUMN source TYPE expense_source USING source::expense_source;
    -- Set the default again
    ALTER TABLE public.expenses ALTER COLUMN source SET DEFAULT 'manual';
  END IF;
END $$;

-- Create wallets table to store linked bank accounts/cards
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'Plaid', 'TrueLayer'
  provider_item_id TEXT NOT NULL, -- The ID from the provider for the linked item
  access_token TEXT NOT NULL, -- This should be encrypted
  wallet_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_item_id)
);

-- Add Row Level Security (RLS) for wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
CREATE POLICY "Users can view their own wallets"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own wallets" ON public.wallets;
CREATE POLICY "Users can create their own wallets"
  ON public.wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wallets" ON public.wallets;
CREATE POLICY "Users can delete their own wallets"
  ON public.wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create wallet_transactions table to store raw transactions from the provider
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets ON DELETE CASCADE,
    provider_transaction_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(wallet_id, provider_transaction_id)
);

-- Add Row Level Security (RLS) for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_transactions
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can create their own wallet transactions"
  ON public.wallet_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id); 