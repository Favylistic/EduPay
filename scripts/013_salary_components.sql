-- 013_salary_components.sql
-- Salary components (earnings & deductions) with employee-level overrides

CREATE TABLE IF NOT EXISTS salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('earning', 'deduction')),
  calculation_type text NOT NULL CHECK (calculation_type IN ('fixed', 'percentage_of_base')),
  value numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'academic', 'non_academic')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  component_id uuid REFERENCES salary_components(id) ON DELETE CASCADE,
  override_value numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, component_id)
);

-- Seed default salary components
INSERT INTO salary_components (name, type, calculation_type, value, applies_to) VALUES
  ('House Rent Allowance (HRA)', 'earning', 'percentage_of_base', 40, 'all'),
  ('Transport Allowance',        'earning', 'fixed',              150, 'all'),
  ('Income Tax',                 'deduction', 'percentage_of_base', 10, 'all'),
  ('Health Insurance',           'deduction', 'fixed',              50, 'all')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salary_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY salary_components_select_all ON salary_components
  FOR SELECT TO authenticated USING (true);

CREATE POLICY salary_components_manage_admin ON salary_components
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

CREATE POLICY emp_salary_components_select_admin ON employee_salary_components
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

CREATE POLICY emp_salary_components_manage_admin ON employee_salary_components
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_salary_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salary_components_updated_at
  BEFORE UPDATE ON salary_components
  FOR EACH ROW EXECUTE FUNCTION update_salary_components_updated_at();
