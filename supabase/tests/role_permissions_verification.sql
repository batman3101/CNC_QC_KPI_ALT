-- Post-deployment verification for 20260711_dynamic_role_permissions.sql.
-- Run as a database owner. Every write is contained in this transaction and rolled back.

BEGIN;

CREATE TEMP TABLE permission_test_context ON COMMIT DROP AS
SELECT
  (SELECT id FROM public.users WHERE role = 'admin'::public.user_role ORDER BY id LIMIT 1) AS admin_id,
  (SELECT id FROM public.users WHERE role = 'manager'::public.user_role AND factory_id IS NOT NULL ORDER BY id LIMIT 1) AS manager_id,
  (SELECT factory_id FROM public.users WHERE role = 'manager'::public.user_role AND factory_id IS NOT NULL ORDER BY id LIMIT 1) AS manager_factory_id,
  (SELECT id FROM public.users WHERE role = 'inspector'::public.user_role AND factory_id IS NOT NULL ORDER BY id LIMIT 1) AS inspector_id,
  (SELECT factory_id FROM public.users WHERE role = 'inspector'::public.user_role AND factory_id IS NOT NULL ORDER BY id LIMIT 1) AS inspector_factory_id;

GRANT SELECT ON permission_test_context TO authenticated;

DO $$
DECLARE
  context_row permission_test_context%ROWTYPE;
  expected_permission_rows BIGINT;
BEGIN
  SELECT * INTO context_row FROM permission_test_context;
  IF context_row.admin_id IS NULL
     OR context_row.manager_id IS NULL
     OR context_row.inspector_id IS NULL THEN
    RAISE EXCEPTION 'verification requires at least one admin, manager, and inspector';
  END IF;

  IF to_regclass('public.app_features') IS NULL
     OR to_regclass('public.role_feature_permissions') IS NULL
     OR to_regclass('public.permission_audit') IS NULL THEN
    RAISE EXCEPTION 'permission tables are missing';
  END IF;

  IF to_regprocedure('public.get_my_permissions()') IS NULL
     OR to_regprocedure('public.get_role_permissions(text)') IS NULL
     OR to_regprocedure('public.set_role_permissions(text,jsonb)') IS NULL
     OR to_regprocedure('public.get_user_directory()') IS NULL
     OR to_regprocedure('public.get_public_monitor_data(text,timestamp with time zone,timestamp with time zone)') IS NULL THEN
    RAISE EXCEPTION 'one or more permission RPCs are missing';
  END IF;

  IF (SELECT count(*) FROM public.app_features WHERE is_active) <> 9 THEN
    RAISE EXCEPTION 'expected exactly 9 active application features';
  END IF;

  SELECT count(*) * 27 INTO expected_permission_rows FROM public.factories;
  IF (SELECT count(*) FROM public.role_feature_permissions) <> expected_permission_rows THEN
    RAISE EXCEPTION 'permission matrix is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.role_feature_permissions
    WHERE role = 'admin'::public.user_role AND NOT allowed
  ) THEN
    RAISE EXCEPTION 'administrator permissions must remain enabled';
  END IF;

  IF has_table_privilege('anon', 'public.users', 'SELECT')
     OR has_table_privilege('anon', 'public.inspections', 'SELECT')
     OR has_table_privilege('anon', 'public.defects', 'SELECT') THEN
    RAISE EXCEPTION 'anon still has direct access to protected base tables';
  END IF;

  IF has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_user_role()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_user_role()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_user_factory_id()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_user_factory_id()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_admin_user()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.is_admin_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'legacy security-definer helpers remain directly executable';
  END IF;

  IF NOT has_function_privilege(
    'anon',
    'public.get_public_monitor_data(text,timestamp with time zone,timestamp with time zone)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'public monitor RPC is not executable by anon';
  END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') <> 4
     OR (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspections') <> 4
     OR (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'defects') <> 4 THEN
    RAISE EXCEPTION 'core command-specific RLS policies are incomplete';
  END IF;

  IF EXISTS (
    SELECT expected.tablename, expected.policyname, expected.cmd
    FROM (VALUES
      ('users', 'users_select', 'SELECT'),
      ('users', 'users_insert', 'INSERT'),
      ('users', 'users_update', 'UPDATE'),
      ('users', 'users_delete', 'DELETE'),
      ('inspections', 'inspections_select', 'SELECT'),
      ('inspections', 'inspections_insert', 'INSERT'),
      ('inspections', 'inspections_update', 'UPDATE'),
      ('inspections', 'inspections_delete', 'DELETE'),
      ('defects', 'defects_select', 'SELECT'),
      ('defects', 'defects_insert', 'INSERT'),
      ('defects', 'defects_update', 'UPDATE'),
      ('defects', 'defects_delete', 'DELETE')
    ) AS expected(tablename, policyname, cmd)
    EXCEPT
    SELECT p.tablename, p.policyname, p.cmd
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN ('users', 'inspections', 'defects')
  ) THEN
    RAISE EXCEPTION 'one or more expected command-specific RLS policies are missing';
  END IF;
END
$$;

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT inspector_id::text FROM permission_test_context),
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
DECLARE
  inspector_factory TEXT := (SELECT inspector_factory_id FROM permission_test_context);
BEGIN
  IF public.current_user_role() <> 'inspector'::public.user_role THEN
    RAISE EXCEPTION 'inspector JWT simulation failed';
  END IF;

  IF EXISTS (
    (
      SELECT feature_key FROM public.get_my_permissions()
      EXCEPT
      SELECT rfp.feature_key
      FROM public.role_feature_permissions rfp
      JOIN public.app_features af ON af.key = rfp.feature_key AND af.is_active
      WHERE rfp.factory_id = inspector_factory
        AND rfp.role = 'inspector'::public.user_role
        AND rfp.allowed
    )
    UNION ALL
    (
      SELECT rfp.feature_key
      FROM public.role_feature_permissions rfp
      JOIN public.app_features af ON af.key = rfp.feature_key AND af.is_active
      WHERE rfp.factory_id = inspector_factory
        AND rfp.role = 'inspector'::public.user_role
        AND rfp.allowed
      EXCEPT
      SELECT feature_key FROM public.get_my_permissions()
    )
  ) THEN
    RAISE EXCEPTION 'get_my_permissions does not match the inspector permission matrix';
  END IF;

  IF (SELECT count(*) FROM public.users) <> 1 THEN
    RAISE EXCEPTION 'inspector can read another user profile';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.machines
    WHERE factory_id <> inspector_factory
  ) THEN
    RAISE EXCEPTION 'inspector can read another factory';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.get_user_directory()
    WHERE factory_id IS DISTINCT FROM inspector_factory
  ) THEN
    RAISE EXCEPTION 'bounded user directory crosses factory scope';
  END IF;
END
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT admin_id::text FROM permission_test_context),
  true
);

CREATE TEMP TABLE permission_toggle_before ON COMMIT DROP AS
SELECT
  rfp.factory_id,
  rfp.allowed,
  (SELECT count(*) FROM public.permission_audit) AS audit_count
FROM public.role_feature_permissions rfp
WHERE rfp.factory_id = (SELECT inspector_factory_id FROM permission_test_context)
  AND rfp.role = 'inspector'::public.user_role
  AND rfp.feature_key = 'analytics';

SELECT public.set_role_permissions(
  (SELECT factory_id FROM permission_toggle_before),
  jsonb_build_array(jsonb_build_object(
    'role', 'inspector',
    'feature_key', 'analytics',
    'allowed', NOT (SELECT allowed FROM permission_toggle_before)
  ))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.role_feature_permissions rfp
    JOIN permission_toggle_before before_state USING (factory_id)
    WHERE rfp.role = 'inspector'::public.user_role
      AND rfp.feature_key = 'analytics'
      AND rfp.allowed = NOT before_state.allowed
  ) THEN
    RAISE EXCEPTION 'administrator permission toggle did not persist';
  END IF;

  IF (SELECT count(*) FROM public.permission_audit)
     <> (SELECT audit_count + 1 FROM permission_toggle_before) THEN
    RAISE EXCEPTION 'permission change audit was not recorded exactly once';
  END IF;
END
$$;

ROLLBACK;
