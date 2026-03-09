-- =============================================
-- TASK-05: Performance indexes for scaling
-- =============================================

-- Projects: sort by creation date for client dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client_date
  ON projects(client_id, created_at DESC);

-- Stages: filter by status for supervisor/master views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stages_project_status
  ON stages(project_id, status);

-- Chat messages: for loading chat history efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_project_date
  ON chat_messages(project_id, created_at DESC);

-- Notifications: unread count per user (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Reviews: aggregate rating per master
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_master_rating
  ON reviews(master_id, rating);

-- Objects: lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_user_date
  ON objects(user_id, created_at DESC);
