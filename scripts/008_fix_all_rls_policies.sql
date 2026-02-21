-- Fix ALL RLS policies across all tables to use auth.jwt() instead of
-- subquerying profiles (which caused recursive RLS evaluation and 500 errors).
-- Also add missing is_active columns to departments and designations.

-- ============================================================
-- 1. Add is_active column to departments and designations if missing
-- ============================================================
alter table public.departments add column if not exists is_active boolean not null default true;
alter table public.designations add column if not exists is_active boolean not null default true;
alter table public.employees add column if not exists is_active boolean not null default true;

-- ============================================================
-- 2. Fix DEPARTMENTS RLS policies (insert/update/delete use profiles subquery)
-- ============================================================
drop policy if exists "departments_insert_admin" on public.departments;
drop policy if exists "departments_update_admin" on public.departments;
drop policy if exists "departments_delete_admin" on public.departments;

create policy "departments_insert_admin" on public.departments
  for insert with check (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "departments_update_admin" on public.departments
  for update using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "departments_delete_admin" on public.departments
  for delete using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

-- ============================================================
-- 3. Fix DESIGNATIONS RLS policies
-- ============================================================
drop policy if exists "designations_insert_admin" on public.designations;
drop policy if exists "designations_update_admin" on public.designations;
drop policy if exists "designations_delete_admin" on public.designations;

create policy "designations_insert_admin" on public.designations
  for insert with check (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "designations_update_admin" on public.designations
  for update using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "designations_delete_admin" on public.designations
  for delete using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

-- ============================================================
-- 4. Fix EMPLOYEES RLS policies
-- ============================================================
drop policy if exists "employees_select_admin" on public.employees;
drop policy if exists "employees_insert_admin" on public.employees;
drop policy if exists "employees_update_admin" on public.employees;
drop policy if exists "employees_delete_admin" on public.employees;

create policy "employees_select_admin" on public.employees
  for select using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "employees_insert_admin" on public.employees
  for insert with check (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "employees_update_admin" on public.employees
  for update using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) in ('super_admin', 'hr_manager')
  );

create policy "employees_delete_admin" on public.employees
  for delete using (
    coalesce(
      ((auth.jwt() -> 'user_metadata') ->> 'role'),
      ((auth.jwt() -> 'app_metadata') ->> 'role')
    ) = 'super_admin'
  );
