-- =============================================
-- SEC-6: Create is_admin() function
-- 3 RLS policies reference is_admin() but it was never defined.
-- Pattern follows is_supervisor() from migration 037.
-- Uses SECURITY DEFINER to avoid self-referential RLS recursion on profiles.
-- =============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;
