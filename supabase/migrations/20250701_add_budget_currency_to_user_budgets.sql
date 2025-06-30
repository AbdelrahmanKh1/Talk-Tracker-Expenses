-- Add budget_currency to user_budgets for multi-currency support
ALTER TABLE user_budgets ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'EGP'; 