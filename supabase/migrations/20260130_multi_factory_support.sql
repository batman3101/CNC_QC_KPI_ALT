-- Multi-Factory Support Migration
-- Adds factory_id to users, machines, inspections, defects

-- 1. Create factories table
CREATE TABLE IF NOT EXISTS factories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed factory data
INSERT INTO factories (id, name, name_vi, code) VALUES
  ('ALT', 'ALT 공장', 'Nhà máy ALT', 'ALT'),
  ('ALV', 'ALV 공장', 'Nhà máy ALV', 'ALV')
ON CONFLICT (id) DO NOTHING;

-- 3. Add factory_id columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS factory_id TEXT REFERENCES factories(id);
ALTER TABLE machines ADD COLUMN IF NOT EXISTS factory_id TEXT REFERENCES factories(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS factory_id TEXT REFERENCES factories(id);
ALTER TABLE defects ADD COLUMN IF NOT EXISTS factory_id TEXT REFERENCES factories(id);

-- 4. Set existing data to ALT factory
UPDATE users SET factory_id = 'ALT' WHERE factory_id IS NULL;
UPDATE machines SET factory_id = 'ALT' WHERE factory_id IS NULL;
UPDATE inspections SET factory_id = 'ALT' WHERE factory_id IS NULL;
UPDATE defects SET factory_id = 'ALT' WHERE factory_id IS NULL;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_machines_factory ON machines(factory_id);
CREATE INDEX IF NOT EXISTS idx_inspections_factory ON inspections(factory_id);
CREATE INDEX IF NOT EXISTS idx_defects_factory ON defects(factory_id);
CREATE INDEX IF NOT EXISTS idx_users_factory ON users(factory_id);

-- 6. RLS Policies

-- Helper function: get current user's factory_id
CREATE OR REPLACE FUNCTION auth.user_factory_id()
RETURNS TEXT AS $$
  SELECT factory_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

-- Factories: all authenticated users can read
CREATE POLICY factories_read_policy ON factories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Machines: users see their factory's machines, admins see all
CREATE POLICY machines_factory_policy ON machines
  FOR ALL USING (
    auth.is_admin() OR factory_id = auth.user_factory_id()
  );

-- Inspections: users see their factory's inspections, admins see all
CREATE POLICY inspections_factory_policy ON inspections
  FOR ALL USING (
    auth.is_admin() OR factory_id = auth.user_factory_id()
  );

-- Defects: users see their factory's defects, admins see all
CREATE POLICY defects_factory_policy ON defects
  FOR ALL USING (
    auth.is_admin() OR factory_id = auth.user_factory_id()
  );

-- Users: users can see users in their factory, admins see all
CREATE POLICY users_factory_policy ON users
  FOR SELECT USING (
    auth.is_admin() OR factory_id = auth.user_factory_id()
  );

-- 7. Machine data expansion for ALV factory (350 machines)
-- ALT factory machines (CNC-001 to CNC-800) should be managed via admin UI or separate script
-- ALV factory machines (CNC-001 to CNC-350)
DO $$
BEGIN
  FOR i IN 1..350 LOOP
    INSERT INTO machines (id, name, model, status, factory_id)
    VALUES (
      gen_random_uuid()::text,
      'CNC-' || LPAD(i::text, 3, '0'),
      'CNC',
      'active',
      'ALV'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
