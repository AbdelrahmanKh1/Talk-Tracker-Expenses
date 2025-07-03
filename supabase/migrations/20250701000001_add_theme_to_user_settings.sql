-- Add theme column to user_settings table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
    CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme);
  END IF;
END $$; 