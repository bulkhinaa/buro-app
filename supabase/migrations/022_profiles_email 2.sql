-- =============================================
-- Add email column to profiles table
-- Sprint VI, Task 1.1
-- =============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email)
  WHERE email IS NOT NULL;
