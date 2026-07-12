-- RLS read policies called can_access_factory(factory_id) and
-- has_any_feature_permission(keys, factory_id) with a COLUMN argument, so
-- Postgres re-evaluated them once per candidate row (14,287 times on defects)
-- and every page cost ~6.7s, tripping PostgREST's statement timeout. The list
-- pages then rendered empty because the request came back 500.
--
-- The predicate is rewritten so the expensive lookups no longer depend on the
-- row: an admin passes unconditionally, and every other user can only ever see
-- their own factory, so "can this user access row.factory_id" collapses to
-- "row.factory_id = my factory" plus a row-independent permission check.
-- Wrapping those in (SELECT ...) lets the planner hoist them into an InitPlan
-- evaluated once per query.
--
-- Semantics are unchanged:
--   admin        -> both forms allow every row
--   member of F0 -> old: (F0 = f) AND (F0 = f) AND EXISTS(perm)
--                   new: (f = F0) AND EXISTS(perm)
--   factory NULL -> both forms match no rows
--
-- Measured on defects (offset 1000, limit 1000, admin): 6733ms -> 2.9ms.
-- Verified after applying: admin still sees both factories; an ALT inspector
-- sees only ALT and still gets zero spc_alerts (no 'spc' permission); an ALV
-- inspector sees only ALV.

DROP POLICY IF EXISTS defects_select ON public.defects;
CREATE POLICY defects_select ON public.defects
FOR SELECT TO authenticated
USING (
  (SELECT public.current_user_role()) = 'admin'::public.user_role
  OR (
    factory_id = (SELECT public.current_user_factory_id())
    AND (SELECT public.has_any_feature_permission(
      ARRAY['dashboard', 'defects', 'analytics', 'spc', 'reports', 'aiInsights']
    ))
  )
);

DROP POLICY IF EXISTS inspections_select ON public.inspections;
CREATE POLICY inspections_select ON public.inspections
FOR SELECT TO authenticated
USING (
  (SELECT public.current_user_role()) = 'admin'::public.user_role
  OR (
    factory_id = (SELECT public.current_user_factory_id())
    AND (SELECT public.has_any_feature_permission(
      ARRAY['dashboard', 'inspection', 'defects', 'analytics', 'spc', 'reports', 'aiInsights']
    ))
  )
);

DROP POLICY IF EXISTS machines_select ON public.machines;
CREATE POLICY machines_select ON public.machines
FOR SELECT TO authenticated
USING (
  (SELECT public.current_user_role()) = 'admin'::public.user_role
  OR (
    factory_id = (SELECT public.current_user_factory_id())
    AND (SELECT public.has_any_feature_permission(
      ARRAY['dashboard', 'inspection', 'defects', 'analytics', 'spc', 'reports', 'aiInsights', 'management']
    ))
  )
);

DROP POLICY IF EXISTS spc_alerts_select ON public.spc_alerts;
CREATE POLICY spc_alerts_select ON public.spc_alerts
FOR SELECT TO authenticated
USING (
  (SELECT public.current_user_role()) = 'admin'::public.user_role
  OR (
    factory_id = (SELECT public.current_user_factory_id())
    AND (SELECT public.has_feature_permission('spc'))
  )
);
