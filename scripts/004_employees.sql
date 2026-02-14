-- Create employees table
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  employee_id text unique not null,
  department_id uuid references public.departments(id) on delete set null,
  designation_id uuid references public.designations(id) on delete set null,
  staff_type text not null default 'non_academic' check (staff_type in ('academic', 'non_academic')),
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  phone text,
  address text,
  date_joined date not null default current_date,
  employment_status text not null default 'active' check (employment_status in ('active', 'inactive', 'terminated')),
  salary_basis text not null default 'monthly' check (salary_basis in ('monthly', 'hourly')),
  base_salary numeric(12,2) not null default 0,
  bank_name text,
  bank_account_number text,
  tax_id text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees enable row level security;

-- Super admin and HR manager can read all employees
create policy "employees_select_admin" on public.employees
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Employees can read their own record
create policy "employees_select_own" on public.employees
  for select using (profile_id = auth.uid());

-- Only super_admin and hr_manager can insert
create policy "employees_insert_admin" on public.employees
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin and hr_manager can update
create policy "employees_update_admin" on public.employees
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin can delete
create policy "employees_delete_admin" on public.employees
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

create trigger employees_updated_at
  before update on public.employees
  for each row
  execute function public.update_updated_at();
