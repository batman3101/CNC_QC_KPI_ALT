-- Machine analysis: defect rate and defect types for a single machine.
--
-- These are new functions rather than a p_machine argument bolted onto the nine
-- existing get_analytics_* ones. Adding an argument to those would create an
-- overload, which PostgREST rejects as ambiguous, so they would each have to be
-- dropped and recreated - and the app is in daily use on the factory floor.
-- Additive functions cannot break the screens already running.
--
-- Not SECURITY DEFINER: they run as the caller so the RLS policies on
-- inspections and defects still decide which rows are visible, exactly as the
-- existing analytics functions do.

-- Pieces inspected and pieces rejected on one machine.
--
-- inspection_count (rows) is returned alongside inspection_qty (pieces) because
-- a machine's defect rate is only as trustworthy as the sample behind it: half
-- the machines in a 30-day window have fewer than five inspections, and the UI
-- has to be able to say so.
CREATE OR REPLACE FUNCTION public.get_machine_analysis_summary(
  p_machine uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_factory text DEFAULT NULL
)
RETURNS TABLE(inspection_count bigint, inspection_qty bigint, defect_qty bigint)
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    count(*)::bigint,
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.machine_id = p_machine
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_factory IS NULL OR i.factory_id = p_factory)
$function$;

-- Daily defect rate for one machine, grouped on the Vietnam business day
-- (08:00 -> 07:59 next morning) by public.business_date().
CREATE OR REPLACE FUNCTION public.get_machine_defect_trend(
  p_machine uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_factory text DEFAULT NULL
)
RETURNS TABLE(business_day date, inspection_qty bigint, defect_qty bigint)
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    public.business_date(i.created_at),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.machine_id = p_machine
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY public.business_date(i.created_at)
  ORDER BY public.business_date(i.created_at)
$function$;

-- Defect types on one machine, measured in rejected *pieces*.
--
-- The analytics page's equivalent counts defect rows, which answers "how often
-- did this defect come up". This one sums inspections.defect_quantity, which
-- answers "how many pieces did it cost". Summing the parent's quantity is only
-- sound because a defect row maps to exactly one inspection: all 16,620 defect
-- rows in production do, none carrying two.
--
-- Superseded by 20260713010528, which adds the untyped defects this version
-- silently drops.
CREATE OR REPLACE FUNCTION public.get_machine_defect_types(
  p_machine uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_factory text DEFAULT NULL
)
RETURNS TABLE(defect_type_name text, defect_qty bigint)
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    COALESCE(dt.name, d.defect_type),
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.defects d
  JOIN public.inspections i ON i.id = d.inspection_id
  LEFT JOIN public.defect_types dt ON dt.id::text = d.defect_type
  WHERE i.machine_id = p_machine
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_factory IS NULL OR d.factory_id = p_factory)
  GROUP BY COALESCE(dt.name, d.defect_type)
  ORDER BY 2 DESC
$function$;

-- Register the screen so it appears in the permission matrix. get_my_permissions
-- reads app_features, so a route that is not listed here is invisible to every
-- role including admin.
INSERT INTO public.app_features (key, label_key, route, sort_order, is_active)
VALUES ('machineAnalysis', 'nav.machineAnalysis', '/machine-analysis', 45, true)
ON CONFLICT (key) DO UPDATE
  SET label_key = EXCLUDED.label_key,
      route = EXCLUDED.route,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;

-- Same grants the analytics screen already has, for every factory: admins and
-- managers yes, inspectors no. Administrators can change this in the management
-- screen afterwards.
INSERT INTO public.role_feature_permissions (factory_id, role, feature_key, allowed)
SELECT f.factory_id, r.role, 'machineAnalysis', r.allowed
FROM (SELECT DISTINCT factory_id FROM public.role_feature_permissions) f
CROSS JOIN (
  VALUES ('admin'::public.user_role, true),
         ('manager'::public.user_role, true),
         ('inspector'::public.user_role, false)
) AS r(role, allowed)
ON CONFLICT (factory_id, role, feature_key) DO NOTHING;
