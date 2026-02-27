-- ============================================================================
-- Migration: Account Creation Workflow
-- Purpose: Super admin-only account creation with password change requirement
--          and profile completion tracking
-- ============================================================================

-- Add new columns to profiles table for tracking first login and setup completion
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_temporary_password boolean DEFAULT true;

-- Create employee ID sequence for auto-generation
CREATE SEQUENCE IF NOT EXISTS public.employee_id_sequence
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE;

-- Create audit log for account creation
CREATE TABLE IF NOT EXISTS public.account_creation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_email text NOT NULL,
  employee_id text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation_id uuid REFERENCES public.designations(id) ON DELETE SET NULL,
  base_salary numeric,
  temporary_password_generated boolean DEFAULT true,
  temporary_password_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_creation_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_creation_audit
CREATE POLICY "account_creation_audit_read_admin" ON public.account_creation_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'hr_manager')
    )
  );

CREATE POLICY "account_creation_audit_insert_admin" ON public.account_creation_audit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Create table to track first-login setup status
CREATE TABLE IF NOT EXISTS public.user_setup_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  password_change_required boolean DEFAULT true,
  password_changed_at timestamptz,
  profile_setup_required boolean DEFAULT true,
  profile_completed_at timestamptz,
  setup_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_setup_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_setup_status
CREATE POLICY "user_setup_status_read_own" ON public.user_setup_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_setup_status_read_admin" ON public.user_setup_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "user_setup_status_update_own" ON public.user_setup_status
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_setup_status_insert_trigger" ON public.user_setup_status
  FOR INSERT WITH CHECK (true);

-- Function to create user setup status on auth user creation
CREATE OR REPLACE FUNCTION public.handle_user_setup_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_setup_status (user_id, password_change_required, profile_setup_required)
  VALUES (new.id, true, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_setup_status ON auth.users;

CREATE TRIGGER on_auth_user_setup_status
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_setup_status();

-- Function to generate next employee ID
CREATE OR REPLACE FUNCTION public.generate_employee_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT nextval('public.employee_id_sequence') INTO next_num;
  RETURN 'EMP-' || LPAD(next_num::text, 6, '0');
END;
$$;

-- Update updated_at trigger for account_creation_audit
CREATE OR REPLACE FUNCTION public.update_account_creation_audit_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER account_creation_audit_updated_at
  BEFORE UPDATE ON public.account_creation_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_creation_audit_timestamp();

CREATE TRIGGER user_setup_status_updated_at
  BEFORE UPDATE ON public.user_setup_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_account_creation_audit_created_by_admin ON public.account_creation_audit(created_by_admin);
CREATE INDEX IF NOT EXISTS idx_account_creation_audit_employee_email ON public.account_creation_audit(employee_email);
CREATE INDEX IF NOT EXISTS idx_user_setup_status_user_id ON public.user_setup_status(user_id);
