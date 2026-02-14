-- Create designations table
create table if not exists public.designations (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.designations enable row level security;

-- All authenticated users can read designations
create policy "designations_select_authenticated" on public.designations
  for select using (auth.uid() is not null);

-- Only super_admin and hr_manager can insert
create policy "designations_insert_admin" on public.designations
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin and hr_manager can update
create policy "designations_update_admin" on public.designations
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

-- Only super_admin and hr_manager can delete
create policy "designations_delete_admin" on public.designations
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'hr_manager')
    )
  );

create trigger designations_updated_at
  before update on public.designations
  for each row
  execute function public.update_updated_at();
