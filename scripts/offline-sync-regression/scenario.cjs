// Regression scenarios for src/services/offlineSyncService.ts, run against the
// real source with in-memory stand-ins for IndexedDB and Supabase.
// Run: npm run test:sync
//
// Background (Docs/MONITOR_ANALYTICS_REAUDIT_2026-09-10.md, R1): the sync used
// to read its work list once, and a second caller joined the running promise.
// An entry queued during a sync was therefore skipped, while its caller was
// told "success" from the shared result.
//
//   A. entry queued mid-sync is still uploaded by that run, and ends 'synced'
//   B. an older row failing does not turn the new entry's success into a
//      warning - the page judges from its own row, not the aggregate
//   C. a row that fails is not retried again within the same run
const path = require('path')
const bundle = require(path.join(__dirname, '..', '..', 'node_modules', '.cache', 'offline-sync-regression', 'entry.cjs'))
const { svc, db, api } = bundle

const tick = () => new Promise((r) => setTimeout(r, 5))
const row = (id, extra = {}) => ({
  id, model_id: 'm', model_code: 'M', inspection_process_code: 'P', inspection_process_name: 'P',
  defect_type_id: 't', defect_type_name: 'T', machine_id: null, machine_name: null,
  inspector_id: 'u', inspector_name: 'U', factory_id: 'ALT', inspection_quantity: 10, defect_quantity: 1,
  photo_data: null, notes: null, defect_points: null, status: 'pending', created_at: new Date().toISOString(),
  synced_at: null, error_message: null, retry_count: 0, ...extra,
})
const reset = () => { db.rows.clear(); api.submitted.length = 0; api.gates.clear() }

async function scenarioA() {
  reset()
  await db.offlineDb.offlineInspections.add(row('old'))
  api.gate('old') // hold the server call for 'old' open
  const p1 = svc.syncPendingInspections()
  await tick() // p1 has read its list and is waiting on 'old'
  await db.offlineDb.offlineInspections.add(row('new'))
  const p2 = svc.syncPendingInspections()
  const samePromise = p1 === p2
  api.gates.get('old').release()
  const result = await p2
  const newStatus = await svc.getQueuedInspectionStatus('new')
  return { samePromise, result, submittedIds: [...api.submitted], newStatus }
}

async function scenarioB() {
  reset()
  await db.offlineDb.offlineInspections.add(row('old-bad'))
  await db.offlineDb.offlineInspections.add(row('new'))
  api.gate('old-bad', true); api.gates.get('old-bad').release()
  const result = await svc.syncPendingInspections()
  return {
    result,
    newStatus: await svc.getQueuedInspectionStatus('new'),
    oldStatus: await svc.getQueuedInspectionStatus('old-bad'),
  }
}

async function scenarioC() {
  reset()
  await db.offlineDb.offlineInspections.add(row('bad'))
  api.gate('bad', true); api.gates.get('bad').release()
  const result = await svc.syncPendingInspections()
  const r = await db.offlineDb.offlineInspections.get('bad')
  return { result, attempts: api.submitted.filter((x) => x === 'bad').length, retry_count: r.retry_count, status: r.status }
}

;(async () => {
  const a = await scenarioA()
  const b = await scenarioB()
  const c = await scenarioC()
  console.log(JSON.stringify({ A: a, B: b, C: c }, null, 2))
  const checks = {
    'A: second caller shares the running sync': a.samePromise,
    'A: entry queued mid-sync was uploaded': a.submittedIds.includes('new'),
    'A: entry queued mid-sync ends synced': a.newStatus === 'synced',
    'B: aggregate reports the old failure': b.result.failed === 1,
    'B: new entry still synced': b.newStatus === 'synced',
    'B: old entry marked error': b.oldStatus === 'error',
    'C: failed row attempted once per run': c.attempts === 1 && c.retry_count === 1 && c.status === 'error',
  }
  let ok = true
  for (const [name, pass] of Object.entries(checks)) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`)
    ok = ok && pass
  }
  process.exit(ok ? 0 : 1)
})()
