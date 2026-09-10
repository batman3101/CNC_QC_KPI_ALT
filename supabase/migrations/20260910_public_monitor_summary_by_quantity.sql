-- Public TV monitor: measure defects in rejected pieces, not in defect records.
--
-- The monitor counted rows in `defects` while the analytics screen summed
-- `inspections.defect_quantity`, so the same day read 272 on the TV and 996 in
-- the app (ALT, 2026-09-09). An inspection that rejects five pieces produces at
-- most one defects row, and 75 rejected inspections in the last 32 days have no
-- defects row at all, so no join from `defects` can ever reach the app's
-- number. Pieces win, for the same reason as 20260713020000: that is what the
-- defect rate divides and what the factory scraps.
--
-- Contract:
--   * Population is `inspections` with defect_quantity > 0, keyed by the
--     inspection itself. `defects` is never joined, so an inspection with no
--     record still counts and one with two records counts once.
--   * Dates come from inspections.created_at through business_date(), and the
--     range test is `>= p_start_at AND <= p_end_at` - identical to
--     get_analytics_kpi_summary, so the two screens agree at the boundaries.
--   * Distributions ship a `total_defect_qty` for the caller to divide by. The
--     machine and model lists are truncated (top 5 / top 8) because a month has
--     ~600 machines; a share computed from a truncated list would be wrong.
--   * Untyped quantity is reported under the 'UNCLASSIFIED' sentinel, which the
--     client already translates (see 20260713020000).
--
-- get_public_monitor_data is left in place: tablets and TVs run a
-- service-worker cached bundle for a while after a deploy, and that bundle
-- throws if the old shape is missing. Drop it once every board has updated.

CREATE OR REPLACE FUNCTION public.get_public_monitor_summary(
  p_factory_id TEXT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_factory_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.factories f
    WHERE f.id = p_factory_id AND f.is_active = true
  ) THEN
    RAISE EXCEPTION 'invalid or inactive factory' USING ERRCODE = '22023';
  END IF;

  IF p_start_at IS NULL OR p_end_at IS NULL
     OR p_end_at <= p_start_at
     OR p_end_at > p_start_at + interval '32 days'
     OR p_start_at < now() - interval '32 days'
     OR p_start_at > now() + interval '1 day' THEN
    RAISE EXCEPTION 'invalid monitor date range' USING ERRCODE = '22023';
  END IF;

  WITH rejected AS (
    SELECT i.id, i.created_at, i.machine_id, i.model_id, i.defect_type, i.defect_quantity
    FROM public.inspections i
    WHERE i.factory_id = p_factory_id
      AND i.created_at >= p_start_at
      AND i.created_at <= p_end_at
      AND i.defect_quantity > 0
  ),
  daily AS (
    SELECT public.business_date(r.created_at) AS business_day,
           sum(r.defect_quantity)::bigint AS defect_qty
    FROM rejected r
    GROUP BY 1
  ),
  by_machine AS (
    SELECT r.machine_id,
           sum(r.defect_quantity)::bigint AS defect_qty,
           (array_agg(r.defect_type ORDER BY r.created_at DESC))[1] AS recent_defect_type
    FROM rejected r
    GROUP BY r.machine_id
    ORDER BY defect_qty DESC, r.machine_id
    LIMIT 5
  ),
  by_type AS (
    SELECT r.defect_type, sum(r.defect_quantity)::bigint AS defect_qty
    FROM rejected r
    GROUP BY r.defect_type
  ),
  by_model AS (
    SELECT r.model_id, sum(r.defect_quantity)::bigint AS defect_qty
    FROM rejected r
    GROUP BY r.model_id
    ORDER BY defect_qty DESC, r.model_id
    LIMIT 8
  ),
  recent AS (
    SELECT r.* FROM rejected r ORDER BY r.created_at DESC LIMIT 5
  )
  SELECT jsonb_build_object(
    'total_defect_qty', COALESCE((SELECT sum(r.defect_quantity) FROM rejected r), 0)::bigint,
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'business_day', d.business_day,
        'defect_qty', d.defect_qty
      ) ORDER BY d.business_day)
      FROM daily d
    ), '[]'::jsonb),
    'machines', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'machine_id', bm.machine_id,
        'machine_name', m.name,
        'defect_qty', bm.defect_qty,
        'recent_defect_type_name', CASE WHEN bm.recent_defect_type IS NULL THEN 'UNCLASSIFIED' ELSE COALESCE(dt.name, bm.recent_defect_type) END
      ) ORDER BY bm.defect_qty DESC, bm.machine_id)
      FROM by_machine bm
      LEFT JOIN public.machines m ON m.id = bm.machine_id
      LEFT JOIN public.defect_types dt ON dt.id::text = bm.recent_defect_type
    ), '[]'::jsonb),
    'defect_types', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'defect_type_name', CASE WHEN bt.defect_type IS NULL THEN 'UNCLASSIFIED' ELSE COALESCE(dt.name, bt.defect_type) END,
        'defect_qty', bt.defect_qty
      ) ORDER BY bt.defect_qty DESC, bt.defect_type)
      FROM by_type bt
      LEFT JOIN public.defect_types dt ON dt.id::text = bt.defect_type
    ), '[]'::jsonb),
    'models', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'model_id', bmo.model_id,
        'model_code', pm.code,
        'defect_qty', bmo.defect_qty
      ) ORDER BY bmo.defect_qty DESC, bmo.model_id)
      FROM by_model bmo
      LEFT JOIN public.product_models pm ON pm.id = bmo.model_id
    ), '[]'::jsonb),
    'recent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', rc.id,
        'created_at', rc.created_at,
        'machine_name', m.name,
        'model_code', pm.code,
        'defect_type_name', CASE WHEN rc.defect_type IS NULL THEN 'UNCLASSIFIED' ELSE COALESCE(dt.name, rc.defect_type) END,
        'defect_qty', rc.defect_quantity
      ) ORDER BY rc.created_at DESC)
      FROM recent rc
      LEFT JOIN public.machines m ON m.id = rc.machine_id
      LEFT JOIN public.product_models pm ON pm.id = rc.model_id
      LEFT JOIN public.defect_types dt ON dt.id::text = rc.defect_type
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END
$$;

REVOKE ALL ON FUNCTION public.get_public_monitor_summary(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_monitor_summary(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
