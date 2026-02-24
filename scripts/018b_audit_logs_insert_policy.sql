-- 018b_audit_logs_insert_policy.sql
-- Allow any authenticated user to insert audit log entries.
-- The SELECT policy is restricted to super_admin in 018_fix_rls_policies.sql.

DROP POLICY IF EXISTS audit_logs_insert_auth ON audit_logs;

CREATE POLICY audit_logs_insert_auth ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
