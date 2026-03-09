-- =============================================
-- TASK-03: Error logging for QA
-- =============================================

CREATE TABLE error_logs (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type    TEXT NOT NULL,
    -- 'api_error'      — Supabase query returned error
    -- 'rls_violation'  — no permissions for operation
    -- 'ui_error'       — button/screen doesn't work as expected
    -- 'network_error'  — no connection
    -- 'validation'     — form validation error
  severity      TEXT NOT NULL,
    -- 'critical' — user cannot continue
    -- 'high'     — important feature broken
    -- 'medium'   — something broken but has workaround
    -- 'low'      — cosmetic, inconvenience
  screen        TEXT,
  action        TEXT,
  error_code    TEXT,
  error_message TEXT,
  metadata      JSONB DEFAULT '{}',
  resolved      BOOLEAN DEFAULT false,
  resolved_by   UUID REFERENCES profiles(id),
  resolved_at   TIMESTAMPTZ,
  dev_comment   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for QA dashboard
CREATE INDEX idx_error_logs_unresolved
  ON error_logs(severity, created_at DESC)
  WHERE resolved = false;

CREATE INDEX idx_error_logs_screen
  ON error_logs(screen, error_type);

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_insert_errors" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_supervisor_read_errors" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "admin_update_errors" ON error_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- QA Dashboard VIEW — sorted by severity and occurrence count
CREATE OR REPLACE VIEW qa_dashboard AS
SELECT
  error_type,
  severity,
  screen,
  action,
  error_code,
  error_message,
  COUNT(*)                           AS occurrences,
  COUNT(DISTINCT user_id)            AS affected_users,
  MIN(created_at)                    AS first_seen,
  MAX(created_at)                    AS last_seen
FROM error_logs
WHERE resolved = false
GROUP BY error_type, severity, screen, action, error_code, error_message
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high'     THEN 2
    WHEN 'medium'   THEN 3
    ELSE 4
  END,
  occurrences DESC;
