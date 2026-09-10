-- One-off data repair, executed against production on 2026-09-10 (approved).
-- Result: defects_moved=14, duplicate_inspections_deleted=15, defects_backfilled=63.
--
-- Background: Docs/INSPECTION_DEFECT_SAVE_INTEGRITY_ANALYSIS_2026-09-10.md.
-- The old save path wrote inspections and defects as separate requests, so a
-- client that stopped in between left a rejected inspection with no defect
-- record, and the queue's replay inserted the same inspection again.
--
-- Scope: the 32-day window the analysis enumerated. Older unlinked rows
-- (2026-01-30 onward, ~172 rows / ~495 pieces) were deliberately left alone.
--
-- Rules:
--   1. Twin pairs (same user/model/machine/process/qty/type within 24 h, first
--      row unlinked): keep the FIRST row (true entry time), re-point the
--      replay's defect record - including its resolved status - onto it, and
--      delete the replay. Chains (a replay that also failed) are followed to
--      their end and collapsed onto the root.
--   2. Every rejected inspection still without a record gets one, built from
--      the inspection's own type/photo/time, status 'pending'.
--   3. Post-conditions inside the same transaction: no unlinked rows left in
--      the window, no unlinked twins left, no inspection with >1 record. Any
--      failure rolls everything back.
--
-- NOT idempotent and NOT a migration: do not re-run. Kept for the record.

DO $$
DECLARE
  v_window_start timestamptz := now() - interval '32 days';
  p record;
  v_root uuid; v_cur uuid; v_next uuid; v_linked boolean;
  v_moved int := 0; v_deleted int := 0; v_backfilled int := 0;
  v_expected_pairs int; v_expected_backfill int; v_left_unlinked int; v_left_twins int;
BEGIN
  CREATE TEMP TABLE repair_unlinked ON COMMIT DROP AS
    SELECT i.* FROM public.inspections i
    WHERE i.defect_quantity > 0 AND i.created_at >= v_window_start
      AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id);

  CREATE TEMP TABLE repair_pairs ON COMMIT DROP AS
    SELECT u.id AS a_id, u.created_at AS a_at,
           (SELECT j.id FROM public.inspections j
            WHERE j.id <> u.id AND j.user_id = u.user_id AND j.model_id = u.model_id
              AND j.machine_id IS NOT DISTINCT FROM u.machine_id AND j.inspection_process = u.inspection_process
              AND j.inspection_quantity = u.inspection_quantity AND j.defect_quantity = u.defect_quantity
              AND j.defect_type IS NOT DISTINCT FROM u.defect_type
              AND j.created_at > u.created_at AND j.created_at < u.created_at + interval '24 hours'
            ORDER BY j.created_at LIMIT 1) AS b_id
    FROM repair_unlinked u;

  SELECT count(*) INTO v_expected_pairs FROM repair_pairs WHERE b_id IS NOT NULL;
  IF v_expected_pairs <> 15 THEN RAISE EXCEPTION 'expected 15 twin pairs, found %', v_expected_pairs; END IF;

  FOR p IN SELECT * FROM repair_pairs WHERE b_id IS NOT NULL ORDER BY a_at LOOP
    IF NOT EXISTS (SELECT 1 FROM public.inspections WHERE id = p.a_id) THEN CONTINUE; END IF;
    v_root := p.a_id; v_cur := p.b_id;
    LOOP
      SELECT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = v_cur) INTO v_linked;
      IF v_linked THEN
        UPDATE public.defects SET inspection_id = v_root WHERE inspection_id = v_cur;
        v_moved := v_moved + 1;
        DELETE FROM public.inspections WHERE id = v_cur; v_deleted := v_deleted + 1;
        EXIT;
      END IF;
      SELECT b_id INTO v_next FROM repair_pairs WHERE a_id = v_cur;
      DELETE FROM public.inspections WHERE id = v_cur; v_deleted := v_deleted + 1;
      IF v_next IS NULL THEN EXIT; END IF;
      v_cur := v_next;
    END LOOP;
  END LOOP;

  SELECT count(*) INTO v_expected_backfill FROM public.inspections i
   WHERE i.defect_quantity > 0 AND i.created_at >= v_window_start AND i.defect_type IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id);
  IF v_expected_backfill NOT BETWEEN 63 AND 64 THEN RAISE EXCEPTION 'expected 63-64 rows to backfill, found %', v_expected_backfill; END IF;

  INSERT INTO public.defects (inspection_id, model_id, defect_type, description, photo_url, status, factory_id, created_at)
  SELECT i.id, i.model_id, i.defect_type, NULL, i.photo_url, 'pending', i.factory_id, i.created_at
  FROM public.inspections i
  WHERE i.defect_quantity > 0 AND i.created_at >= v_window_start AND i.defect_type IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id);
  GET DIAGNOSTICS v_backfilled = ROW_COUNT;

  SELECT count(*) INTO v_left_unlinked FROM public.inspections i
   WHERE i.defect_quantity > 0 AND i.created_at >= v_window_start
     AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id);
  IF v_left_unlinked <> 0 THEN RAISE EXCEPTION '% unlinked rows remain', v_left_unlinked; END IF;
  SELECT count(*) INTO v_left_twins FROM public.inspections a
   WHERE a.created_at >= v_window_start AND a.defect_quantity > 0 AND EXISTS (
     SELECT 1 FROM public.inspections j WHERE j.id <> a.id AND j.user_id = a.user_id AND j.model_id = a.model_id
       AND j.machine_id IS NOT DISTINCT FROM a.machine_id AND j.inspection_process = a.inspection_process
       AND j.inspection_quantity = a.inspection_quantity AND j.defect_quantity = a.defect_quantity
       AND j.defect_type IS NOT DISTINCT FROM a.defect_type
       AND j.created_at > a.created_at AND j.created_at < a.created_at + interval '24 hours'
       AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = a.id));
  IF v_left_twins <> 0 THEN RAISE EXCEPTION '% unlinked twins remain', v_left_twins; END IF;
  IF EXISTS (SELECT inspection_id FROM public.defects GROUP BY inspection_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'an inspection now has more than one defect record';
  END IF;

  RAISE NOTICE 'moved=% deleted=% backfilled=%', v_moved, v_deleted, v_backfilled;
END $$;
