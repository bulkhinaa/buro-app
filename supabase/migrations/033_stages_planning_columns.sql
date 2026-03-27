-- =============================================
-- Add planning columns to stages table
-- Used by SupervisorStagePlanScreen to persist
-- the stage plan with dates and duration.
-- All columns nullable so existing rows are unaffected.
-- =============================================

ALTER TABLE stages ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS planned_end_date DATE;

-- RLS note: Supervisors already have INSERT/UPDATE/SELECT on stages
-- via migration 008 ("Supervisors insert/update/see project stages").
-- No new RLS policies needed — the existing policies cover these columns.
