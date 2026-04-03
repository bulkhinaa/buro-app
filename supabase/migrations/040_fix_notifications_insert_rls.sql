-- =============================================
-- SEC-9: Fix notifications INSERT RLS policy
--
-- Problem: "Service role can insert notifications" used WITH CHECK (true),
-- allowing ANY authenticated user to insert notifications for other users.
--
-- All 3 trigger functions that INSERT into notifications are SECURITY DEFINER:
--   - notify_stage_status_change() (migration 006)
--   - notify_master_assigned() (migration 006)
--   - notify_new_chat_message() (migration 006)
-- SECURITY DEFINER functions bypass RLS, so restricting INSERT to
-- service_role will NOT break the trigger-based notification system.
--
-- Fix: Replace WITH CHECK (true) with a policy that only allows
-- service_role to insert. Regular users cannot insert notifications directly.
-- =============================================

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Only service_role can insert notifications directly.
-- SECURITY DEFINER trigger functions bypass RLS and are unaffected.
-- auth.role() returns 'service_role' for service key, 'authenticated' for user JWT.
CREATE POLICY "Only service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
