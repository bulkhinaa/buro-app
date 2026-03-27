-- SEC-1: BEFORE UPDATE trigger on profiles to prevent role/is_verified escalation
-- Non-admins cannot change their own role or is_verified fields.
-- Admins (checked via auth.uid()) can change these fields for any user.
-- This is a defense-in-depth measure on top of the RLS WITH CHECK in migration 030.

CREATE OR REPLACE FUNCTION protect_profiles_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to change role and is_verified
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- For non-admins: always reset role and is_verified to their original values
  NEW.role := OLD.role;
  NEW.is_verified := OLD.is_verified;

  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists (idempotent)
DROP TRIGGER IF EXISTS trg_protect_profiles_update ON profiles;

CREATE TRIGGER trg_protect_profiles_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profiles_update();
