-- Complete Database Restoration Script
-- Run this in your Supabase SQL Editor to restore all tables, functions, and objects

-- 1. Drop existing tables to start fresh (if they exist)
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS ai_agent_conversations CASCADE;
DROP TABLE IF EXISTS ai_agent_messages CASCADE;
DROP TABLE IF EXISTS ai_agent_sessions CASCADE;
DROP TABLE IF EXISTS user_budgets CASCADE;
DROP TABLE IF EXISTS budget_notifications CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS voice_usage CASCADE;
DROP TABLE IF EXISTS fx_rates CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_wallet_monthly_totals CASCADE;
DROP FUNCTION IF EXISTS list_wallet_transactions_for_review CASCADE;

-- 2. Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  active_currency TEXT DEFAULT 'EGP',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
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

-- Create indexes for user_settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_currency ON user_settings(active_currency);
CREATE INDEX idx_user_settings_theme ON user_settings(theme);

-- 3. Create expenses table
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

-- Add Row Level Security (RLS) to expenses
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

-- Add indexes for expenses
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON public.expenses(user_id, category);

-- 4. Create FX Rates Table
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_code TEXT NOT NULL, -- e.g. 'USD'
  quote_code TEXT NOT NULL, -- e.g. 'EGP'
  rate FLOAT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (base_code, quote_code)
);

-- 5. Create Voice Usage Table
CREATE TABLE voice_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id TEXT NOT NULL, -- e.g. '2025-06'
  voice_count INT NOT NULL DEFAULT 0,
  "limit" INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, month_id)
);

-- RLS for voice_usage
ALTER TABLE public.voice_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own voice usage" ON public.voice_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own voice usage" ON public.voice_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice usage" ON public.voice_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice usage" ON public.voice_usage FOR DELETE USING (auth.uid() = user_id);

-- 6. Create AI Agent tables
CREATE TABLE ai_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE ai_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for AI agent tables
ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;

-- Policies for AI agent tables
CREATE POLICY "Users can view their own AI sessions" ON ai_agent_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI sessions" ON ai_agent_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI sessions" ON ai_agent_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI sessions" ON ai_agent_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI conversations" ON ai_agent_conversations FOR SELECT USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can create their own AI conversations" ON ai_agent_conversations FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can update their own AI conversations" ON ai_agent_conversations FOR UPDATE USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can delete their own AI conversations" ON ai_agent_conversations FOR DELETE USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));

CREATE POLICY "Users can view their own AI messages" ON ai_agent_messages FOR SELECT USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can create their own AI messages" ON ai_agent_messages FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can update their own AI messages" ON ai_agent_messages FOR UPDATE USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));
CREATE POLICY "Users can delete their own AI messages" ON ai_agent_messages FOR DELETE USING (auth.uid() = (SELECT user_id FROM ai_agent_sessions WHERE id = session_id));

-- 7. Create budget tables
CREATE TABLE user_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id TEXT NOT NULL, -- e.g. '2025-06'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, month_id)
);

CREATE TABLE budget_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES user_budgets(id) ON DELETE CASCADE,
  threshold_percentage INTEGER DEFAULT 80,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for budget tables
ALTER TABLE user_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for budget tables
CREATE POLICY "Users can view their own budgets" ON user_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON user_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON user_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON user_budgets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own budget notifications" ON budget_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budget notifications" ON budget_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget notifications" ON budget_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget notifications" ON budget_notifications FOR DELETE USING (auth.uid() = user_id);

-- 8. Create debts table
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_owed BOOLEAN NOT NULL, -- true if user owes money, false if user is owed money
  due_date DATE,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for debts
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policies for debts
CREATE POLICY "Users can view their own debts" ON debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own debts" ON debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own debts" ON debts FOR DELETE USING (auth.uid() = user_id);

-- 9. Create wallet tables
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'ethereum',
  is_active BOOLEAN DEFAULT true,
  plaid_access_token TEXT,
  plaid_item_id TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_hash TEXT,
  from_address TEXT,
  to_address TEXT,
  amount DECIMAL(20,8),
  currency TEXT DEFAULT 'ETH',
  transaction_type TEXT NOT NULL, -- 'send', 'receive', 'swap', etc.
  status TEXT DEFAULT 'pending',
  block_number BIGINT,
  gas_used BIGINT,
  gas_price BIGINT,
  transaction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for wallet tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet tables
CREATE POLICY "Users can view their own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = (SELECT user_id FROM wallets WHERE id = wallet_id));
CREATE POLICY "Users can create their own wallet transactions" ON wallet_transactions FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM wallets WHERE id = wallet_id));
CREATE POLICY "Users can update their own wallet transactions" ON wallet_transactions FOR UPDATE USING (auth.uid() = (SELECT user_id FROM wallets WHERE id = wallet_id));
CREATE POLICY "Users can delete their own wallet transactions" ON wallet_transactions FOR DELETE USING (auth.uid() = (SELECT user_id FROM wallets WHERE id = wallet_id));

-- 10. Create all indexes
CREATE INDEX idx_fx_rates_base_quote ON public.fx_rates(base_code, quote_code);
CREATE INDEX idx_voice_usage_user_month ON public.voice_usage(user_id, month_id);
CREATE INDEX idx_ai_sessions_user ON ai_agent_sessions(user_id);
CREATE INDEX idx_ai_conversations_session ON ai_agent_conversations(session_id);
CREATE INDEX idx_ai_messages_session ON ai_agent_messages(session_id);
CREATE INDEX idx_budgets_user_month ON user_budgets(user_id, month_id);
CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_date ON wallet_transactions(transaction_date);

-- 11. Create functions
CREATE OR REPLACE FUNCTION get_wallet_monthly_totals(
  p_user_id UUID,
  p_month_id TEXT
)
RETURNS TABLE (
  wallet_id UUID,
  wallet_name TEXT,
  total_sent DECIMAL(20,8),
  total_received DECIMAL(20,8),
  net_amount DECIMAL(20,8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as wallet_id,
    w.name as wallet_name,
    COALESCE(SUM(CASE WHEN wt.transaction_type = 'send' THEN wt.amount ELSE 0 END), 0) as total_sent,
    COALESCE(SUM(CASE WHEN wt.transaction_type = 'receive' THEN wt.amount ELSE 0 END), 0) as total_received,
    COALESCE(SUM(CASE WHEN wt.transaction_type = 'receive' THEN wt.amount ELSE -wt.amount END), 0) as net_amount
  FROM wallets w
  LEFT JOIN wallet_transactions wt ON w.id = wt.wallet_id 
    AND wt.transaction_date >= (p_month_id || '-01')::DATE
    AND wt.transaction_date < (p_month_id || '-01')::DATE + INTERVAL '1 month'
  WHERE w.user_id = p_user_id
  GROUP BY w.id, w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION list_wallet_transactions_for_review(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  transaction_id UUID,
  wallet_name TEXT,
  transaction_hash TEXT,
  amount DECIMAL(20,8),
  currency TEXT,
  transaction_type TEXT,
  status TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.id as transaction_id,
    w.name as wallet_name,
    wt.transaction_hash,
    wt.amount,
    wt.currency,
    wt.transaction_type,
    wt.status,
    wt.transaction_date
  FROM wallet_transactions wt
  JOIN wallets w ON wt.wallet_id = w.id
  WHERE w.user_id = p_user_id
  ORDER BY wt.transaction_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agent_sessions_updated_at BEFORE UPDATE ON ai_agent_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_budgets_updated_at BEFORE UPDATE ON user_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database restoration completed successfully! All tables, functions, and policies have been created.' as status; 