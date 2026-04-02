-- =============================================
-- FIX: RLS infinite recursion (BUG-E2E-03)
--
-- Problem: projects → stages → projects → ∞
--   "Masters see assigned projects" queries stages
--   "Project participants can read stages" queries projects
--
-- Solution: SECURITY DEFINER functions that bypass RLS
-- to check participation without triggering cross-table policies.
-- =============================================

-- ── 1. Helper functions (SECURITY DEFINER = bypass RLS) ──

-- Check if current user is a master assigned to any stage of a project
CREATE OR REPLACE FUNCTION is_master_on_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stages
    WHERE project_id = p_project_id
    AND master_id = auth.uid()
  );
$$;

-- Check if current user is a participant of a project (client, supervisor, or assigned master)
CREATE OR REPLACE FUNCTION is_project_participant(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND (client_id = auth.uid() OR supervisor_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM stages
    WHERE project_id = p_project_id
    AND master_id = auth.uid()
  );
$$;

-- ── 2. Fix projects policies ──

-- Drop the recursive policy
DROP POLICY IF EXISTS "Masters see assigned projects" ON projects;

-- Recreate using SECURITY DEFINER function (no stages subquery in RLS)
CREATE POLICY "Masters see assigned projects" ON projects
  FOR SELECT USING (is_master_on_project(id));

-- ── 3. Fix stages policies ──

-- Drop the old recursive policies
DROP POLICY IF EXISTS "Project participants can read stages" ON stages;
DROP POLICY IF EXISTS "Admins manage all stages" ON stages;
DROP POLICY IF EXISTS "Masters see assigned stages" ON stages;
DROP POLICY IF EXISTS "Supervisors see project stages" ON stages;
DROP POLICY IF EXISTS "Supervisors update project stages" ON stages;
DROP POLICY IF EXISTS "Supervisors insert project stages" ON stages;
DROP POLICY IF EXISTS "Clients see own project stages" ON stages;
DROP POLICY IF EXISTS "Masters update own stages" ON stages;

-- Recreate with non-recursive policies:

-- Masters: direct check on master_id (no cross-table query needed)
CREATE POLICY "Masters see own stages" ON stages
  FOR SELECT USING (master_id = auth.uid());

CREATE POLICY "Masters update own stages" ON stages
  FOR UPDATE USING (master_id = auth.uid());

-- Clients & Supervisors: use SECURITY DEFINER function
CREATE POLICY "Project owners read stages" ON stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid())
    )
  );

-- Supervisors can update/insert stages for their projects
CREATE POLICY "Supervisors manage project stages" ON stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND p.supervisor_id = auth.uid()
    )
  );

-- Clients can view stages (already covered by "Project owners read stages")

-- Admins can do everything
CREATE POLICY "Admins manage all stages" ON stages
  FOR ALL USING (is_admin());

-- ── 4. Fix chat_messages policies (potential recursion via projects+stages join) ──

DROP POLICY IF EXISTS "Project participants can read chat" ON chat_messages;
DROP POLICY IF EXISTS "Project participants can send messages" ON chat_messages;

CREATE POLICY "Project participants can read chat" ON chat_messages
  FOR SELECT USING (is_project_participant(project_id));

CREATE POLICY "Project participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_project_participant(project_id)
  );

-- ── 5. Fix photo_reports policies (also joins stages+projects) ──

DROP POLICY IF EXISTS "Project participants view photo reports" ON photo_reports;

CREATE POLICY "Project participants view photo reports" ON photo_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stages s
      WHERE s.id = photo_reports.stage_id
      AND (
        s.master_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = s.project_id
          AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid())
        )
      )
    )
  );

-- ── 6. Fix stages INSERT policy (also queries projects) ──

DROP POLICY IF EXISTS "Project owners can insert stages" ON stages;

CREATE POLICY "Clients can insert stages" ON stages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.client_id = auth.uid()
    )
  );
