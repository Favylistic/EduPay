-- Drop old RLS policies from the initial 001_create_profiles.sql / 002_profile_trigger.sql
-- that may conflict with the newer 001_profiles_and_roles.sql policies.
-- Using IF EXISTS-style approach: DROP POLICY only errors if the policy doesn't exist,
-- so we wrap in a DO block to handle gracefully.

DO $$
BEGIN
  -- Drop old simple policies that conflict with the newer admin-aware ones
  DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

  -- Drop newer policies too so re-running 001_profiles_and_roles.sql doesn't conflict
  DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
END;
$$;
