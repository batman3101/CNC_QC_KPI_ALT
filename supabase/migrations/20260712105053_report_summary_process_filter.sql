-- Report summary: honour the process filter, and apply model/process to defects.
--
-- Two bugs in the previous version:
--   1. The report UI exposes a process filter, but the RPC had no p_process
--      parameter, so picking a process changed nothing in the output.
--   2. The `def` CTE filtered defects by factory only. Selecting a model scoped
--      "total inspections" but left "total defects" as the all-model total, so
--      the two headline numbers described different populations. Joining
--      inspections lets the model/process filters reach defects as well.
--
-- The parameter list changes (p_process is inserted before p_factory), so the
-- old 4-argument signature must be dropped: leaving it in place would give
-- PostgREST two overloads to choose between.

DROP FUNCTION IF EXISTS public.get_report_summary(timestamptz, timestamptz, uuid, text);

CREATE OR REPLACE FUNCTION public.get_report_summary(
  p_from    timestamptz,
  p_to      timestamptz,
  p_model   uuid DEFAULT NULL,
  p_process text DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  WITH ins AS (
    SELECT i.status, i.inspection_process, i.model_id
    FROM public.inspections i
    WHERE i.created_at >= p_from
      AND i.created_at <= p_to
      AND (p_model IS NULL OR i.model_id = p_model)
      AND (p_process IS NULL OR i.inspection_process = p_process)
      AND (p_factory IS NULL OR i.factory_id = p_factory)
  ),
  def AS (
    SELECT d.defect_type
    FROM public.defects d
    JOIN public.inspections i ON i.id = d.inspection_id
    WHERE d.created_at >= p_from
      AND d.created_at <= p_to
      AND (p_model IS NULL OR i.model_id = p_model)
      AND (p_process IS NULL OR i.inspection_process = p_process)
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_report_summary(
  timestamptz, timestamptz, uuid, text, text
) TO authenticated;
