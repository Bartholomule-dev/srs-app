-- Add recent_skins column to profiles for skin recency tracking
-- Part of Blueprint + Skin system

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recent_skins text[] DEFAULT '{}';

COMMENT ON COLUMN profiles.recent_skins IS
  'Array of recently used skin IDs for recency-based selection (last 10 max)';
