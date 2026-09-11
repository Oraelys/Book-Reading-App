BEGIN;

-- ============================================================
-- B.24.1 / B.24.2
-- Secure profile roles
--
-- Roles:
--   reader
--   author
--   admin
--
-- Normal clients can never promote themselves.
-- Elevated roles are assigned only through the service role.
-- ============================================================

-- Ensure the role column exists.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'reader';

-- Normalize any existing NULL roles.
UPDATE public.profiles
SET role = 'reader'
WHERE role IS NULL;

-- Role must always have a valid value.
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'reader',
  ALTER COLUMN role SET NOT NULL;

-- Recreate role validation.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('reader', 'author', 'admin'));


-- ============================================================
-- Prevent unauthorized role changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  -- The service role is allowed to create/update roles.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- A normal user may not create a profile with an
  -- elevated role.
  IF TG_OP = 'INSERT' THEN

    IF NEW.role IS DISTINCT FROM 'reader' THEN
      RAISE EXCEPTION
        'Profile role can only be assigned by the system administrator';
    END IF;

    RETURN NEW;
  END IF;

  -- A normal user may not change an existing role.
  IF TG_OP = 'UPDATE'
     AND NEW.role IS DISTINCT FROM OLD.role
  THEN
    RAISE EXCEPTION
      'Profile role can only be changed by the system administrator';
  END IF;

  RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_protect_profile_role
ON public.profiles;

CREATE TRIGGER trg_protect_profile_role
BEFORE INSERT OR UPDATE OF role
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();


-- The trigger itself should not be callable by normal clients.
REVOKE EXECUTE
ON FUNCTION public.protect_profile_role()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.protect_profile_role()
TO service_role;


-- ============================================================
-- Harden profile INSERT policies
-- ============================================================

-- Remove the existing duplicate INSERT policies.
DROP POLICY IF EXISTS "Users can insert own profile"
ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own profile"
ON public.profiles;


-- A normal authenticated user can create only their own
-- reader profile.
CREATE POLICY "Users can insert their own reader profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND role = 'reader'
);


-- ============================================================
-- Keep normal profile updates restricted to the owner.
-- The trigger above separately protects the role column.
-- ============================================================

DROP POLICY IF EXISTS "Users can update own profile"
ON public.profiles;

DROP POLICY IF EXISTS "Users can update their own profile"
ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);


COMMIT;