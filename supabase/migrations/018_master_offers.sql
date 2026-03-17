-- Master offers table
-- Tracks when a client/supervisor offers a stage to a master
-- Master can accept or decline

CREATE TABLE IF NOT EXISTS master_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  master_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  match_score integer,
  message text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stage_id, master_id)
);

CREATE INDEX IF NOT EXISTS idx_master_offers_master
  ON master_offers(master_id, status);
CREATE INDEX IF NOT EXISTS idx_master_offers_stage
  ON master_offers(stage_id, status);

-- RLS policies
ALTER TABLE master_offers ENABLE ROW LEVEL SECURITY;

-- Masters can see and respond to their own offers
CREATE POLICY "Masters manage own offers"
  ON master_offers FOR ALL
  USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Offer creators can see their offers
CREATE POLICY "Creators see own offers"
  ON master_offers FOR SELECT
  USING (auth.uid() = offered_by);

-- Supervisors/admins can create and view offers
CREATE POLICY "Supervisors manage offers"
  ON master_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- Clients can create offers for their own projects
CREATE POLICY "Clients create offers for own projects"
  ON master_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND client_id = auth.uid()
    )
  );

-- Clients can view offers for their projects
CREATE POLICY "Clients view own project offers"
  ON master_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND client_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role manages offers"
  ON master_offers FOR ALL
  USING (auth.role() = 'service_role');
