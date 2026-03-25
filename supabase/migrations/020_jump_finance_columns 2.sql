-- =============================================
-- Add verification_status and jump_contractor_id to master_profiles
-- Sprint V, Task 22
-- =============================================

-- Add verification_status column (replaces boolean is_verified with richer status)
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected'));

-- Add jump_contractor_id column (Jump Finance contractor reference)
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS jump_contractor_id TEXT;

-- Migrate existing is_verified data to verification_status
UPDATE master_profiles
  SET verification_status = CASE WHEN is_verified = true THEN 'approved' ELSE 'none' END
  WHERE verification_status = 'none' AND is_verified = true;
