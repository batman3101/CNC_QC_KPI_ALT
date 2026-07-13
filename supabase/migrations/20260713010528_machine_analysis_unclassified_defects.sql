-- Make the defect-type slices add up to the machine's defect quantity.
--
-- An inspection only gets a defects row when the inspector picked a defect
-- type, so a rejected quantity entered without one leaves no row behind - 16
-- inspections and 66 pieces in the last 30 days. The previous version of this
-- function reads from defects, so those pieces were silently dropped and the
-- slices fell short of the headline defect quantity with nothing on screen to
-- explain the gap: CNC-002 showed 339 across its types against a total of 351.
--
-- The second branch reports them, as a NULL type rather than a Korean word. The
-- caller translates it, so a Vietnamese inspector does not read a label the
-- database invented - the same reason defect descriptions are no longer stored
-- as prose.
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
      NULL::text,
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
