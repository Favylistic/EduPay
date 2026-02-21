-- Comprehensive fix: Drop ALL RLS policies on ALL tables and rebuild from scratch.
-- Every policy now uses auth.jwt() instead of subquerying profiles.
-- Also ensures is_active columns exist on all relevant tables.

-- ============================================================
-- 0. Ensure is_active columns exist
-- ============================================================
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.designations ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ============================================================
-- 1. PROFILES: Drop ALL policies and rebuild
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Every authenticated user can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles (using JWT, no subquery)
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- 2. DEPARTMENTS: Drop ALL policies and rebuild
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'departments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.departments', pol.policyname);
  END LOOP;
END $$;

-- All authenticated users can read departments
CREATE POLICY "departments_select_all" ON public.departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can insert departments
CREATE POLICY "departments_insert_admin" ON public.departments
  FOR INSERT WITH CHECK (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Admins can update departments
CREATE POLICY "departments_update_admin" ON public.departments
  FOR UPDATE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Admins can delete departments
CREATE POLICY "departments_delete_admin" ON public.departments
  FOR DELETE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- ============================================================
-- 3. DESIGNATIONS: Drop ALL policies and rebuild
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'designations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.designations', pol.policyname);
  END LOOP;
END $$;

-- All authenticated users can read designations
CREATE POLICY "designations_select_all" ON public.designations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can insert designations
CREATE POLICY "designations_insert_admin" ON public.designations
  FOR INSERT WITH CHECK (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Admins can update designations
CREATE POLICY "designations_update_admin" ON public.designations
  FOR UPDATE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Admins can delete designations
CREATE POLICY "designations_delete_admin" ON public.designations
  FOR DELETE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- ============================================================
-- 4. EMPLOYEES: Drop ALL policies and rebuild
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'employees' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees', pol.policyname);
  END LOOP;
END $$;

-- Admins can read all employees
CREATE POLICY "employees_select_admin" ON public.employees
  FOR SELECT USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Staff can read their own employee record
CREATE POLICY "employees_select_self" ON public.employees
  FOR SELECT USING (auth.uid() = profile_id);

-- Admins can insert employees
CREATE POLICY "employees_insert_admin" ON public.employees
  FOR INSERT WITH CHECK (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Admins can update employees
CREATE POLICY "employees_update_admin" ON public.employees
  FOR UPDATE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) IN ('super_admin', 'hr_manager')
  );

-- Only super_admin can delete employees
CREATE POLICY "employees_delete_admin" ON public.employees
  FOR DELETE USING (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) = 'super_admin'
  );

-- ============================================================
-- 5. Fix the update_updated_at function search_path warning
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
