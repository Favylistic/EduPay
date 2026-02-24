-- Fix: rename `payload` to `meta` to match application code,
-- and add actor_profile_id column that references profiles directly
-- so we can join actor names without a Supabase auth.users join.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS meta jsonb,
  ADD COLUMN IF NOT EXISTS actor_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Back-fill meta from payload for any existing rows
UPDATE audit_logs SET meta = payload WHERE meta IS NULL AND payload IS NOT NULL;

-- Index the new profile ref
CREATE INDEX IF NOT EXISTS audit_logs_actor_profile_idx ON audit_logs(actor_profile_id);
