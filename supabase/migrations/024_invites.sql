-- =============================================
-- Invites table for supervisor referral links
-- Sprint VI, Task 2.1
-- =============================================

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_phone TEXT,
  invited_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '30 days'
);

-- Fast lookup by invite code
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites (code);

-- Supervisor's invites list
CREATE INDEX IF NOT EXISTS idx_invites_supervisor ON invites (supervisor_id);

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Supervisors can view their own invites
CREATE POLICY invites_select_own ON invites
  FOR SELECT USING (
    supervisor_id = auth.uid()
    OR accepted_by = auth.uid()
  );

-- Supervisors can create invites
CREATE POLICY invites_insert_own ON invites
  FOR INSERT WITH CHECK (
    supervisor_id = auth.uid()
  );

-- Supervisors can update their own invites (e.g. cancel)
CREATE POLICY invites_update_own ON invites
  FOR UPDATE USING (
    supervisor_id = auth.uid()
  );

-- Anyone can read an invite by code (for accepting)
CREATE POLICY invites_select_by_code ON invites
  FOR SELECT USING (true);

-- Authenticated users can accept an invite (update accepted_by + status)
CREATE POLICY invites_accept ON invites
  FOR UPDATE USING (
    status = 'pending'
    AND expires_at > now()
  ) WITH CHECK (
    status = 'accepted'
    AND accepted_by = auth.uid()
  );
