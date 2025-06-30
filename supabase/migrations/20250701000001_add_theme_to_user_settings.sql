-- Add theme column to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- Add index for better performance when querying by theme
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme); 