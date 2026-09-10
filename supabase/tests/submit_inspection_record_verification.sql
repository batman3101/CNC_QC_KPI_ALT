-- Post-deployment verification for 20260910_submit_inspection_record_atomic.sql.
-- Run as a database owner. Every write happens inside this transaction and is
-- rolled back at the end - nothing persists.
--
-- Asserts:
--   1. one call writes inspection + results + defect together
--   2. replaying the same client_ref returns the same id and writes nothing new
--   3. a failure inside the call leaves no inspection behind (atomicity)
--   4. grants: authenticated may execute, anon may not

BEGIN;

DO $$
DECLARE
  v_user uuid;
  v_model uuid;
  v_process text;
  v_factory text;
  v_machine uuid;
  v_type text;
  v_item uuid;
  v_ref text := 'offline_verify_' || floor(random() * 1e9)::text;
  v_id1 uuid;
  v_id2 uuid;
  v_n int;
BEGIN
  SELECT u.id, u.factory_id INTO v_user, v_factory
  FROM public.users u WHERE u.role = 'inspector' AND u.factory_id IS NOT NULL ORDER BY u.id LIMIT 1;
  SELECT pm.id INTO v_model FROM public.product_models pm ORDER BY pm.id LIMIT 1;
  SELECT ip.code INTO v_process FROM public.inspection_processes ip ORDER BY ip.id LIMIT 1;
  SELECT m.id INTO v_machine FROM public.machines m WHERE m.factory_id = v_factory ORDER BY m.id LIMIT 1;
  SELECT dt.id::text INTO v_type FROM public.defect_types dt WHERE dt.is_active ORDER BY dt.id LIMIT 1;
  SELECT ii.id INTO v_item FROM public.inspection_items ii WHERE ii.model_id = v_model ORDER BY ii.id LIMIT 1;

  IF v_user IS NULL OR v_model IS NULL OR v_process IS NULL OR v_type IS NULL THEN
    RAISE EXCEPTION 'verification needs an inspector, a model, a process and a defect type';
  END IF;

  -- 1. one call, three rows
  v_id1 := public.submit_inspection_record(
    v_ref, v_user, v_model, v_process, 10, 2, v_factory, v_machine, v_type, NULL, '  verify  ',
    CASE WHEN v_item IS NULL THEN '[]'::jsonb
         ELSE jsonb_build_array(jsonb_build_object('item_id', v_item, 'measured_value', 1.5, 'result', 'fail')) END
  );
  SELECT count(*) INTO v_n FROM public.inspections WHERE client_ref = v_ref;
  IF v_n <> 1 THEN RAISE EXCEPTION 'expected 1 inspection, got %', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.defects WHERE inspection_id = v_id1;
  IF v_n <> 1 THEN RAISE EXCEPTION 'expected 1 defect, got %', v_n; END IF;
  IF v_item IS NOT NULL THEN
    SELECT count(*) INTO v_n FROM public.inspection_results WHERE inspection_id = v_id1;
    IF v_n <> 1 THEN RAISE EXCEPTION 'expected 1 result, got %', v_n; END IF;
  END IF;
  IF (SELECT status FROM public.inspections WHERE id = v_id1) <> 'fail' THEN
    RAISE EXCEPTION 'expected status fail';
  END IF;
  IF (SELECT description FROM public.defects WHERE inspection_id = v_id1) <> 'verify' THEN
    RAISE EXCEPTION 'description should be trimmed';
  END IF;

  -- 2. replay returns the same id, writes nothing
  v_id2 := public.submit_inspection_record(v_ref, v_user, v_model, v_process, 10, 2, v_factory, v_machine, v_type);
  IF v_id2 <> v_id1 THEN RAISE EXCEPTION 'replay returned % instead of %', v_id2, v_id1; END IF;
  SELECT count(*) INTO v_n FROM public.inspections WHERE client_ref = v_ref;
  IF v_n <> 1 THEN RAISE EXCEPTION 'replay inserted a second inspection'; END IF;
  SELECT count(*) INTO v_n FROM public.defects WHERE inspection_id = v_id1;
  IF v_n <> 1 THEN RAISE EXCEPTION 'replay inserted a second defect'; END IF;

  -- 3. a failing defect insert (bad model FK on the defect) rolls the inspection back too
  BEGIN
    PERFORM public.submit_inspection_record(
      v_ref || '_bad', v_user, gen_random_uuid(), v_process, 10, 2, v_factory, v_machine, v_type);
    RAISE EXCEPTION 'expected the bad model to fail';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
  SELECT count(*) INTO v_n FROM public.inspections WHERE client_ref = v_ref || '_bad';
  IF v_n <> 0 THEN RAISE EXCEPTION 'inspection survived a failed transaction'; END IF;

  -- 4. untyped rejection: inspection row only, no defect
  v_id2 := public.submit_inspection_record(v_ref || '_untyped', v_user, v_model, v_process, 10, 1, v_factory, v_machine, NULL);
  SELECT count(*) INTO v_n FROM public.defects WHERE inspection_id = v_id2;
  IF v_n <> 0 THEN RAISE EXCEPTION 'untyped rejection must not create a defect row'; END IF;

  -- 5. grants
  IF NOT has_function_privilege('authenticated', 'public.submit_inspection_record(text, uuid, uuid, text, integer, integer, text, uuid, text, text, text, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated cannot execute submit_inspection_record';
  END IF;
  IF has_function_privilege('anon', 'public.submit_inspection_record(text, uuid, uuid, text, integer, integer, text, uuid, text, text, text, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute submit_inspection_record';
  END IF;

  RAISE NOTICE 'submit_inspection_record OK (inspection % rolled back)', v_id1;
END
$$;

ROLLBACK;
