BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

CREATE TABLE IF NOT EXISTS public.admin_account_status_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_status text NOT NULL CHECK (previous_status IN ('active', 'suspended')),
  new_status text NOT NULL CHECK (new_status IN ('active', 'suspended')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_account_status_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_account_status_audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_account_status_audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_account_status_audit_logs_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.admin_set_profile_account_status(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_new_status text,
  p_reason text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  previous_status text,
  new_status text,
  changed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_target_role text;
  v_active_admin_count bigint;
  v_reason text;
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor and target user IDs are required' USING ERRCODE = '22023';
  END IF;

  IF p_new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid account status' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('inkverse-profile-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_actor_user_id AND p.role = 'admin'
      AND p.account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active administrator privileges are required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'You cannot suspend your own account' USING ERRCODE = '42501';
  END IF;

  SELECT p.account_status, p.role
    INTO v_old_status, v_target_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile was not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_old_status = p_new_status THEN
    RETURN QUERY SELECT p_target_user_id, v_old_status, p_new_status, now();
    RETURN;
  END IF;

  IF p_new_status = 'suspended' AND v_target_role = 'admin' THEN
    SELECT count(*) INTO v_active_admin_count
    FROM public.profiles p
    WHERE p.role = 'admin' AND p.account_status = 'active';

    IF v_active_admin_count <= 1 THEN
      RAISE EXCEPTION 'The last active administrator cannot be suspended' USING ERRCODE = '23514';
    END IF;
  END IF;

  v_reason := NULLIF(left(trim(COALESCE(p_reason, '')), 500), '');

  UPDATE public.profiles
  SET account_status = p_new_status,
      suspended_at = CASE WHEN p_new_status = 'suspended' THEN now() ELSE NULL END,
      suspended_by = CASE WHEN p_new_status = 'suspended' THEN p_actor_user_id ELSE NULL END,
      suspension_reason = CASE WHEN p_new_status = 'suspended' THEN v_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_account_status_audit_logs (
    actor_user_id, target_user_id, previous_status, new_status, reason
  ) VALUES (
    p_actor_user_id, p_target_user_id, v_old_status, p_new_status, v_reason
  );

  RETURN QUERY SELECT p_target_user_id, v_old_status, p_new_status, now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_account_status(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_account_status(uuid, uuid, text, text)
TO service_role;

COMMIT;
