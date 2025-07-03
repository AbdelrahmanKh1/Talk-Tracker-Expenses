-- Add source to expenses table to track where the expense came from
ALTER TABLE public.expenses
ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';

-- Create a type for the source
CREATE TYPE expense_source AS ENUM ('manual', 'voice', 'wallet');

-- Remove the default first
ALTER TABLE public.expenses
ALTER COLUMN source DROP DEFAULT;

-- Update any invalid values to 'manual'
UPDATE public.expenses
SET source = 'manual'
WHERE source NOT IN ('manual', 'voice', 'wallet');

-- Change the column type to the new enum
ALTER TABLE public.expenses
ALTER COLUMN source TYPE expense_source USING source::expense_source;

-- Set the default again
ALTER TABLE public.expenses
ALTER COLUMN source SET DEFAULT 'manual';

-- Create wallets table to store linked bank accounts/cards
CREATE TABLE public.wallets (
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
CREATE POLICY "Users can view their own wallets"
  ON public.wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets"
  ON public.wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON public.wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create wallet_transactions table to store raw transactions from the provider
CREATE TABLE public.wallet_transactions (
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
CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet transactions"
  ON public.wallet_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id); 