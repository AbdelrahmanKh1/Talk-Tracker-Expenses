-- Add full_name column to user_settings table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name TEXT;
    CREATE INDEX IF NOT EXISTS idx_user_settings_full_name ON user_settings(full_name);
  END IF;
END $$; 