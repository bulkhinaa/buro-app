-- =============================================
-- TASK-04: Data Security & FZ-152 Compliance
-- =============================================

-- ===== 1. Consent tracking on profiles =====

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_version TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ===== 2. Public VIEW for master portfolio (limited fields) =====
-- Avoids exposing phone/email of masters to other users

CREATE OR REPLACE VIEW master_public_profiles AS
  SELECT
    p.id,
    p.name,
    p.avatar_url,
    mp.specializations,
    mp.rating,
    mp.reviews_count,
    mp.is_verified,
    mp.experience,
    mp.about,
    mp.skill_level,
    mp.completed_tasks
  FROM profiles p
  JOIN master_profiles mp ON mp.id = p.id
  WHERE p.role IN ('master', 'client') AND p.is_active = true AND p.deleted_at IS NULL;

-- ===== 3. Anonymize user function (FZ-152 art. 21 — right to deletion) =====

CREATE OR REPLACE FUNCTION anonymize_user(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Anonymize profile personal data
  UPDATE profiles SET
    name        = '[Удалён]',
    phone       = NULL,
    avatar_url  = NULL,
    is_active   = false,
    deleted_at  = NOW()
  WHERE id = p_user_id;

  -- Anonymize object addresses
  UPDATE objects SET
    address = '[Адрес удалён]'
  WHERE user_id = p_user_id;

  -- Remove master profile sensitive data
  UPDATE master_profiles SET
    about        = '',
    certificates = '{}',
    pricing      = '[]'
  WHERE id = p_user_id;

  -- Anonymize chat messages (keep structure but remove content)
  UPDATE chat_messages SET
    text      = '[Сообщение удалено]',
    image_url = NULL
  WHERE sender_id = p_user_id;

  -- Note: We keep reviews (anonymized by profile name change)
  -- Note: We keep project records for business continuity
  -- Note: Auth user should be deactivated via Supabase Admin API separately
END;
$$;

-- ===== 4. RLS for objects — supervisors & masters see project-related objects =====

CREATE POLICY "Supervisors see project objects" ON objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = objects.user_id
      AND p.supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Masters see project objects" ON objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN stages s ON s.project_id = p.id
      WHERE p.client_id = objects.user_id
      AND s.master_id = auth.uid()
    )
  );

-- ===== 5. RLS for payments table =====

CREATE POLICY "Clients see own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = payments.project_id
      AND p.client_id = auth.uid()
    )
  );

CREATE POLICY "Supervisors see project payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = payments.project_id
      AND p.supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== 6. Supervisors can see profiles of project participants =====

CREATE POLICY "Supervisors see project participant profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.supervisor_id = auth.uid()
      AND (p.client_id = profiles.id OR p.supervisor_id = profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN stages s ON s.project_id = p.id
      WHERE p.supervisor_id = auth.uid()
      AND s.master_id = profiles.id
    )
  );

-- Masters can see supervisor and client profiles on their projects
CREATE POLICY "Masters see project participant profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stages s
      JOIN projects p ON p.id = s.project_id
      WHERE s.master_id = auth.uid()
      AND (p.client_id = profiles.id OR p.supervisor_id = profiles.id)
    )
  );

-- ===== 7. Data cleanup function (scheduled via pg_cron) =====

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Delete old analytics events (2 years)
  DELETE FROM user_events WHERE created_at < NOW() - INTERVAL '2 years';

  -- Delete resolved error logs (1 year)
  DELETE FROM error_logs WHERE resolved = true AND created_at < NOW() - INTERVAL '1 year';

  -- Delete old notifications (6 months)
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$;

-- Note: Schedule with pg_cron when available:
-- SELECT cron.schedule('cleanup-old-data', '0 3 1 * *', 'SELECT cleanup_old_data()');

-- ===== 8. Additional indexes for security queries =====

CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
