-- ============================================================
-- leave_types: configurable leave categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  color       text NOT NULL DEFAULT '#6366f1',
  max_days    integer,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_types_select_all" ON public.leave_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "leave_types_manage_admin" ON public.leave_types FOR ALL
  USING (
    coalesce(
      ((auth.jwt()->'user_metadata')->>'role'),
      ((auth.jwt()->'app_metadata')->>'role')
    ) IN ('super_admin','hr_manager')
  );

-- Seed default leave types
INSERT INTO public.leave_types (name, color, max_days) VALUES
  ('Sick',       '#ef4444', 14),
  ('Casual',     '#f97316', 10),
  ('Vacation',   '#3b82f6', 21),
  ('Maternity',  '#ec4899', 90),
  ('Emergency',  '#8b5cf6',  3)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- leave_requests: one request per leave period
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id   uuid NOT NULL REFERENCES public.leave_types(id),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  total_days      integer NOT NULL,
  reason          text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by     uuid REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  review_notes    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Admins can read all
CREATE POLICY "leave_select_admin" ON public.leave_requests FOR SELECT
  USING (
    coalesce(
      ((auth.jwt()->'user_metadata')->>'role'),
      ((auth.jwt()->'app_metadata')->>'role')
    ) IN ('super_admin','hr_manager')
  );

-- Employees can read their own
CREATE POLICY "leave_select_self" ON public.leave_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  );

-- Employees can submit requests for themselves
CREATE POLICY "leave_insert_self" ON public.leave_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  );

-- Employees can cancel their own pending requests
CREATE POLICY "leave_update_self" ON public.leave_requests FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Admins can manage all
CREATE POLICY "leave_manage_admin" ON public.leave_requests FOR ALL
  USING (
    coalesce(
      ((auth.jwt()->'user_metadata')->>'role'),
      ((auth.jwt()->'app_metadata')->>'role')
    ) IN ('super_admin','hr_manager')
  );

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL,
  type        text NOT NULL DEFAULT 'info'
                CHECK (type IN ('info','success','warning','error')),
  is_read     boolean NOT NULL DEFAULT false,
  action_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (profile_id = auth.uid());

-- Allow inserts from any authenticated user (API inserts on behalf of affected user)
CREATE POLICY "notifications_insert_any_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
