-- =============================================
-- BLOCKER-07: Extend master_profiles for full profile sync
-- =============================================

ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '1_3';
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'experienced';
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '[]';
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS certificates TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS completed_tasks INTEGER NOT NULL DEFAULT 0;
