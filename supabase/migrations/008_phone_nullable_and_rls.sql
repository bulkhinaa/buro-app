-- =============================================
-- BLOCKER-08: Allow NULL phone (Yandex ID may not return phone)
-- =============================================

ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN phone SET DEFAULT '';

-- =============================================
-- BLOCKER-09: RLS policies for masters and supervisors
-- =============================================

-- Masters can view stages assigned to them
CREATE POLICY "Masters see assigned stages" ON stages
  FOR SELECT USING (master_id = auth.uid());

-- Masters can update their own stages (mark as done)
CREATE POLICY "Masters update own stages" ON stages
  FOR UPDATE USING (master_id = auth.uid());

-- Supervisors can view stages of their projects
CREATE POLICY "Supervisors see project stages" ON stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND p.supervisor_id = auth.uid()
    )
  );

-- Supervisors can update stages of their projects (approve/reject)
CREATE POLICY "Supervisors update project stages" ON stages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND p.supervisor_id = auth.uid()
    )
  );

-- Supervisors can insert stages for their projects
CREATE POLICY "Supervisors insert project stages" ON stages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.supervisor_id = auth.uid()
    )
  );

-- Clients can view stages of their projects
CREATE POLICY "Clients see own project stages" ON stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND p.client_id = auth.uid()
    )
  );

-- Admins can do everything with stages
CREATE POLICY "Admins manage all stages" ON stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Photo reports: masters and supervisors can insert
CREATE POLICY "Masters insert photo reports" ON photo_reports
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Photo reports: project participants can view
CREATE POLICY "Project participants view photo reports" ON photo_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stages s
      JOIN projects p ON p.id = s.project_id
      WHERE s.id = photo_reports.stage_id
      AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid() OR s.master_id = auth.uid())
    )
  );

-- Supervisors can update projects they are assigned to
CREATE POLICY "Supervisors update own projects" ON projects
  FOR UPDATE USING (supervisor_id = auth.uid());

-- Admins can update all projects
CREATE POLICY "Admins update all projects" ON projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert projects
CREATE POLICY "Admins insert projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients can insert their own projects
CREATE POLICY "Clients insert own projects" ON projects
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Master profiles: masters can update their own
CREATE POLICY "Masters update own profile data" ON master_profiles
  FOR UPDATE USING (id = auth.uid());

-- Master profiles: anyone can view (for portfolio/reviews)
CREATE POLICY "Anyone can view master profiles" ON master_profiles
  FOR SELECT USING (true);

-- Master profiles: masters can insert their own
CREATE POLICY "Masters insert own profile data" ON master_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Reviews: anyone can read
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- Reviews: clients can insert for their projects
CREATE POLICY "Clients insert reviews" ON reviews
  FOR INSERT WITH CHECK (client_id = auth.uid());
