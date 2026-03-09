-- =============================================
-- TASK-02: User events / analytics
-- =============================================

CREATE TABLE user_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id  TEXT NOT NULL,
  event_type  TEXT NOT NULL,   -- 'screen_view' | 'button_tap' | 'form_submit' | 'swipe' | 'error'
  screen      TEXT,
  action      TEXT,
  metadata    JSONB DEFAULT '{}',
  platform    TEXT,            -- 'ios' | 'android' | 'web'
  app_version TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_user_events_user_time ON user_events(user_id, created_at DESC);
CREATE INDEX idx_user_events_screen ON user_events(screen, action);
CREATE INDEX idx_user_events_session ON user_events(session_id);
CREATE INDEX idx_user_events_type ON user_events(event_type, created_at DESC);

-- RLS: all authenticated users can insert, only admins can read
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_insert_events" ON user_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_select_events" ON user_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
