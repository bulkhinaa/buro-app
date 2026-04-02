-- =============================================
-- FIX: Allow supervisors to read master profiles for assignment
-- Uses SECURITY DEFINER to avoid self-referential RLS recursion on profiles
-- =============================================

CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'supervisor');
$$;

DROP POLICY IF EXISTS "Supervisors can view master profiles" ON profiles;

CREATE POLICY "Supervisors can view master profiles" ON profiles
  FOR SELECT USING (is_supervisor() AND role = 'master');
