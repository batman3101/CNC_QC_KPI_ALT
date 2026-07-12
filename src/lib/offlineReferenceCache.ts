/**
 * Reading the offline reference cache.
 *
 * Saving an inspection has always been offline-first: it goes into an IndexedDB
 * queue without waiting for the network. But everything you must choose *before*
 * you can save - model, process, machine, defect type, inspector - was read
 * straight from Supabase, and the query cache lives only in memory. So a reload,
 * or a cold start on a tablet that had lost wifi, left the form with no models
 * to pick and no way to begin. The reference cache existed for exactly this and
 * was refilled on every reconnect; it simply had no reader.
 *
 * Each function returns `null` when its table has never been filled, so callers
 * can tell "this device has no cached copy" apart from "the answer is empty".
 * Handing back [] for the first case would render as an empty dropdown, which
 * reads to an inspector as a broken configuration rather than a missing cache.
 */

import {
  offlineDb,
  type CachedProductModel,
  type CachedInspectionProcess,
  type CachedInspectionItem,
  type CachedDefectType,
  type CachedMachine,
  type CachedUser,
} from '@/lib/offlineDb'

/** The server orders every reference list newest-first; match it. */
function byCreatedAtDesc<T extends { created_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function cachedProductModels(): Promise<CachedProductModel[] | null> {
  const rows = await offlineDb.productModels.toArray()
  return rows.length > 0 ? byCreatedAtDesc(rows) : null
}

export async function cachedInspectionProcesses(): Promise<CachedInspectionProcess[] | null> {
  const rows = await offlineDb.inspectionProcesses.toArray()
  return rows.length > 0 ? byCreatedAtDesc(rows) : null
}

export async function cachedDefectTypes(): Promise<CachedDefectType[] | null> {
  const rows = await offlineDb.defectTypes.toArray()
  return rows.length > 0 ? byCreatedAtDesc(rows) : null
}

export async function cachedUsers(): Promise<CachedUser[] | null> {
  const rows = await offlineDb.users.toArray()
  return rows.length > 0 ? rows : null
}

/**
 * A model with no inspection items is a real answer, so emptiness is only
 * "uncached" when the whole table is empty.
 */
export async function cachedInspectionItems(
  modelId?: string
): Promise<CachedInspectionItem[] | null> {
  const total = await offlineDb.inspectionItems.count()
  if (total === 0) return null

  const rows = modelId
    ? await offlineDb.inspectionItems.where('model_id').equals(modelId).toArray()
    : await offlineDb.inspectionItems.toArray()

  return byCreatedAtDesc(rows)
}

/**
 * Same idea: a search that matches nothing is a real answer once machines are
 * cached at all.
 */
export async function cachedMachines(factoryId?: string): Promise<CachedMachine[] | null> {
  const total = await offlineDb.machines.count()
  if (total === 0) return null

  const rows = factoryId
    ? await offlineDb.machines.where('factory_id').equals(factoryId).toArray()
    : await offlineDb.machines.toArray()

  // The server only ever returns active machines; the cache is filled from that
  // same call, but filter anyway so a stale row cannot resurrect a retired one.
  return rows
    .filter((m) => m.status === 'active')
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}
