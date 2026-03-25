-- =============================================
-- CRIT-02: Allow masters to read projects they are assigned to
-- Required for taskStore join: stages → projects → objects
-- =============================================

-- Masters need to read projects where they have at least one assigned stage.
-- Without this policy, PostgREST nested select (stages → projects) returns null
-- for master users because existing project RLS only covers clients, supervisors, admins.

CREATE POLICY "Masters see assigned projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stages s
      WHERE s.project_id = projects.id
      AND s.master_id = auth.uid()
    )
  );
