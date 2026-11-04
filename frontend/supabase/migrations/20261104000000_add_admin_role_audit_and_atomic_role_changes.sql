BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_role_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_role text NOT NULL CHECK (previous_role IN ('reader', 'author', 'admin')),
  new_role text NOT NULL CHECK (new_role IN ('reader', 'author', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_role_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_role_audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_role_audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_role_audit_logs_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.admin_change_profile_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_new_role text
)
RETURNS TABLE (
  user_id uuid,
  previous_role text,
  new_role text,
  changed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_role text;
  v_admin_count bigint;
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor and target user IDs are required' USING ERRCODE = '22023';
  END IF;

  IF p_new_role NOT IN ('reader', 'author', 'admin') THEN
    RAISE EXCEPTION 'Invalid profile role' USING ERRCODE = '22023';
  END IF;

  -- Serialize administrator-role changes to prevent concurrent removal of the final admin.
  PERFORM pg_advisory_xact_lock(hashtext('inkverse-profile-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_actor_user_id AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrator privileges are required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'You cannot change your own administrator role' USING ERRCODE = '42501';
  END IF;

  SELECT p.role INTO v_old_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile was not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_old_role = p_new_role THEN
    RETURN QUERY SELECT p_target_user_id, v_old_role, p_new_role, now();
    RETURN;
  END IF;

  IF v_old_role = 'admin' AND p_new_role <> 'admin' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.profiles p
    WHERE p.role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'The last administrator cannot be demoted' USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_new_role,
      updated_at = now()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_role_audit_logs (
    actor_user_id, target_user_id, previous_role, new_role
  ) VALUES (
    p_actor_user_id, p_target_user_id, v_old_role, p_new_role
  );

  RETURN QUERY SELECT p_target_user_id, v_old_role, p_new_role, now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_profile_role(uuid, uuid, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_profile_role(uuid, uuid, text)
TO service_role;

COMMIT;
