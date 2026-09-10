-- Enforce 0 <= defect_quantity <= inspection_quantity on the server.
--
-- The entry form checks it (InspectionRecordForm.tsx), but nothing on the
-- server did: neither the table nor submit_inspection_record refused an
-- inspection of 10 pieces with 11 rejected, which would push a defect rate
-- past 100%. Production held no such row on 2026-09-10 (checked before adding
-- the constraint), so the CHECK validates immediately.
--
-- Re-audit finding R3, Docs/MONITOR_ANALYTICS_REAUDIT_2026-09-10.md.

ALTER TABLE public.inspections
  DROP CONSTRAINT IF EXISTS inspections_defect_qty_within_inspection_qty;

ALTER TABLE public.inspections
  ADD CONSTRAINT inspections_defect_qty_within_inspection_qty
  CHECK (inspection_quantity >= 1
         AND defect_quantity >= 0
         AND defect_quantity <= inspection_quantity);

-- Same function as 20260910_submit_inspection_record_atomic.sql plus the
-- quantity relation check, so the caller gets a 22023 with a readable message
-- instead of a 23514 from the CHECK.
CREATE OR REPLACE FUNCTION public.submit_inspection_record(
  p_client_ref text,
  p_user_id uuid,
  p_model_id uuid,
  p_inspection_process text,
  p_inspection_quantity integer,
  p_defect_quantity integer,
  p_factory_id text,
  p_machine_id uuid DEFAULT NULL,
  p_defect_type text DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_defect_description text DEFAULT NULL,
  p_results jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
  v_status public.inspection_status;
  v_any_fail boolean;
BEGIN
  IF p_client_ref IS NULL OR length(p_client_ref) = 0 THEN
    RAISE EXCEPTION 'client_ref is required' USING ERRCODE = '22023';
  END IF;
  IF p_inspection_quantity IS NULL OR p_inspection_quantity < 1 THEN
    RAISE EXCEPTION 'inspection_quantity must be >= 1' USING ERRCODE = '22023';
  END IF;
  IF p_defect_quantity IS NULL OR p_defect_quantity < 0 THEN
    RAISE EXCEPTION 'defect_quantity must be >= 0' USING ERRCODE = '22023';
  END IF;
  IF p_defect_quantity > p_inspection_quantity THEN
    RAISE EXCEPTION 'defect_quantity (%) must not exceed inspection_quantity (%)',
      p_defect_quantity, p_inspection_quantity USING ERRCODE = '22023';
  END IF;
  IF p_results IS NULL OR jsonb_typeof(p_results) <> 'array' THEN
    RAISE EXCEPTION 'results must be a JSON array' USING ERRCODE = '22023';
  END IF;

  -- Replay of an item this device already uploaded: hand back the same row.
  SELECT i.id INTO v_id FROM public.inspections i WHERE i.client_ref = p_client_ref;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT bool_or(r->>'result' = 'fail') INTO v_any_fail
  FROM jsonb_array_elements(p_results) r;
  v_status := CASE WHEN p_defect_quantity > 0 OR COALESCE(v_any_fail, false)
                   THEN 'fail'::public.inspection_status
                   ELSE 'pass'::public.inspection_status END;

  INSERT INTO public.inspections (
    client_ref, user_id, machine_id, model_id, inspection_process,
    inspection_quantity, defect_quantity, defect_type, photo_url, status, factory_id
  ) VALUES (
    p_client_ref, p_user_id, p_machine_id, p_model_id, p_inspection_process,
    p_inspection_quantity, p_defect_quantity, NULLIF(p_defect_type, ''), NULLIF(p_photo_url, ''), v_status, p_factory_id
  )
  ON CONFLICT (client_ref) WHERE client_ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    -- Lost a race with a concurrent replay of the same item. The winner's row
    -- is complete; return it.
    SELECT i.id INTO v_id FROM public.inspections i WHERE i.client_ref = p_client_ref;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'inspection with client_ref % exists but is not visible' , p_client_ref
        USING ERRCODE = '42501';
    END IF;
    RETURN v_id;
  END IF;

  INSERT INTO public.inspection_results (inspection_id, item_id, measured_value, result)
  SELECT v_id,
         (r->>'item_id')::uuid,
         COALESCE((r->>'measured_value')::numeric, 0),
         (r->>'result')::public.inspection_result
  FROM jsonb_array_elements(p_results) r;

  IF p_defect_quantity > 0 AND NULLIF(p_defect_type, '') IS NOT NULL THEN
    INSERT INTO public.defects (inspection_id, model_id, defect_type, description, photo_url, status, factory_id)
    VALUES (v_id, p_model_id, p_defect_type, NULLIF(btrim(p_defect_description), ''), NULLIF(p_photo_url, ''), 'pending', p_factory_id);
  END IF;

  RETURN v_id;
END
$$;
