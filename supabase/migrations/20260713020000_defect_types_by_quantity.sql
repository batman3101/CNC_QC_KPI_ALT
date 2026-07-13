-- Measure defect types in rejected pieces, not in defect records.
--
-- The analytics page counted defect rows here while its KPI card reported
-- rejected pieces, so the same screen carried two different totals for "불량":
-- the pie added up to 4,116 and the card said 7,908. Neither was wrong, they
-- were answering different questions in the same unit-less word. Pieces win,
-- because that is what the defect rate divides and what the factory scraps.
--
-- Ranking can move: a defect that shows up often but costs two pieces each time
-- now sits below a rare one that scraps a whole lot.

-- Untyped defects are reported as the sentinel 'UNCLASSIFIED', not as NULL and
-- not as a Korean word.
--
-- Not NULL, because this app is a PWA: tablets keep running a service-worker
-- cached bundle after a deploy, and that bundle sorts these rows with
-- a.defectType.localeCompare(...), which throws on null and would take the
-- whole distribution tab down until the device happened to update. A string it
-- has never seen it simply prints.
--
-- Not a Korean word, because the database has no business deciding what
-- language a Vietnamese inspector reads. The client translates the sentinel.
CREATE OR REPLACE FUNCTION public.get_analytics_defect_type_distribution(
  p_from timestamptz,
  p_to timestamptz,
  p_process text DEFAULT NULL,
  p_model uuid DEFAULT NULL,
  p_factory text DEFAULT NULL
)
RETURNS TABLE(defect_type_name text, defect_count bigint)
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    COALESCE(dt.name, d.defect_type),
    sum(i.defect_quantity)::bigint
  FROM public.defects d
  JOIN public.inspections i ON i.id = d.inspection_id
  LEFT JOIN public.defect_types dt ON dt.id::text = d.defect_type
  WHERE i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR d.factory_id = p_factory)
  GROUP BY COALESCE(dt.name, d.defect_type)

  UNION ALL

  -- Pieces rejected on an inspection where nobody picked a defect type. There
  -- is no defects row for these, so the query above cannot see them, and
  -- without this branch the slices stay short of the headline number with
  -- nothing on screen to explain the gap.
  SELECT
    'UNCLASSIFIED',
    sum(i.defect_quantity)::bigint
  FROM public.inspections i
  LEFT JOIN public.defects d ON d.inspection_id = i.id
  WHERE d.id IS NULL
    AND i.defect_quantity > 0
    AND i.created_at >= p_from
    AND i.created_at <= p_to
    AND (p_process IS NULL OR i.inspection_process = p_process)
    AND (p_model IS NULL OR i.model_id = p_model)
    AND (p_factory IS NULL OR i.factory_id = p_factory)
  HAVING sum(i.defect_quantity) > 0
$function$;

-- The machine page's equivalent, moved onto the same sentinel so both screens
-- speak one convention and the client has one place to translate it.
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
  SELECT * FROM (
    SELECT
      COALESCE(dt.name, d.defect_type) AS defect_type_name,
      sum(i.defect_quantity)::bigint AS defect_qty
    FROM public.defects d
    JOIN public.inspections i ON i.id = d.inspection_id
    LEFT JOIN public.defect_types dt ON dt.id::text = d.defect_type
    WHERE i.machine_id = p_machine
      AND i.created_at >= p_from
      AND i.created_at <= p_to
      AND (p_factory IS NULL OR d.factory_id = p_factory)
    GROUP BY COALESCE(dt.name, d.defect_type)

    UNION ALL

    SELECT
      'UNCLASSIFIED',
      sum(i.defect_quantity)::bigint
    FROM public.inspections i
    LEFT JOIN public.defects d ON d.inspection_id = i.id
    WHERE d.id IS NULL
      AND i.defect_quantity > 0
      AND i.machine_id = p_machine
      AND i.created_at >= p_from
      AND i.created_at <= p_to
      AND (p_factory IS NULL OR i.factory_id = p_factory)
    HAVING sum(i.defect_quantity) > 0
  ) rows
  ORDER BY defect_qty DESC
$function$;
