-- CNC Quality Inspection KPI App - Database Schema
-- Supabase SQL Editor에서 실행하세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'inspector')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Machines table
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Models table
CREATE TABLE IF NOT EXISTS public.product_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inspection Items table
CREATE TABLE IF NOT EXISTS public.inspection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_id UUID REFERENCES public.product_models(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  standard_value DECIMAL NOT NULL,
  tolerance_min DECIMAL NOT NULL,
  tolerance_max DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('numeric', 'ok_ng')) DEFAULT 'numeric',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inspections table
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL NOT NULL,
  model_id UUID REFERENCES public.product_models(id) ON DELETE SET NULL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inspection Results table
CREATE TABLE IF NOT EXISTS public.inspection_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE NOT NULL,
  measured_value DECIMAL NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Defects table
CREATE TABLE IF NOT EXISTS public.defects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  defect_type TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX idx_inspections_machine_id ON public.inspections(machine_id);
CREATE INDEX idx_inspections_model_id ON public.inspections(model_id);
CREATE INDEX idx_inspections_created_at ON public.inspections(created_at);
CREATE INDEX idx_inspection_results_inspection_id ON public.inspection_results(inspection_id);
CREATE INDEX idx_defects_inspection_id ON public.defects(inspection_id);
CREATE INDEX idx_defects_status ON public.defects(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Machines table policies
CREATE POLICY "All authenticated users can view machines"
  ON public.machines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert machines"
  ON public.machines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update machines"
  ON public.machines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Product Models table policies
CREATE POLICY "All authenticated users can view product models"
  ON public.product_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage product models"
  ON public.product_models FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Inspection Items table policies
CREATE POLICY "All authenticated users can view inspection items"
  ON public.inspection_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage inspection items"
  ON public.inspection_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Inspections table policies
CREATE POLICY "Users can view their own inspections"
  ON public.inspections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers and admins can view all inspections"
  ON public.inspections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All authenticated users can insert inspections"
  ON public.inspections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Inspection Results table policies
CREATE POLICY "Users can view results of their inspections"
  ON public.inspection_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can view all inspection results"
  ON public.inspection_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All authenticated users can insert inspection results"
  ON public.inspection_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Defects table policies
CREATE POLICY "Users can view defects of their inspections"
  ON public.defects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can view all defects"
  ON public.defects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "All authenticated users can insert defects"
  ON public.defects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers and admins can update defects"
  ON public.defects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for testing (optional)
-- Uncomment to insert sample data

/*
-- Insert sample machines
INSERT INTO public.machines (name, model, status) VALUES
  ('CNC-001', 'Haas VF-2', 'active'),
  ('CNC-002', 'DMG Mori NLX 2500', 'active'),
  ('CNC-003', 'Mazak Integrex i-200', 'maintenance');

-- Insert sample product models
INSERT INTO public.product_models (name, code) VALUES
  ('Shaft Type A', 'SHA-001'),
  ('Bearing Housing B', 'BHB-002'),
  ('Flange C', 'FLC-003');

-- Insert sample inspection items
-- (Requires product_models to be inserted first)
*/
