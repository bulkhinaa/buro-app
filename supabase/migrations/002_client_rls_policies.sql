-- Migration: Add missing RLS policies for client flow

-- Profiles: allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: allow clients to create projects
CREATE POLICY "Clients can create projects" ON projects
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Projects: allow clients to update own projects
CREATE POLICY "Clients can update own projects" ON projects
  FOR UPDATE USING (client_id = auth.uid());

-- Stage templates: readable by all authenticated users
CREATE POLICY "Authenticated users can read templates" ON stage_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Stages: project owner can insert stages (for auto-generation)
CREATE POLICY "Project owners can insert stages" ON stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND client_id = auth.uid())
  );

-- Stages: project participants can read stages
CREATE POLICY "Project participants can read stages" ON stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stages.project_id
      AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid())
    )
    OR master_id = auth.uid()
  );
