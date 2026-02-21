-- Fix the recursive RLS policies on profiles table
-- The profiles_select_admin policy references the profiles table itself,
-- which causes an infinite recursion / 500 error when RLS evaluates it.

-- Drop existing select policies
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

-- Recreate a single non-recursive select policy
-- Use auth.jwt() to read the role from the JWT metadata instead of querying profiles again
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Allow admins to read all profiles by checking user_metadata from the JWT token
-- This avoids the recursive query on the profiles table itself
create policy "profiles_select_admin" on public.profiles
  for select using (
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ) in ('super_admin', 'hr_manager')
  );

-- Fix the update_updated_at function to set explicit search_path (Supabase lint warning)
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Also fix the update admin policy to use JWT instead of recursive query
drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_update_admin" on public.profiles
  for update using (
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ) = 'super_admin'
  );
