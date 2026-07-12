-- Dashboard aggregation.
--
-- The dashboard fetched every inspection row (~17k) to render four KPI cards
-- and a ten-row table. Both are aggregates, so Postgres computes them.
--
-- SECURITY INVOKER (the default) on purpose: RLS still decides which rows the
-- caller may aggregate.

-- Today's KPI cards (business day, 08:00 boundary).
CREATE OR REPLACE FUNCTION public.get_dashboard_today_stats(
  p_factory text DEFAULT NULL
)
RETURNS TABLE (
  inspection_count bigint,
  inspection_qty bigint,
  defect_qty bigint,
  failed_count bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    count(*)::bigint,
    COALESCE(sum(i.inspection_quantity), 0)::bigint,
    COALESCE(sum(i.defect_quantity), 0)::bigint,
    count(*) FILTER (WHERE i.status = 'fail')::bigint
  FROM public.inspections i
  WHERE public.business_date(i.created_at) = public.business_date(now())
    AND (p_factory IS NULL OR i.factory_id = p_factory)
$$;

-- The most recent inspections, each carrying its position within its own
-- calendar day so the dashboard can render the INS-MMDD-XXX id without holding
-- every row of that day in the browser.
--
-- The window is restricted to the last 30 days: each of those days is whole
-- inside the set, so row_number() per day is exact, and the scan stays small.
CREATE OR REPLACE FUNCTION public.get_dashboard_recent_inspections(
  p_factory text DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  machine_id uuid,
  model_id uuid,
  status text,
  day_seq bigint
)
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  WITH recent AS (
    SELECT
      i.id,
      i.created_at,
      i.machine_id,
      i.model_id,
      i.status,
      row_number() OVER (
        PARTITION BY (i.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
        ORDER BY i.created_at
      ) AS day_seq
    FROM public.inspections i
    WHERE i.created_at >= (now() - interval '30 days')
      AND (p_factory IS NULL OR i.factory_id = p_factory)
  )
  SELECT r.id, r.created_at, r.machine_id, r.model_id, r.status::text, r.day_seq
  FROM recent r
  ORDER BY r.created_at DESC
  LIMIT p_limit
$$;
