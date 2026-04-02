-- =============================================
-- FIX: Create missing tables (notifications, user_events)
-- FIX: Correct QA master specialization IDs (BUG-E2E-11)
-- Uses IF NOT EXISTS / DO $$ to be idempotent
-- =============================================

-- ── 1. notification_type enum ──
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_task', 'task_approved', 'task_rejected',
    'new_message', 'stage_started', 'stage_completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. notifications table ──
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ── 3. user_events table ──
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  screen TEXT,
  action TEXT,
  metadata JSONB DEFAULT '{}',
  platform TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_time ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_screen ON user_events(screen, action);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type, created_at DESC);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_events" ON user_events;
DROP POLICY IF EXISTS "admin_select_events" ON user_events;

CREATE POLICY "authenticated_insert_events" ON user_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_select_events" ON user_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Fix QA master specializations (BUG-E2E-11) ──
-- Seed data used 'plumbing','electrical','tiling' but correct IDs are 'plumber','electrician','tiler'
UPDATE master_profiles
SET specializations = ARRAY['plumber', 'electrician', 'tiler']
WHERE id = '4d8206cb-48bc-4577-83a1-32b2eaab2af9'
  AND specializations = ARRAY['plumbing', 'electrical', 'tiling'];
