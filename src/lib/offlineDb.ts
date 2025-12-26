/**
 * Offline Database with Dexie (IndexedDB wrapper)
 * Stores inspections for offline use and caches reference data
 */

import Dexie, { type Table } from 'dexie'

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
  inspection_quantity: number
  defect_quantity: number
  photo_data: string | null // Base64 encoded
  notes: string | null
  status: 'pending' | 'syncing' | 'synced' | 'error'
  created_at: string
  synced_at: string | null
  error_message: string | null
  retry_count: number
}

// Cached reference data types
export interface CachedProductModel {
  id: string
  code: string
  name: string
  is_active: boolean
  cached_at: string
}

export interface CachedInspectionProcess {
  id: string
  code: string
  name: string
  is_active: boolean
  cached_at: string
}

export interface CachedDefectType {
  id: string
  code: string
  name: string
  severity: string
  is_active: boolean
  cached_at: string
}

export interface CachedMachine {
  id: string
  name: string
  model: string | null
  status: string
  cached_at: string
}

export interface CachedUser {
  id: string
  name: string
  email: string
  role: string
  cached_at: string
}

class OfflineDatabase extends Dexie {
  offlineInspections!: Table<OfflineInspection>
  productModels!: Table<CachedProductModel>
  inspectionProcesses!: Table<CachedInspectionProcess>
  defectTypes!: Table<CachedDefectType>
  machines!: Table<CachedMachine>
  users!: Table<CachedUser>

  constructor() {
    super('CncQcKpiOfflineDb')

    this.version(1).stores({
      offlineInspections: 'id, status, created_at, inspector_id',
      productModels: 'id, code, is_active',
      inspectionProcesses: 'id, code, is_active',
      defectTypes: 'id, code, is_active',
      machines: 'id, name, status',
      users: 'id, email, role',
    })
  }
}

export const offlineDb = new OfflineDatabase()

// Generate UUID for offline records
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Clear all cached data
export async function clearAllCachedData(): Promise<void> {
  await Promise.all([
    offlineDb.productModels.clear(),
    offlineDb.inspectionProcesses.clear(),
    offlineDb.defectTypes.clear(),
    offlineDb.machines.clear(),
    offlineDb.users.clear(),
  ])
}

// Get pending inspections
export async function getPendingInspections(): Promise<OfflineInspection[]> {
  return offlineDb.offlineInspections
    .where('status')
    .anyOf(['pending', 'error'])
    .toArray()
}

// Get synced inspections (for display)
export async function getSyncedInspections(): Promise<OfflineInspection[]> {
  return offlineDb.offlineInspections
    .where('status')
    .equals('synced')
    .reverse()
    .limit(50)
    .toArray()
}

// Delete synced inspections older than 7 days
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
