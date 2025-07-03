-- Fix user_budgets table missing columns
-- This script adds the missing created_at and updated_at columns

-- 1. Add missing columns to user_budgets table
DO $$
BEGIN
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'created_at') THEN
    ALTER TABLE user_budgets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_budgets' AND column_name = 'updated_at') THEN
    ALTER TABLE user_budgets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
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

-- 3. Set default values for existing rows that have NULL timestamps
UPDATE user_budgets 
SET created_at = now() 
WHERE created_at IS NULL;

UPDATE user_budgets 
SET updated_at = now() 
WHERE updated_at IS NULL;

-- 4. Make required columns NOT NULL
ALTER TABLE user_budgets ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN budget_amount SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN budget_currency SET NOT NULL;

-- 5. Ensure unique constraint exists
DO $$
BEGIN
  -- Drop any existing unique constraints that might conflict
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'user_budgets'::regclass 
    AND contype = 'u'
  ) LOOP
    EXECUTE 'ALTER TABLE user_budgets DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- Create the correct unique constraint
ALTER TABLE user_budgets ADD CONSTRAINT user_budgets_user_month_unique UNIQUE (user_id, month);

-- 6. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at on user_budgets
DROP TRIGGER IF EXISTS update_user_budgets_updated_at ON user_budgets;
CREATE TRIGGER update_user_budgets_updated_at 
    BEFORE UPDATE ON user_budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_month ON user_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_budgets_created_at ON user_budgets(created_at);

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
SELECT 'user_budgets table structure fixed successfully! All required columns added.' as status; 