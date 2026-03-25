-- Master schedule tables: weekly time slots + reusable templates
-- Supports 8:00-23:00 hourly grid × Mon-Sun (16 slots × 7 days = 112 per week)

-- Individual schedule slots (per day/hour)
CREATE TABLE IF NOT EXISTS master_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  hour smallint NOT NULL CHECK (hour >= 8 AND hour <= 23),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'working', 'booked')),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(master_id, date, hour)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_master_schedule_master_date
  ON master_schedule(master_id, date);
CREATE INDEX IF NOT EXISTS idx_master_schedule_status
  ON master_schedule(master_id, status);

-- Weekly template (master defines their default working hours once)
CREATE TABLE IF NOT EXISTS master_schedule_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Mon, 6=Sun
  hour smallint NOT NULL CHECK (hour >= 8 AND hour <= 23),
  is_working boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(master_id, day_of_week, hour)
);

CREATE INDEX IF NOT EXISTS idx_master_template_master
  ON master_schedule_templates(master_id);

-- RLS policies
ALTER TABLE master_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule_templates ENABLE ROW LEVEL SECURITY;

-- Masters manage their own schedule
CREATE POLICY "Masters manage own schedule"
  ON master_schedule FOR ALL
  USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Supervisors can read schedule (for assignment)
CREATE POLICY "Supervisors read schedule"
  ON master_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role manages schedule"
  ON master_schedule FOR ALL
  USING (auth.role() = 'service_role');

-- Templates: masters manage their own
CREATE POLICY "Masters manage own templates"
  ON master_schedule_templates FOR ALL
  USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Service role full access to templates
CREATE POLICY "Service role manages templates"
  ON master_schedule_templates FOR ALL
  USING (auth.role() = 'service_role');
