-- Add last_sync_cursor to wallets table
ALTER TABLE public.wallets
ADD COLUMN last_sync_cursor TEXT;

-- Add provider_transaction_id to expenses table to prevent duplicates
ALTER TABLE public.expenses
ADD COLUMN provider_transaction_id TEXT;

-- Add an index for faster lookups
CREATE INDEX idx_expenses_provider_transaction_id ON public.expenses(provider_transaction_id);

-- Also add a unique constraint to be absolutely sure
ALTER TABLE public.expenses
ADD CONSTRAINT unique_provider_transaction_id UNIQUE (provider_transaction_id); 