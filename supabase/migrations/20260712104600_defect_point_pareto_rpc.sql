-- Defect-point Pareto aggregation.
--
-- The client previously pulled every failing inspection_result row and counted
-- them in JS. PostgREST caps a response at 1000 rows, so on a busy factory the
-- Pareto chart was silently drawn from a truncated sample. Count in the database
-- instead, which also removes the transfer entirely.

CREATE OR REPLACE FUNCTION public.get_defect_point_pareto(
  p_from    timestamptz,
  p_to      timestamptz,
  p_model   uuid DEFAULT NULL,
  p_process text DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE(item_id uuid, item_name text, defect_count bigint)
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    r.item_id,
    COALESCE(max(it.name), r.item_id::text),
    count(*)::bigint
  FROM public.inspection_results r
  JOIN public.inspections i ON i.id = r.inspection_id
  LEFT JOIN public.inspection_items it ON it.id = r.item_id
  WHERE r.result = 'fail'
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  GROUP BY r.item_id
  ORDER BY count(*) DESC
$function$;

GRANT EXECUTE ON FUNCTION public.get_defect_point_pareto(
  timestamptz, timestamptz, uuid, text, text
) TO authenticated;
