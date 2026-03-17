-- =============================================
-- Add 4 new notification types for master offers & schedule
-- Sprint V, Task 19
-- =============================================

-- Add new values to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'master_offer';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'master_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'master_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'schedule_reminder';
