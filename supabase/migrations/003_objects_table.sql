-- =============================================
-- Objects (client properties / apartments)
-- =============================================

CREATE TABLE objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  total_area NUMERIC(6,1) NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  rooms INTEGER NOT NULL DEFAULT 1,
  bathrooms TEXT NOT NULL DEFAULT 'combined_1',
  kitchen_type TEXT NOT NULL DEFAULT 'separate',
  renovation_goal TEXT NOT NULL DEFAULT 'living',
  layout_id TEXT,
  custom_layout_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objects_user ON objects(user_id);

-- RLS
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own objects" ON objects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own objects" ON objects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own objects" ON objects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own objects" ON objects
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all objects" ON objects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
