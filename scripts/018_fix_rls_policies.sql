-- 018_fix_rls_policies.sql
-- Fix RLS policies that incorrectly read role from JWT claims.
-- The app stores roles in profiles.role, not in the JWT metadata.
-- All admin policies are rewritten to check profiles.role via a subquery.

-- ─── Helper: a stable function that returns the current user's role ────────
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── payroll_runs ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS payroll_runs_select_admin ON payroll_runs;
DROP POLICY IF EXISTS payroll_runs_manage_admin ON payroll_runs;

CREATE POLICY payroll_runs_select_admin ON payroll_runs
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY payroll_runs_manage_admin ON payroll_runs
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── payslips ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS payslips_select_admin ON payslips;
DROP POLICY IF EXISTS payslips_manage_admin ON payslips;

CREATE POLICY payslips_select_admin ON payslips
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY payslips_manage_admin ON payslips
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── leave_requests ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS leave_manage_admin ON leave_requests;
DROP POLICY IF EXISTS leave_select_admin ON leave_requests;

CREATE POLICY leave_select_admin ON leave_requests
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY leave_manage_admin ON leave_requests
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── employees ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS employees_select_admin ON employees;
DROP POLICY IF EXISTS employees_insert_admin ON employees;
DROP POLICY IF EXISTS employees_update_admin ON employees;
DROP POLICY IF EXISTS employees_delete_admin ON employees;

CREATE POLICY employees_select_admin ON employees
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY employees_insert_admin ON employees
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY employees_update_admin ON employees
  FOR UPDATE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY employees_delete_admin ON employees
  FOR DELETE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── departments ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS departments_insert_admin ON departments;
DROP POLICY IF EXISTS departments_update_admin ON departments;
DROP POLICY IF EXISTS departments_delete_admin ON departments;

CREATE POLICY departments_insert_admin ON departments
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY departments_update_admin ON departments
  FOR UPDATE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY departments_delete_admin ON departments
  FOR DELETE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── designations ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS designations_insert_admin ON designations;
DROP POLICY IF EXISTS designations_update_admin ON designations;
DROP POLICY IF EXISTS designations_delete_admin ON designations;

CREATE POLICY designations_insert_admin ON designations
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY designations_update_admin ON designations
  FOR UPDATE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY designations_delete_admin ON designations
  FOR DELETE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── salary_components ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS salary_components_manage_admin ON salary_components;

CREATE POLICY salary_components_manage_admin ON salary_components
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── employee_salary_components ────────────────────────────────────────────
DROP POLICY IF EXISTS emp_salary_components_manage_admin ON employee_salary_components;
DROP POLICY IF EXISTS emp_salary_components_select_admin ON employee_salary_components;

CREATE POLICY emp_salary_components_select_admin ON employee_salary_components
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY emp_salary_components_manage_admin ON employee_salary_components
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── attendance_records ────────────────────────────────────────────────────
DROP POLICY IF EXISTS attendance_manage_admin ON attendance_records;
DROP POLICY IF EXISTS attendance_select_admin ON attendance_records;

CREATE POLICY attendance_select_admin ON attendance_records
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'));

CREATE POLICY attendance_manage_admin ON attendance_records
  FOR ALL TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager'));

-- ─── profiles (admin can read/update all) ──────────────────────────────────
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;

CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager') OR id = auth.uid());

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE TO authenticated
  USING (auth_user_role() IN ('super_admin', 'hr_manager') OR id = auth.uid())
  WITH CHECK (auth_user_role() IN ('super_admin', 'hr_manager') OR id = auth.uid());

-- ─── audit_logs ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS super_admin_read_audit_logs ON audit_logs;

CREATE POLICY super_admin_read_audit_logs ON audit_logs
  FOR SELECT TO authenticated
  USING (auth_user_role() = 'super_admin');
