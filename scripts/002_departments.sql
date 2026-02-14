-- Create departments table
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  head_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments enable row level security;

-- All authenticated users can read departments
create policy "departments_select_authenticated" on public.departments
  for select using (auth.uid() is not null);

-- Only super_admin and hr_manager can insert
create policy "departments_insert_admin" on public.departments
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin and hr_manager can update
create policy "departments_update_admin" on public.departments
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin and hr_manager can delete
create policy "departments_delete_admin" on public.departments
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

create trigger departments_updated_at
  before update on public.departments
  for each row
  execute function public.update_updated_at();
