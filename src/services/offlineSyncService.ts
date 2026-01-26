/**
 * Offline Sync Service
 * Manages offline data storage and synchronization with Supabase
 */

import {
  offlineDb,
  generateOfflineId,
  type OfflineInspection,
  type CachedProductModel,
  type CachedInspectionProcess,
  type CachedDefectType,
  type CachedMachine,
} from '@/lib/offlineDb'
import * as inspectionService from '@/services/inspectionService'
import * as managementService from '@/services/managementService'

// Check online status
export function isOnline(): boolean {
  return navigator.onLine
}

// Input type for creating offline inspection
export interface OfflineInspectionInput {
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
  photo_data: string | null
  notes: string | null
}

// Save inspection offline
export async function saveInspectionOffline(
  data: OfflineInspectionInput
): Promise<OfflineInspection> {
  const inspection: OfflineInspection = {
    ...data,
    id: generateOfflineId(),
    status: 'pending',
    created_at: new Date().toISOString(),
    synced_at: null,
    error_message: null,
    retry_count: 0,
  }

  await offlineDb.offlineInspections.add(inspection)
  return inspection
}

// Get pending inspections count
export async function getPendingCount(): Promise<number> {
  return offlineDb.offlineInspections
    .where('status')
    .anyOf(['pending', 'error'])
    .count()
}

// Sync all pending inspections
export async function syncPendingInspections(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  if (!isOnline()) {
    return { success: 0, failed: 0, errors: ['Offline'] }
  }

  const pending = await offlineDb.offlineInspections
    .where('status')
    .anyOf(['pending', 'error'])
    .filter((i) => i.retry_count < 3) // Skip items that failed too many times
    .toArray()

  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const inspection of pending) {
    try {
      // Update status to syncing
      await offlineDb.offlineInspections.update(inspection.id, { status: 'syncing' })

      // Submit to server
      await inspectionService.createInspectionRecord({
        model_id: inspection.model_id,
        inspection_process: {
          code: inspection.inspection_process_code,
          name: inspection.inspection_process_name,
        },
        defect_type_id: inspection.defect_type_id,
        machine_id: inspection.machine_id || null,
        machine_number: inspection.machine_name,
        inspector_id: inspection.inspector_id,
        inspection_quantity: inspection.inspection_quantity,
        defect_quantity: inspection.defect_quantity,
        photo_url: inspection.photo_data,
      })

      // Mark as synced
      await offlineDb.offlineInspections.update(inspection.id, {
        status: 'synced',
        synced_at: new Date().toISOString(),
        error_message: null,
      })

      success++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await offlineDb.offlineInspections.update(inspection.id, {
        status: 'error',
        error_message: errorMessage,
        retry_count: inspection.retry_count + 1,
      })
      failed++
      errors.push(`${inspection.id}: ${errorMessage}`)
    }
  }

  return { success, failed, errors }
}

// Cache reference data for offline use
export async function cacheReferenceData(): Promise<void> {
  if (!isOnline()) return

  try {
    const now = new Date().toISOString()

    // Fetch all reference data in parallel
    const [models, processes, defectTypes, machines] = await Promise.all([
      managementService.getProductModels(),
      managementService.getInspectionProcesses(),
      managementService.getDefectTypesRows(),
      managementService.getMachines(),
    ])

    // Clear and repopulate caches
    await offlineDb.productModels.clear()
    await offlineDb.productModels.bulkAdd(
      models.map((m): CachedProductModel => ({
        id: m.id,
        code: m.code,
        name: m.name,
        is_active: true, // product_models don't have is_active, assume all are active
        cached_at: now,
      }))
    )

    await offlineDb.inspectionProcesses.clear()
    await offlineDb.inspectionProcesses.bulkAdd(
      processes.map((p): CachedInspectionProcess => ({
        id: p.id,
        code: p.code,
        name: p.name,
        is_active: p.is_active,
        cached_at: now,
      }))
    )

    await offlineDb.defectTypes.clear()
    await offlineDb.defectTypes.bulkAdd(
      defectTypes.map((d): CachedDefectType => ({
        id: d.id,
        code: d.code,
        name: d.name,
        severity: d.severity,
        is_active: d.is_active,
        cached_at: now,
      }))
    )

    await offlineDb.machines.clear()
    await offlineDb.machines.bulkAdd(
      machines.map((m): CachedMachine => ({
        id: m.id,
        name: m.name,
        model: m.model || null,
        status: m.status,
        cached_at: now,
      }))
    )

    console.log('[OfflineSync] Reference data cached successfully')
  } catch (error) {
    console.error('[OfflineSync] Failed to cache reference data:', error)
  }
}

// Get cached product models
export async function getCachedProductModels(): Promise<CachedProductModel[]> {
  return offlineDb.productModels
    .where('is_active')
    .equals(1)
    .toArray()
}

// Get cached inspection processes
export async function getCachedInspectionProcesses(): Promise<CachedInspectionProcess[]> {
  return offlineDb.inspectionProcesses
    .where('is_active')
    .equals(1)
    .toArray()
}

// Get cached defect types
export async function getCachedDefectTypes(): Promise<CachedDefectType[]> {
  return offlineDb.defectTypes
    .where('is_active')
    .equals(1)
    .toArray()
}

// Get cached machines
export async function getCachedMachines(): Promise<CachedMachine[]> {
  return offlineDb.machines.toArray()
}

// Check if reference data is cached
export async function hasReferenceData(): Promise<boolean> {
  const count = await offlineDb.productModels.count()
  return count > 0
}

// Get cache timestamp
export async function getCacheTimestamp(): Promise<string | null> {
  const model = await offlineDb.productModels.limit(1).first()
  return model?.cached_at || null
}
