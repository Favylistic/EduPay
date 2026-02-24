-- attendance_records: one row per check-in/out per employee per day
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date            date NOT NULL,
  check_in_time   timestamptz,
  check_out_time  timestamptz,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  status          text NOT NULL DEFAULT 'present'
                    CHECK (status IN ('present','absent','half_day','late','on_leave')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Admins can read all records
CREATE POLICY "attendance_select_admin" ON public.attendance_records FOR SELECT
  USING (
    coalesce(
      ((auth.jwt()->'user_metadata')->>'role'),
      ((auth.jwt()->'app_metadata')->>'role')
    ) IN ('super_admin','hr_manager')
  );

-- Employees can read their own records
CREATE POLICY "attendance_select_self" ON public.attendance_records FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  );

-- Employees can check in (insert their own record)
CREATE POLICY "attendance_insert_self" ON public.attendance_records FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  );

-- Employees can check out (update their own record)
CREATE POLICY "attendance_update_self" ON public.attendance_records FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  );

-- Admins can manage all records
CREATE POLICY "attendance_manage_admin" ON public.attendance_records FOR ALL
  USING (
    coalesce(
      ((auth.jwt()->'user_metadata')->>'role'),
      ((auth.jwt()->'app_metadata')->>'role')
    ) IN ('super_admin','hr_manager')
  );
