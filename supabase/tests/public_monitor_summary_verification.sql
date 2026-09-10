-- Post-deployment verification for 20260910_public_monitor_summary_by_quantity.sql.
-- Read-only. Run as a database owner (the analytics RPCs are SECURITY INVOKER
-- and need to see every inspection for the comparison to be meaningful).
--
-- Window: the last 7 business days plus today (08:00 seven days ago -> 07:59:59.999
-- tomorrow, Vietnam time). NOT a calendar month - the monitor's own month range is
-- exercised by the browser, this file checks the aggregation contract.
--
-- Asserts the contract the monitor now shares with the analytics screen:
--   1. window total  == get_analytics_kpi_summary.defect_qty
--   2. every day     == get_analytics_defect_rate_trend.defect_qty
--   3. type slices, top-N lists and recent rows never exceed the total, and the
--      type slices sum to it exactly (they are not truncated)
--   4. an inspection with defect_quantity > 0 and no defects row is counted
--   5. the anon role can execute the function and nothing else new

DO $$
DECLARE
  v_factory text := 'ALT';
  v_start timestamptz := (public.business_date(now())::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '7 days' + interval '8 hours';
  v_end   timestamptz := (public.business_date(now())::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') + interval '1 day' + interval '7 hours 59 minutes 59.999 seconds';
  v_summary jsonb;
  v_total bigint;
  v_kpi bigint;
  v_type_sum bigint;
  v_mismatched_days int;
  v_unlinked_qty bigint;
  v_direct_qty bigint;
BEGIN
  v_summary := public.get_public_monitor_summary(v_factory, v_start, v_end);
  v_total := (v_summary->>'total_defect_qty')::bigint;

  -- 1. month total equals the analytics KPI card
  SELECT defect_qty INTO v_kpi
  FROM public.get_analytics_kpi_summary(v_start, v_end, NULL, NULL, v_factory);
  IF v_total IS DISTINCT FROM v_kpi THEN
    RAISE EXCEPTION 'total_defect_qty % != analytics kpi %', v_total, v_kpi;
  END IF;

  -- 2. every business day equals the analytics trend
  SELECT count(*) INTO v_mismatched_days
  FROM public.get_analytics_defect_rate_trend(v_start, v_end, NULL, NULL, v_factory) t
  FULL JOIN (
    SELECT (d->>'business_day')::date AS business_day, (d->>'defect_qty')::bigint AS defect_qty
    FROM jsonb_array_elements(v_summary->'daily') d
  ) m ON m.business_day = t.business_day
  WHERE COALESCE(t.defect_qty, 0) IS DISTINCT FROM COALESCE(m.defect_qty, 0);
  IF v_mismatched_days > 0 THEN
    RAISE EXCEPTION '% business day(s) differ from analytics trend', v_mismatched_days;
  END IF;

  -- 3. type slices sum to the total; truncated lists never exceed it
  SELECT COALESCE(sum((d->>'defect_qty')::bigint), 0) INTO v_type_sum
  FROM jsonb_array_elements(v_summary->'defect_types') d;
  IF v_type_sum IS DISTINCT FROM v_total THEN
    RAISE EXCEPTION 'defect_types sum % != total %', v_type_sum, v_total;
  END IF;
  IF (SELECT COALESCE(sum((d->>'defect_qty')::bigint), 0) FROM jsonb_array_elements(v_summary->'machines') d) > v_total
     OR (SELECT COALESCE(sum((d->>'defect_qty')::bigint), 0) FROM jsonb_array_elements(v_summary->'models') d) > v_total THEN
    RAISE EXCEPTION 'a truncated list exceeds the total';
  END IF;
  IF jsonb_array_length(v_summary->'machines') > 5 OR jsonb_array_length(v_summary->'models') > 8
     OR jsonb_array_length(v_summary->'recent') > 5 THEN
    RAISE EXCEPTION 'list truncation limits not honoured';
  END IF;

  -- 4. rejected inspections without a defects row are still counted:
  --    the total must equal a direct sum that ignores defects entirely.
  SELECT COALESCE(sum(i.defect_quantity), 0) INTO v_direct_qty
  FROM public.inspections i
  WHERE i.factory_id = v_factory AND i.created_at >= v_start AND i.created_at <= v_end;
  SELECT COALESCE(sum(i.defect_quantity), 0) INTO v_unlinked_qty
  FROM public.inspections i
  WHERE i.factory_id = v_factory AND i.created_at >= v_start AND i.created_at <= v_end
    AND i.defect_quantity > 0
    AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id);
  IF v_total IS DISTINCT FROM v_direct_qty THEN
    RAISE EXCEPTION 'total % != direct inspections sum % (unlinked qty in range: %)', v_total, v_direct_qty, v_unlinked_qty;
  END IF;

  -- 5. grants: anon may execute the summary function
  IF NOT has_function_privilege('anon', 'public.get_public_monitor_summary(text, timestamptz, timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon cannot execute get_public_monitor_summary';
  END IF;
  IF has_table_privilege('anon', 'public.inspections', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read inspections directly';
  END IF;

  RAISE NOTICE 'public monitor summary OK: factory=% total=% unlinked_qty_counted=%', v_factory, v_total, v_unlinked_qty;
END
$$;

-- Range guards must still reject out-of-window requests.
DO $$
BEGIN
  BEGIN
    PERFORM public.get_public_monitor_summary('ALT', now() - interval '60 days', now());
    RAISE EXCEPTION 'expected invalid monitor date range';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
  BEGIN
    PERFORM public.get_public_monitor_summary('NOPE', now() - interval '1 day', now());
    RAISE EXCEPTION 'expected invalid or inactive factory';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
  RAISE NOTICE 'public monitor summary guards OK';
END
$$;
