-- =============================================
-- Supervisor-specific profile data
-- Mirrors master_profiles pattern for supervisor role
-- =============================================

CREATE TABLE IF NOT EXISTS supervisor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  experience TEXT NOT NULL DEFAULT '',
  specializations TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE TRIGGER supervisor_profiles_updated_at
  BEFORE UPDATE ON supervisor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supervisor_profiles_regions
  ON supervisor_profiles USING GIN (regions);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE supervisor_profiles ENABLE ROW LEVEL SECURITY;

-- Supervisors can read/write their own row
CREATE POLICY "Supervisors read own profile"
  ON supervisor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Supervisors insert own profile"
  ON supervisor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Supervisors update own profile"
  ON supervisor_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all supervisor profiles
CREATE POLICY "Admins read all supervisor profiles"
  ON supervisor_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can read supervisor profiles (for project assignment context)
CREATE POLICY "Authenticated users read supervisor profiles"
  ON supervisor_profiles FOR SELECT
  USING (auth.role() = 'authenticated');
