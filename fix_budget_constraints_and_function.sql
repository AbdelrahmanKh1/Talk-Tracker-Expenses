-- Fix Budget Constraints and Function Issues
-- This script ensures the user_budgets table has the correct structure and constraints

-- 1. First, let's check and fix the user_budgets table structure
DO $$
BEGIN
  -- Add budget_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'budget_amount') THEN
    ALTER TABLE user_budgets ADD COLUMN budget_amount DECIMAL(10,2);
  END IF;
  
  -- Add budget_currency column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'budget_currency') THEN
    ALTER TABLE user_budgets ADD COLUMN budget_currency TEXT DEFAULT 'EGP';
  END IF;
  
  -- Add month column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'month') THEN
    ALTER TABLE user_budgets ADD COLUMN month TEXT;
  END IF;
END $$;

-- 2. Copy data from old column names if they exist
DO $$
BEGIN
  -- Copy from amount to budget_amount
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'amount') THEN
    UPDATE user_budgets 
    SET budget_amount = amount 
    WHERE budget_amount IS NULL AND amount IS NOT NULL;
  END IF;
  
  -- Copy from month_id to month
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'month_id') THEN
    UPDATE user_budgets 
    SET month = month_id 
    WHERE month IS NULL AND month_id IS NOT NULL;
  END IF;
  
  -- Copy from currency to budget_currency
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'currency') THEN
    UPDATE user_budgets 
    SET budget_currency = currency 
    WHERE budget_currency IS NULL AND currency IS NOT NULL;
  END IF;
END $$;

-- 3. Make columns NOT NULL
ALTER TABLE user_budgets ALTER COLUMN budget_amount SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN budget_currency SET NOT NULL;

-- 4. Drop any existing unique constraints that might conflict
DO $$
BEGIN
  -- Drop any existing unique constraints on user_budgets
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'user_budgets'::regclass 
    AND contype = 'u'
  ) LOOP
    EXECUTE 'ALTER TABLE user_budgets DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- 5. Create the correct unique constraint for upsert operations
ALTER TABLE user_budgets ADD CONSTRAINT user_budgets_user_month_unique UNIQUE (user_id, month);

-- 6. Create user_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  type TEXT, -- e.g. 'budget'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
  ON user_notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" 
  ON user_notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON user_notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON user_notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_month ON user_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_type ON user_notifications(user_id, type);

-- 8. Add source column to expenses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'source') THEN
    ALTER TABLE expenses ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- 9. Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_budgets' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Budget constraints and table structure fixed successfully!' as status; 