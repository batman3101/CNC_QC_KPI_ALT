/**
 * Offline Database with Dexie (IndexedDB wrapper)
 *
 * Holds two things:
 *  - the queue of inspections entered on this device but not yet uploaded, and
 *  - a cache of the reference data the inspection form needs to be fillable at
 *    all (models, processes, inspection items, defect types, machines, users).
 *
 * The reference cache stores each row exactly as the server returns it. It used
 * to keep a trimmed projection ({id, code, name, ...}), which meant a cached row
 * could not be handed back to the UI in place of a real one - so nothing ever
 * read the cache, and the whole thing was write-only.
 */

import Dexie, { type Table } from 'dexie'
import type { DefectPointEntry } from '@/types/spc'
import type { Database } from '@/types/database'
import type { DirectoryUser } from '@/services/userDirectoryService'

// Offline inspection record type
export interface OfflineInspection {
  id: string // UUID generated locally
  model_id: string
  model_code: string
  inspection_process_code: string
  inspection_process_name: string
  defect_type_id: string | null
  defect_type_name: string | null
  machine_id: string | null
  machine_name: string | null
  inspector_id: string
  inspector_name: string
  factory_id: string
  inspection_quantity: number
  defect_quantity: number
  photo_data: string | null // Base64 encoded
  notes: string | null
  defect_points: DefectPointEntry[] | null
  status: 'pending' | 'syncing' | 'synced' | 'error'
  created_at: string
  synced_at: string | null
  error_message: string | null
  retry_count: number
}

// Reference data is cached as whole server rows, so a cached read is
// indistinguishable from a live one to everything above the service layer.
export type CachedProductModel = Database['public']['Tables']['product_models']['Row']
export type CachedInspectionProcess = Database['public']['Tables']['inspection_processes']['Row']
export type CachedInspectionItem = Database['public']['Tables']['inspection_items']['Row']
export type CachedDefectType = Database['public']['Tables']['defect_types']['Row']
export type CachedMachine = Database['public']['Tables']['machines']['Row']
export type CachedUser = DirectoryUser

class OfflineDatabase extends Dexie {
  offlineInspections!: Table<OfflineInspection>
  productModels!: Table<CachedProductModel>
  inspectionProcesses!: Table<CachedInspectionProcess>
  inspectionItems!: Table<CachedInspectionItem>
  defectTypes!: Table<CachedDefectType>
  machines!: Table<CachedMachine>
  users!: Table<CachedUser>

  constructor() {
    super('CncQcKpiOfflineDb')

    this.version(2).stores({
      offlineInspections: 'id, status, created_at, inspector_id, factory_id',
      productModels: 'id, code, is_active',
      inspectionProcesses: 'id, code, is_active',
      defectTypes: 'id, code, is_active',
      machines: 'id, name, status, factory_id',
      users: 'id, email, role',
    })

    // v3 changes what a cached row *is* (whole row, not a projection) and adds
    // the two tables the form also needs but that were never cached:
    // inspection_items and users.
    //
    // Note the indexes no longer mention is_active. IndexedDB cannot use a
    // boolean as a key, so that index silently held nothing - which is why the
    // old cache getters queried `.where('is_active').equals(1)` and always came
    // back empty.
    this.version(3)
      .stores({
        offlineInspections: 'id, status, created_at, inspector_id, factory_id',
        productModels: 'id, code',
        inspectionProcesses: 'id, code',
        inspectionItems: 'id, model_id',
        defectTypes: 'id, code',
        machines: 'id, name, factory_id',
        users: 'id, role',
      })
      .upgrade(async (tx) => {
        // The v2 rows are trimmed projections. Handing one to the UI would give
        // it a half-built object, so drop them; the next online run refills the
        // cache with whole rows. The inspection queue is untouched.
        await Promise.all([
          tx.table('productModels').clear(),
          tx.table('inspectionProcesses').clear(),
          tx.table('defectTypes').clear(),
          tx.table('machines').clear(),
          tx.table('users').clear(),
        ])
      })
  }
}

export const offlineDb = new OfflineDatabase()

// Generate UUID for offline records
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Delete synced inspections older than 7 days. Called at the end of every
// successful sync - without it the queue is append-only and IndexedDB grows for
// as long as the tablet stays installed.
export async function cleanupSyncedInspections(): Promise<number> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString()

  const oldInspections = await offlineDb.offlineInspections
    .where('status')
    .equals('synced')
    .filter((inspection) => inspection.synced_at !== null && inspection.synced_at < cutoff)
    .toArray()

  const ids = oldInspections.map((i) => i.id)
  await offlineDb.offlineInspections.bulkDelete(ids)
  return ids.length
}
