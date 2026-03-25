-- Master vacations table
-- Stores date ranges when master is unavailable

CREATE TABLE IF NOT EXISTS master_vacations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_from date NOT NULL,
  date_to date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (date_to >= date_from)
);

CREATE INDEX IF NOT EXISTS idx_master_vacations_master
  ON master_vacations(master_id);
CREATE INDEX IF NOT EXISTS idx_master_vacations_dates
  ON master_vacations(master_id, date_from, date_to);

-- RLS policies
ALTER TABLE master_vacations ENABLE ROW LEVEL SECURITY;

-- Masters manage their own vacations
CREATE POLICY "Masters manage own vacations"
  ON master_vacations FOR ALL
  USING (auth.uid() = master_id)
  WITH CHECK (auth.uid() = master_id);

-- Supervisors/admins can read vacations
CREATE POLICY "Supervisors read vacations"
  ON master_vacations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role manages vacations"
  ON master_vacations FOR ALL
  USING (auth.role() = 'service_role');
