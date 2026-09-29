-- Manager permissions, and deactivating users instead of deleting them.
--
-- 1. Users are deactivated, not deleted.
--    inspections.user_id is ON DELETE SET NULL, so deleting a profile erased the
--    inspector from every inspection that person recorded (3,778 of 37,689
--    inspections had no inspector on 2026-09-29), and the Auth login survived
--    the delete (5 logins had no profile). A deactivated user keeps their profile
--    - so history still shows their name - but holds no permissions. The Edge
--    Function that sets deactivated_at also bans the Auth login.
--
-- 2. Managers with the 'management' feature may add and edit master data.
--    Product models, inspection items, processes and defect types are shared by
--    every factory, so the check is the manager's own permission, not a factory
--    match. Deleting stays admin-only: deleting an inspection item cascades to
--    its inspection_results, i.e. it destroys measured values.

-- Live traffic reads these tables while the policies are swapped; the first
-- attempt on 2026-09-29 deadlocked against it. Give up fast instead of holding
-- the app's queries behind a lock, and retry.
SET LOCAL lock_timeout = '5s';

-- 1. Deactivation -------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.deactivated_at IS
  'Set when the user is deactivated. The row is kept so inspection history keeps its inspector.';

-- Every permission helper resolves the caller through public.users, so filtering
-- deactivated rows out here makes a deactivated caller fail closed everywhere:
-- current_user_role() returns NULL, which no "= 'admin'" or "= 'manager'" check
-- matches. The Auth ban stops new sessions; this covers a token issued before it.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = auth.uid()
    AND u.deactivated_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.can_access_factory(p_factory_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE((
    SELECT u.role = 'admin'::public.user_role OR u.factory_id = p_factory_id
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.deactivated_at IS NULL
  ), false)
$$;

CREATE OR REPLACE FUNCTION public.has_feature_permission(
  p_feature_key text,
  p_factory_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE((
    SELECT
      u.role = 'admin'::public.user_role
      OR (
        u.factory_id = COALESCE(p_factory_id, u.factory_id)
        AND EXISTS (
          SELECT 1
          FROM public.role_feature_permissions rfp
          JOIN public.app_features af ON af.key = rfp.feature_key AND af.is_active
          WHERE rfp.factory_id = u.factory_id
            AND rfp.role = u.role
            AND rfp.feature_key = p_feature_key
            AND rfp.allowed
        )
      )
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.deactivated_at IS NULL
  ), false)
$$;

CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (feature_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT af.key
  FROM public.app_features af
  JOIN public.users u ON u.id = auth.uid()
  LEFT JOIN public.role_feature_permissions rfp
    ON rfp.factory_id = u.factory_id
   AND rfp.role = u.role
   AND rfp.feature_key = af.key
  WHERE af.is_active
    AND u.deactivated_at IS NULL
    AND (u.role = 'admin'::public.user_role OR COALESCE(rfp.allowed, false))
  ORDER BY af.sort_order
$$;

-- The directory still lists deactivated users, because analytics resolves the
-- names on old inspections through it. It now says who is deactivated, so the
-- inspector picker can leave them out. The return type changes, hence DROP.
DROP FUNCTION IF EXISTS public.get_user_directory();

CREATE FUNCTION public.get_user_directory()
RETURNS TABLE (
  id uuid,
  name text,
  role public.user_role,
  factory_id text,
  deactivated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT u.id, u.name, u.role, u.factory_id, u.deactivated_at
  FROM public.users u
  JOIN public.users caller ON caller.id = auth.uid()
  WHERE auth.uid() IS NOT NULL
    AND caller.deactivated_at IS NULL
    AND (
      caller.role = 'admin'::public.user_role
      OR (
        u.factory_id = caller.factory_id
        AND public.has_any_feature_permission(
          ARRAY['inspection','defects','analytics','reports','aiInsights','userManagement'],
          caller.factory_id
        )
      )
    )
  ORDER BY u.name, u.id
$$;

REVOKE ALL ON FUNCTION public.get_user_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_directory() TO authenticated;

-- 2. Master data: managers add and edit, admins also delete --------------------

-- Row-independent on purpose: it takes no column, so wrapped in (SELECT ...) the
-- planner evaluates it once per statement instead of once per row.
CREATE OR REPLACE FUNCTION public.can_edit_master_data()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(
    public.current_user_role() = 'admin'::public.user_role
    OR (
      public.current_user_role() = 'manager'::public.user_role
      AND public.has_feature_permission('management')
    ),
    false
  )
$$;

REVOKE ALL ON FUNCTION public.can_edit_master_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_master_data() TO authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['product_models', 'inspection_items', 'inspection_processes', 'defect_types']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_write', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
         WITH CHECK ((SELECT public.can_edit_master_data()))',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
         USING ((SELECT public.can_edit_master_data()))
         WITH CHECK ((SELECT public.can_edit_master_data()))',
      t || '_update', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
         USING ((SELECT public.current_user_role()) = ''admin''::public.user_role)',
      t || '_delete', t
    );
  END LOOP;
END
$$;
