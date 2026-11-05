BEGIN;

-- Role changes and account suspension share the same advisory lock so concurrent
-- requests cannot remove the final active administrator through different paths.
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
  v_old_status text;
  v_active_admin_count bigint;
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor and target user IDs are required' USING ERRCODE = '22023';
  END IF;

  IF p_new_role NOT IN ('reader', 'author', 'admin') THEN
    RAISE EXCEPTION 'Invalid profile role' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('inkverse-profile-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_actor_user_id
      AND p.role = 'admin'
      AND p.account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active administrator privileges are required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RAISE EXCEPTION 'You cannot change your own administrator role' USING ERRCODE = '42501';
  END IF;

  SELECT p.role, p.account_status
    INTO v_old_role, v_old_status
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

  IF v_old_role = 'admin' AND p_new_role <> 'admin'
     AND v_old_status = 'active' THEN
    SELECT count(*) INTO v_active_admin_count
    FROM public.profiles p
    WHERE p.role = 'admin' AND p.account_status = 'active';

    IF v_active_admin_count <= 1 THEN
      RAISE EXCEPTION 'The last active administrator cannot be demoted' USING ERRCODE = '23514';
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
