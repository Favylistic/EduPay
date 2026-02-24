-- 014_payroll_runs.sql
-- Payroll runs (one per month) and per-employee payslips

CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
  total_employees integer,
  total_gross numeric,
  total_deductions numeric,
  total_net numeric,
  notes text,
  run_by uuid REFERENCES profiles(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id),
  base_salary numeric NOT NULL,
  gross_earnings numeric NOT NULL,
  total_deductions numeric NOT NULL,
  net_pay numeric NOT NULL,
  working_days integer NOT NULL DEFAULT 22,
  present_days integer NOT NULL DEFAULT 0,
  absent_days integer NOT NULL DEFAULT 0,
  late_days integer NOT NULL DEFAULT 0,
  leave_days integer NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'paid')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(payroll_run_id, employee_id)
);

-- RLS
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY payroll_runs_select_admin ON payroll_runs
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

CREATE POLICY payroll_runs_manage_admin ON payroll_runs
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

CREATE POLICY payslips_select_admin ON payslips
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

-- Employees can see their own payslip
CREATE POLICY payslips_select_self ON payslips
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY payslips_manage_admin ON payslips
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('super_admin', 'hr_manager'));

-- updated_at trigger for payroll_runs
CREATE OR REPLACE FUNCTION update_payroll_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payroll_runs_updated_at
  BEFORE UPDATE ON payroll_runs
  FOR EACH ROW EXECUTE FUNCTION update_payroll_runs_updated_at();
