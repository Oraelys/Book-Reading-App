sql
-- B.24: Database-backed application roles
--
-- Roles:
--   reader
--   author
--   admin
--
-- The role is application authorization data and must not be
-- changeable by a normal authenticated user.

BEGIN;

-- The database already contains this column in the current schema.
-- Keep this migration safe for environments where it may not exist yet.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'reader';

-- Existing profiles without a role become readers.
UPDATE public.profiles
SET role = 'reader'
WHERE role IS NULL;

-- Do not allow profiles to exist without an application role.
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'reader',
  ALTER COLUMN role SET NOT NULL;

-- Restrict application roles to the roles currently supported.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('reader', 'author', 'admin'));

-- ------------------------------------------------------------------
-- Prevent normal users from changing role.
--
-- The existing profile UPDATE policies allow users to update their
-- own profile. That is fine for profile information, but role must
-- only be changed by the trusted backend/service-role connection.
-- ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.role() <> 'service_role'
  THEN
    RAISE EXCEPTION 'Profile role can only be changed by the system administrator';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change
ON public.profiles;

CREATE TRIGGER trg_prevent_profile_role_change
BEFORE UPDATE OF role
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_change();

-- The trigger function itself must not be callable by ordinary users.
REVOKE EXECUTE
ON FUNCTION public.prevent_profile_role_change()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.prevent_profile_role_change()
TO service_role;

COMMIT;

