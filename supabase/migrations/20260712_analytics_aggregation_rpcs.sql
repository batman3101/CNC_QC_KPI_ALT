-- Push analytics, report and AI-insight aggregation into Postgres.
--
-- These screens previously paged every matching inspection and defect row into
-- the browser (16k + 16k) and reduced them in JavaScript. The reductions are
-- plain GROUP BYs, so they run here instead and only the grouped rows travel.
--
-- All functions are SECURITY INVOKER (the default) on purpose: RLS on
-- inspections/defects must still apply, so a user can only aggregate rows they
-- are allowed to read. Inspector *names* are deliberately NOT joined here -
-- users_select hides other users from an inspector - so callers keep resolving
-- names through get_user_directory(), exactly as before.

-- A business day runs 08:00 -> 07:59 the next morning, Vietnam time. Shifting
-- back 8 hours turns that window into a plain calendar date.
--   2025-12-25 08:00 VN -> 2025-12-25
--   2025-12-26 07:59 VN -> 2025-12-25
CREATE OR REPLACE FUNCTION public.business_date(p_ts timestamptz)
RETURNS date
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT ((p_ts AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '8 hours')::date
$$;

-- 1. KPI summary -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_kpi_summary(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  total_inspections bigint,
  inspection_qty bigint,
  defect_qty bigint,
  active_inspectors bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    count(*)::bigint,
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint,
    count(DISTINCT i.user_id)::bigint
  FROM public.inspections i
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
$$;

-- 2. Per-inspector totals ----------------------------------------------------
-- Feeds the KPI top-3, the inspector performance chart and the inspector
-- ranking. Returns ids only; the caller maps names via get_user_directory().
CREATE OR REPLACE FUNCTION public.get_analytics_inspector_totals(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  inspector_id uuid,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    i.user_id,
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND i.user_id IS NOT NULL
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY i.user_id
$$;

-- 3. Defect rate trend, by business day --------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_defect_rate_trend(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  business_day date,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    public.business_date(i.created_at),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY public.business_date(i.created_at)
  ORDER BY public.business_date(i.created_at)
$$;

-- 4. Model distribution ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_model_distribution(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  model_id uuid,
  model_name text,
  model_code text,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    i.model_id,
    COALESCE(max(pm.name), 'Unknown'),
    COALESCE(max(pm.code), 'N/A'),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  LEFT JOIN public.product_models pm ON pm.id = i.model_id
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY i.model_id
$$;

-- 5. Machine performance -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_machine_performance(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  machine_id uuid,
  machine_name text,
  machine_model text,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    i.machine_id,
    COALESCE(max(m.name), 'Unknown'),
    COALESCE(max(m.model), 'N/A'),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  LEFT JOIN public.machines m ON m.id = i.machine_id
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY i.machine_id
  ORDER BY COALESCE(sum(i.defect_quantity), 0) DESC
$$;

-- 6. Defect type distribution ------------------------------------------------
-- defects.defect_type is text holding defect_types.id, hence the ::text cast.
-- Grouped by resolved name (not id) to match the previous client-side grouping,
-- which keyed its map on the name.
CREATE OR REPLACE FUNCTION public.get_analytics_defect_type_distribution(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  defect_type_name text,
  defect_count bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    COALESCE(dt.name, d.defect_type),
    count(*)::bigint
  FROM public.defects d
  JOIN public.inspections i ON i.id = d.inspection_id
  LEFT JOIN public.defect_types dt ON dt.id::text = d.defect_type
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR d.factory_id = p_factory)
  GROUP BY COALESCE(dt.name, d.defect_type)
$$;

-- 7. Hourly distribution (Vietnam clock hour) --------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_hourly_distribution(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  hour_of_day int,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    EXTRACT(hour FROM (i.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY 1
  ORDER BY 1
$$;

-- 8. Inspector daily trend ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_inspector_daily_trend(
  p_inspector uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  business_day date,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    public.business_date(i.created_at),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  WHERE i.user_id = p_inspector
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY public.business_date(i.created_at)
  ORDER BY public.business_date(i.created_at)
$$;

-- 9. Inspector model performance ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_inspector_model_performance(
  p_inspector uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  model_id uuid,
  model_name text,
  model_code text,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    i.model_id,
    COALESCE(max(pm.name), 'Unknown'),
    COALESCE(max(pm.code), 'N/A'),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  LEFT JOIN public.product_models pm ON pm.id = i.model_id
  WHERE i.user_id = p_inspector
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY i.model_id
$$;

-- 10. Inspector process performance ------------------------------------------
-- inspections.inspection_process stores the process CODE, not the id.
CREATE OR REPLACE FUNCTION public.get_inspector_process_performance(
  p_inspector uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  process_code text,
  process_name text,
  inspection_qty bigint,
  defect_qty bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    i.inspection_process,
    COALESCE(max(ip.name), i.inspection_process),
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint
  FROM public.inspections i
  LEFT JOIN public.inspection_processes ip ON ip.code = i.inspection_process
  WHERE i.user_id = p_inspector
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY i.inspection_process
$$;

-- 11. Distinct business days worked by the team ------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_active_days(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT count(DISTINCT public.business_date(i.created_at))::bigint
  FROM public.inspections i
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
$$;

-- 12. Report summary ---------------------------------------------------------
-- Counts records (not quantities) by status, mirroring the previous report
-- logic, which is deliberately different from the analytics charts.
CREATE OR REPLACE FUNCTION public.get_report_summary(
  p_from timestamptz,
  p_to timestamptz,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  WITH ins AS (
    SELECT i.status, i.inspection_process, i.model_id
    FROM public.inspections i
    WHERE i.created_at >= p_from
      AND i.created_at <= p_to
      AND (p_model IS NULL OR i.model_id = p_model)
      AND (p_factory IS NULL OR i.factory_id = p_factory)
  ),
  def AS (
    SELECT d.defect_type
    FROM public.defects d
    WHERE d.created_at >= p_from
      AND d.created_at <= p_to
      AND (p_factory IS NULL OR d.factory_id = p_factory)
  ),
  totals AS (
    SELECT
      count(*)::bigint AS total,
      count(*) FILTER (WHERE status = 'pass')::bigint AS passed,
      count(*) FILTER (WHERE status = 'fail')::bigint AS failed
    FROM ins
  ),
  by_type AS (
    SELECT
      COALESCE(dt.name, NULLIF(d.defect_type, ''), '기타') AS type_name,
      count(*)::bigint AS type_count
    FROM def d
    LEFT JOIN public.defect_types dt ON dt.id::text = d.defect_type
    GROUP BY 1
  ),
  by_process AS (
    SELECT
      COALESCE(NULLIF(i.inspection_process, ''), 'Unknown') AS process_name,
      count(*)::bigint AS process_count,
      count(*) FILTER (WHERE i.status = 'pass')::bigint AS process_passed
    FROM ins i
    GROUP BY 1
  ),
  by_model AS (
    SELECT
      i.model_id,
      count(*)::bigint AS model_count,
      count(*) FILTER (WHERE i.status = 'pass')::bigint AS model_passed
    FROM ins i
    GROUP BY i.model_id
  )
  SELECT jsonb_build_object(
    'total_inspections', t.total,
    'passed_inspections', t.passed,
    'failed_inspections', t.failed,
    'pass_rate', CASE WHEN t.total > 0 THEN (t.passed::numeric / t.total) * 100 ELSE 0 END,
    'total_defects', (SELECT count(*)::bigint FROM def),
    'defects_by_type', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('type', type_name, 'count', type_count))
      FROM by_type
    ), '[]'::jsonb),
    'inspections_by_process', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'process_id', process_name,
        'process_name', process_name,
        'count', process_count,
        'pass_rate', CASE WHEN process_count > 0
          THEN (process_passed::numeric / process_count) * 100 ELSE 0 END
      ))
      FROM by_process
    ), '[]'::jsonb),
    'inspections_by_model', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'model_id', COALESCE(bm.model_id::text, 'Unknown'),
        'model_name', COALESCE(NULLIF(pm.code, ''), pm.name, bm.model_id::text, 'Unknown'),
        'count', bm.model_count,
        'pass_rate', CASE WHEN bm.model_count > 0
          THEN (bm.model_passed::numeric / bm.model_count) * 100 ELSE 0 END
      ))
      FROM by_model bm
      LEFT JOIN public.product_models pm ON pm.id = bm.model_id
    ), '[]'::jsonb)
  )
  FROM totals t
$$;

-- 13. AI insights snapshot ---------------------------------------------------
-- today  -> business day (08:00 boundary)
-- weekly -> the last 7 Vietnam calendar days, matching the previous client code
--           which grouped on the browser's local date
-- models -> all time, unfiltered by date, as before
CREATE OR REPLACE FUNCTION public.get_ai_insights_snapshot(
  p_factory text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  WITH ins AS (
    SELECT i.created_at, i.model_id, i.inspection_quantity, i.defect_quantity
    FROM public.inspections i
    WHERE (p_factory IS NULL OR i.factory_id = p_factory)
  ),
  today AS (
    SELECT
      COALESCE(sum(inspection_quantity), 0)::bigint AS iq,
      COALESCE(sum(defect_quantity), 0)::bigint AS dq
    FROM ins
    WHERE public.business_date(created_at) = public.business_date(now())
  ),
  days AS (
    SELECT (((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) - g)::date AS day
    FROM generate_series(0, 6) AS g
  ),
  weekly AS (
    SELECT
      d.day,
      COALESCE(sum(i.inspection_quantity), 0)::bigint AS iq,
      COALESCE(sum(i.defect_quantity), 0)::bigint AS dq,
      count(i.created_at)::bigint AS records
    FROM days d
    LEFT JOIN ins i
      ON (i.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d.day
    GROUP BY d.day
  ),
  by_model AS (
    SELECT
      i.model_id,
      COALESCE(sum(i.inspection_quantity), 0)::bigint AS iq,
      COALESCE(sum(i.defect_quantity), 0)::bigint AS dq
    FROM ins i
    GROUP BY i.model_id
  )
  SELECT jsonb_build_object(
    'today', jsonb_build_object(
      'inspection_qty', (SELECT iq FROM today),
      'defect_qty', (SELECT dq FROM today)
    ),
    'weekly_trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(w.day, 'YYYY-MM-DD'),
        'inspection_qty', w.iq,
        'defect_qty', w.dq,
        'records', w.records
      ) ORDER BY w.day)
      FROM weekly w
    ), '[]'::jsonb),
    'model_defect_rates', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'model_id', bm.model_id,
        'model_code', COALESCE(NULLIF(pm.code, ''), bm.model_id::text),
        'inspection_qty', bm.iq,
        'defect_qty', bm.dq
      ))
      FROM by_model bm
      LEFT JOIN public.product_models pm ON pm.id = bm.model_id
    ), '[]'::jsonb)
  )
$$;
