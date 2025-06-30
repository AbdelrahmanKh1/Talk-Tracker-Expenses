-- Create expenses table
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

-- FX Rates Table
CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_code TEXT NOT NULL, -- e.g. 'USD'
  quote_code TEXT NOT NULL, -- e.g. 'EGP'
  rate FLOAT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (base_code, quote_code)
);

-- Voice Usage Table
CREATE TABLE IF NOT EXISTS voice_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id TEXT NOT NULL, -- e.g. '2025-06'
  voice_count INT NOT NULL DEFAULT 0,
  "limit" INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, month_id)
);

-- Add active_currency to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS active_currency TEXT;

-- RLS for voice_usage
ALTER TABLE public.voice_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own voice usage" ON public.voice_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own voice usage" ON public.voice_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice usage" ON public.voice_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice usage" ON public.voice_usage FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fx_rates_base_quote ON public.fx_rates(base_code, quote_code);
CREATE INDEX IF NOT EXISTS idx_voice_usage_user_month ON public.voice_usage(user_id, month_id);
