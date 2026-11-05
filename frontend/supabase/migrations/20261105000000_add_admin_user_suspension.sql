BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS suspended_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason text NULL;

CREATE TABLE IF NOT EXISTS public.admin_user_suspension_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('suspended', 'reactivated')),
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_user_suspension_audit_target_created_idx
  ON public.admin_user_suspension_audit_logs (target_user_id, created_at DESC);

ALTER TABLE public.admin_user_suspension_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_user_suspension_audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_user_suspension_audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_user_suspension_audit_logs_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.admin_set_user_suspension(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_is_suspended boolean,
  p_reason text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  is_suspended boolean,
  suspended_at timestamptz,
  suspension_reason text,
  changed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_suspended boolean;
  v_target_role text;
  v_changed_at timestamptz := now();
  v_reason text := NULLIF(left(trim(COALESCE(p_reason, '')), 500), '');
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL OR p_is_suspended IS NULL THEN
    RAISE EXCEPTION 'Actor, target and suspension status are required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('inkverse-profile-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_actor_user_id AND p.role = 'admin' AND p.is_suspended = false
  ) THEN
    RAISE EXCEPTION 'Active administrator privileges are required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'Administrators cannot suspend or reactivate their own account' USING ERRCODE = '42501';
  END IF;

  SELECT p.is_suspended, p.role
    INTO v_current_suspended, v_target_role
  FROM public.profiles p
  WHERE p.id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile was not found' USING ERRCODE = 'P0002';
  END IF;

  -- Keep administrator access changes separate from ordinary account moderation.
  -- An administrator must first be demoted through the audited role-change flow.
  IF p_is_suspended AND v_target_role = 'admin' THEN
    RAISE EXCEPTION 'Demote this administrator before suspending the account' USING ERRCODE = '23514';
  END IF;

  IF v_current_suspended = p_is_suspended THEN
    RETURN QUERY
      SELECT p_target_user_id, p.is_suspended, p.suspended_at,
             p.suspension_reason, v_changed_at
      FROM public.profiles p WHERE p.id = p_target_user_id;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET is_suspended = p_is_suspended,
      suspended_at = CASE WHEN p_is_suspended THEN v_changed_at ELSE NULL END,
      suspended_by = CASE WHEN p_is_suspended THEN p_actor_user_id ELSE NULL END,
      suspension_reason = CASE WHEN p_is_suspended THEN v_reason ELSE NULL END,
      updated_at = v_changed_at
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_user_suspension_audit_logs (
    actor_user_id, target_user_id, action, reason, created_at
  ) VALUES (
    p_actor_user_id, p_target_user_id,
    CASE WHEN p_is_suspended THEN 'suspended' ELSE 'reactivated' END,
    CASE WHEN p_is_suspended THEN v_reason ELSE NULL END,
    v_changed_at
  );

  RETURN QUERY
    SELECT p.id, p.is_suspended, p.suspended_at,
           p.suspension_reason, v_changed_at
    FROM public.profiles p WHERE p.id = p_target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_suspension(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_suspension(uuid, uuid, boolean, text)
  TO service_role;

COMMIT;
