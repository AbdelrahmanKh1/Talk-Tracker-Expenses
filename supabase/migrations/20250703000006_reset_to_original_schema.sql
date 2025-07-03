-- Reset database to original schema
-- This migration drops all the new tables and columns that were added

-- Drop wallet-related tables and functions
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP FUNCTION IF EXISTS get_wallet_monthly_totals CASCADE;
DROP FUNCTION IF EXISTS list_wallet_transactions_for_review CASCADE;

-- Drop AI agent tables
DROP TABLE IF EXISTS ai_agent_conversations CASCADE;
DROP TABLE IF EXISTS ai_agent_messages CASCADE;
DROP TABLE IF EXISTS ai_agent_sessions CASCADE;

-- Drop budget-related tables
DROP TABLE IF EXISTS user_budgets CASCADE;
DROP TABLE IF EXISTS budget_notifications CASCADE;

-- Drop debts table
DROP TABLE IF EXISTS debts CASCADE;

-- Drop voice usage table
DROP TABLE IF EXISTS voice_usage CASCADE;

-- Drop fx_rates table
DROP TABLE IF EXISTS fx_rates CASCADE;

-- Reset user_settings table to original state
-- First, drop the current user_settings table
DROP TABLE IF EXISTS user_settings CASCADE;

-- Recreate the original user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  active_currency TEXT DEFAULT 'EGP',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
  ON user_settings FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_currency ON user_settings(active_currency);
CREATE INDEX idx_user_settings_theme ON user_settings(theme);

-- Reset expenses table to original state
-- Drop the current expenses table
DROP TABLE IF EXISTS expenses CASCADE;

-- Recreate the original expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Miscellaneous',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Users can view their own expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
  ON public.expenses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
  ON public.expenses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
  ON public.expenses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add some indexes for better performance
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON public.expenses(user_id, category); 