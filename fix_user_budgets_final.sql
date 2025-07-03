-- Fix user_budgets table missing columns (Final Version)
-- This script adds the missing created_at and updated_at columns

-- 1. Add missing columns to user_budgets table
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(10,2);
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'EGP';
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS month TEXT;

-- 2. Set default values for existing rows that have NULL timestamps
UPDATE user_budgets 
SET created_at = now() 
WHERE created_at IS NULL;

UPDATE user_budgets 
SET updated_at = now() 
WHERE updated_at IS NULL;

-- 3. Set default values for budget columns if they're NULL
UPDATE user_budgets 
SET budget_amount = 0 
WHERE budget_amount IS NULL;

UPDATE user_budgets 
SET budget_currency = 'EGP' 
WHERE budget_currency IS NULL;

UPDATE user_budgets 
SET month = '2025-07' 
WHERE month IS NULL;

-- 4. Make required columns NOT NULL
ALTER TABLE user_budgets ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN budget_amount SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE user_budgets ALTER COLUMN budget_currency SET NOT NULL;

-- 5. Drop existing unique constraints (if any)
ALTER TABLE user_budgets DROP CONSTRAINT IF EXISTS user_budgets_user_month_unique;
ALTER TABLE user_budgets DROP CONSTRAINT IF EXISTS user_budgets_user_id_month_id_key;

-- 6. Create the correct unique constraint
ALTER TABLE user_budgets ADD CONSTRAINT user_budgets_user_month_unique UNIQUE (user_id, month);

-- 7. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for updated_at on user_budgets
DROP TRIGGER IF EXISTS update_user_budgets_updated_at ON user_budgets;
CREATE TRIGGER update_user_budgets_updated_at 
    BEFORE UPDATE ON user_budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_month ON user_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_budgets_created_at ON user_budgets(created_at);

-- 10. Show the final table structure
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