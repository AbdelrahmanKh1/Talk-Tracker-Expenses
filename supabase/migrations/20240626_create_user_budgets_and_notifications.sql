-- Create user_budgets table
create table if not exists user_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  month text not null, -- e.g. "2025-06"
  budget_amount float not null,
  created_at timestamp with time zone default now()
);

-- Create user_notifications table
create table if not exists user_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  body text,
  type text, -- e.g. 'budget'
  created_at timestamp with time zone default now()
);

-- Add Row Level Security (RLS) to user_budgets
ALTER TABLE public.user_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for user_budgets
CREATE POLICY "Users can view their own budgets" 
  ON public.user_budgets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
  ON public.user_budgets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON public.user_budgets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
  ON public.user_budgets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add Row Level Security (RLS) to user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.user_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" 
  ON public.user_notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.user_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON public.user_notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_month ON public.user_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_type ON public.user_notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created ON public.user_notifications(user_id, created_at DESC); 