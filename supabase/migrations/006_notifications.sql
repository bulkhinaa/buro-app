-- =============================================
-- Notifications table + triggers
-- =============================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'new_task',
  'task_approved',
  'task_rejected',
  'new_message',
  'stage_started',
  'stage_completed'
);

-- Notifications table
CREATE TABLE notifications (
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

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_project ON notifications(project_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Service role can insert notifications (for triggers)
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Trigger: stage status change → notify client
-- =============================================

CREATE OR REPLACE FUNCTION notify_stage_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_stage_title TEXT;
  v_notif_type notification_type;
  v_notif_title TEXT;
  v_notif_body TEXT;
  v_target_user UUID;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get project info
  SELECT * INTO v_project FROM projects WHERE id = NEW.project_id;
  v_stage_title := NEW.title;

  -- Determine notification type and target user based on new status
  CASE NEW.status
    WHEN 'in_progress' THEN
      -- Notify client that stage started
      v_notif_type := 'stage_started';
      v_notif_title := 'Этап начат';
      v_notif_body := format('Начат этап «%s» в проекте «%s»', v_stage_title, v_project.title);
      v_target_user := v_project.client_id;

    WHEN 'done_by_master' THEN
      -- Notify supervisor that master completed work
      v_notif_type := 'stage_completed';
      v_notif_title := 'Этап выполнен';
      v_notif_body := format('Мастер завершил «%s» — требуется проверка', v_stage_title);
      v_target_user := v_project.supervisor_id;

    WHEN 'approved' THEN
      -- Notify client and master that stage approved
      v_notif_type := 'task_approved';
      v_notif_title := 'Этап принят';
      v_notif_body := format('Супервайзер принял этап «%s»', v_stage_title);
      v_target_user := v_project.client_id;

      -- Also notify master if assigned
      IF NEW.master_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, project_id, stage_id)
        VALUES (NEW.master_id, 'task_approved', v_notif_title, v_notif_body, NEW.project_id, NEW.id);
      END IF;

    WHEN 'rejected' THEN
      -- Notify master that work rejected
      v_notif_type := 'task_rejected';
      v_notif_title := 'Требуется доработка';
      v_notif_body := format('Этап «%s» отклонён — проверьте комментарий', v_stage_title);
      v_target_user := NEW.master_id;

    ELSE
      RETURN NEW;
  END CASE;

  -- Insert notification (skip if no target user)
  IF v_target_user IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, project_id, stage_id)
    VALUES (v_target_user, v_notif_type, v_notif_title, v_notif_body, NEW.project_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER stage_status_notification
  AFTER UPDATE ON stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_status_change();

-- =============================================
-- Trigger: master assigned to stage → notify
-- =============================================

CREATE OR REPLACE FUNCTION notify_master_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
BEGIN
  -- Only fire when master_id changes from NULL to a value
  IF OLD.master_id IS NOT NULL OR NEW.master_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = NEW.project_id;

  INSERT INTO notifications (user_id, type, title, body, project_id, stage_id)
  VALUES (
    NEW.master_id,
    'new_task',
    'Новая задача',
    format('Вам назначена задача «%s» в проекте «%s»', NEW.title, v_project.title),
    NEW.project_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER master_assigned_notification
  AFTER UPDATE ON stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_assigned();

-- =============================================
-- Trigger: new chat message → notify other participants
-- =============================================

CREATE OR REPLACE FUNCTION notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_sender_name TEXT;
  v_participant UUID;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = NEW.project_id;
  SELECT name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;

  -- Notify client (if sender is not client)
  IF v_project.client_id IS NOT NULL AND v_project.client_id != NEW.sender_id THEN
    INSERT INTO notifications (user_id, type, title, body, project_id)
    VALUES (
      v_project.client_id,
      'new_message',
      'Новое сообщение',
      format('%s написал в чате проекта «%s»', COALESCE(v_sender_name, 'Участник'), v_project.title),
      NEW.project_id
    );
  END IF;

  -- Notify supervisor (if sender is not supervisor)
  IF v_project.supervisor_id IS NOT NULL AND v_project.supervisor_id != NEW.sender_id THEN
    INSERT INTO notifications (user_id, type, title, body, project_id)
    VALUES (
      v_project.supervisor_id,
      'new_message',
      'Новое сообщение',
      format('%s написал в чате проекта «%s»', COALESCE(v_sender_name, 'Участник'), v_project.title),
      NEW.project_id
    );
  END IF;

  -- Notify assigned masters on this project (if sender is not the master)
  FOR v_participant IN
    SELECT DISTINCT master_id FROM stages
    WHERE project_id = NEW.project_id
    AND master_id IS NOT NULL
    AND master_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body, project_id)
    VALUES (
      v_participant,
      'new_message',
      'Новое сообщение',
      format('%s написал в чате проекта «%s»', COALESCE(v_sender_name, 'Участник'), v_project.title),
      NEW.project_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER chat_message_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();
