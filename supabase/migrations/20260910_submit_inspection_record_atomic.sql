-- Save an inspection, its measured results and its defect record in one call.
--
-- The app used to send three separate requests (photo, inspections INSERT,
-- defects INSERT) from a background queue. When the client stopped between the
-- second and the third - the edge log for 2026-09-09 16:36:37Z shows an
-- inspections 201 with no defects request after it - the rejected inspection
-- stayed without a defects row. Worse, the queue replays a stalled item from
-- scratch, so the same inspection was inserted a second time 206 minutes later
-- (this time with its defect). 15 such twins in the last 32 days double-count
-- 5,998 inspection pieces. See Docs/INSPECTION_DEFECT_SAVE_INTEGRITY_ANALYSIS_2026-09-10.md.
--
-- Two things fix both symptoms:
--   * one function = one transaction: either everything lands or nothing does;
--   * the queue's own id travels as `client_ref`, unique on inspections, so a
--     replay finds the row it already created instead of creating another.
--
-- SECURITY INVOKER on purpose: every INSERT inside still goes through the RLS
-- policies of its table, exactly as the three separate requests did.

ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS client_ref text;

COMMENT ON COLUMN public.inspections.client_ref IS
  'Idempotency key from the device queue (offline_<ms>_<rand>). NULL for rows written before 2026-09-10 or by other paths.';

CREATE UNIQUE INDEX IF NOT EXISTS inspections_client_ref_key
  ON public.inspections (client_ref)
  WHERE client_ref IS NOT NULL;

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
  IF p_results IS NULL OR jsonb_typeof(p_results) <> 'array' THEN
    RAISE EXCEPTION 'results must be a JSON array' USING ERRCODE = '22023';
  END IF;

  -- Replay of an item this device already uploaded: hand back the same row.
  -- Everything below was written in the same transaction as that row, so it
  -- is complete; nothing needs re-inserting.
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
    -- Lost a race with a concurrent replay of the same item (two tabs, or the
    -- reclaim path). The winner's row is complete; return it.
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

  -- Same rule the client applied for years: a defect record exists only when a
  -- type was chosen. Untyped rejected quantity is still counted from
  -- inspections.defect_quantity (see get_analytics_defect_type_distribution).
  IF p_defect_quantity > 0 AND NULLIF(p_defect_type, '') IS NOT NULL THEN
    INSERT INTO public.defects (inspection_id, model_id, defect_type, description, photo_url, status, factory_id)
    VALUES (v_id, p_model_id, p_defect_type, NULLIF(btrim(p_defect_description), ''), NULLIF(p_photo_url, ''), 'pending', p_factory_id);
  END IF;

  RETURN v_id;
END
$$;

REVOKE ALL ON FUNCTION public.submit_inspection_record(text, uuid, uuid, text, integer, integer, text, uuid, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_inspection_record(text, uuid, uuid, text, integer, integer, text, uuid, text, text, text, jsonb) TO authenticated;
