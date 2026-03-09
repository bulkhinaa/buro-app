-- =============================================
-- BLOCKER-06: Leads table for landing form submissions
-- =============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  address TEXT,
  repair_type TEXT,
  area NUMERIC(6,1),
  budget TEXT,
  source TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, converted, rejected
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only admins can see leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert leads (for Edge Function)
CREATE POLICY "Service role inserts leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_leads_status ON leads(status, created_at DESC);
