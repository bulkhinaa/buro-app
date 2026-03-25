-- SEC-1: Prevent users from changing their own role via UPDATE on profiles.
-- The original policy "Users can update own profile" allows unrestricted UPDATE,
-- meaning a user could SET role = 'admin' and escalate privileges.

-- Drop the permissive policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with a WITH CHECK that ensures role cannot be changed
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()));
