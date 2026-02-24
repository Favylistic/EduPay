-- Phase 5: Audit Logs table
-- Track every significant financial/HR action for transparency and security

CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action       text NOT NULL,
  entity_type  text NOT NULL,
  entity_id    uuid,
  payload      jsonb,
  ip_address   text,
  created_at   timestamptz DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx   ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx  ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx  ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read audit logs
CREATE POLICY "super_admin_read_audit_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Any authenticated request (API routes using service context) can insert
CREATE POLICY "authenticated_insert_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
