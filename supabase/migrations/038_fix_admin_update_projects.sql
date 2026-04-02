-- =============================================
-- FIX: Missing UPDATE/INSERT policies for admin/supervisor on projects
-- Admin could SELECT but not UPDATE projects (supervisor assignment failed silently)
-- =============================================

DROP POLICY IF EXISTS "Admins update all projects" ON projects;
DROP POLICY IF EXISTS "Admins insert projects" ON projects;
DROP POLICY IF EXISTS "Supervisors update own projects" ON projects;

CREATE POLICY "Admins update all projects" ON projects
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins insert projects" ON projects
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Supervisors update own projects" ON projects
  FOR UPDATE USING (supervisor_id = auth.uid());
