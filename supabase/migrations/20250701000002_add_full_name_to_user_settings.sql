-- Add full_name column to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add index for better performance when querying by name
CREATE INDEX IF NOT EXISTS idx_user_settings_full_name ON user_settings(full_name);

-- Update RLS policies to allow users to update their own full_name
-- (assuming RLS is already enabled on user_settings) 