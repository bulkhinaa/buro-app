-- =============================================
-- Email notification triggers via pg_net + send-email Edge Function
-- Sprint VI, Task 1.3
-- =============================================

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper function: call send-email Edge Function
CREATE OR REPLACE FUNCTION notify_email(
  p_user_id UUID,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Get Supabase URL from current database settings
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  -- Skip if settings not configured
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RETURN;
  END IF;

  -- Fire-and-forget HTTP request to send-email Edge Function
  PERFORM extensions.http_post(
    url := v_supabase_url || '/functions/v1/send-email',
    body := jsonb_build_object(
      'userId', p_user_id,
      'type', p_type,
      'data', p_data
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    )::jsonb
  );

EXCEPTION WHEN OTHERS THEN
  -- Non-blocking: log error but don't fail the transaction
  RAISE WARNING 'notify_email failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: stage status changed → email project owner
CREATE OR REPLACE FUNCTION trigger_email_stage_status() RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_stage_name TEXT;
BEGIN
  -- Only fire on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_stage_name := COALESCE(NEW.name, 'этап');

  -- Get project info to find the client
  SELECT p.id, p.name, p.client_id, p.address
  INTO v_project
  FROM projects p
  WHERE p.id = NEW.project_id;

  IF v_project.client_id IS NOT NULL THEN
    PERFORM notify_email(
      v_project.client_id,
      'stage_status_changed',
      jsonb_build_object(
        'stage_name', v_stage_name,
        'project_name', COALESCE(v_project.name, ''),
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_email_stage_status ON stages;
CREATE TRIGGER trg_email_stage_status
  AFTER UPDATE OF status ON stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_stage_status();

-- Trigger: master assigned to stage → email master
CREATE OR REPLACE FUNCTION trigger_email_master_assigned() RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_stage_name TEXT;
BEGIN
  -- Only fire when master_id is set (was null, now has value)
  IF OLD.master_id IS NOT NULL OR NEW.master_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_stage_name := COALESCE(NEW.name, 'этап');

  SELECT p.name, p.address
  INTO v_project
  FROM projects p
  WHERE p.id = NEW.project_id;

  PERFORM notify_email(
    NEW.master_id,
    'master_assigned',
    jsonb_build_object(
      'stage_name', v_stage_name,
      'project_name', COALESCE(v_project.name, ''),
      'address', COALESCE(v_project.address, '')
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_email_master_assigned ON stages;
CREATE TRIGGER trg_email_master_assigned
  AFTER UPDATE OF master_id ON stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_master_assigned();
