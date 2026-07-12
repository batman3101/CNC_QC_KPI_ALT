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
import type { DefectPointEntry } from '@/types/spc'
import imageCompression from 'browser-image-compression'

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
  defect_points: DefectPointEntry[] | null
  factory_id: string
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

// File → compressed Base64 dataURL (for offline storage; no network)
export async function compressImageToBase64(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(compressed)
  })
}

// Base64 dataURL → File (for upload at sync time)
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
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

      // Upload photo (stored as Base64 offline) now that we're online
      let photoUrl: string | null = null
      if (inspection.photo_data) {
        const file = dataUrlToFile(inspection.photo_data, `${inspection.id}.jpg`)
        photoUrl = await inspectionService.uploadDefectPhoto(file, inspection.id)
      }

      if (inspection.defect_points && inspection.defect_points.length > 0) {
        // 측정 공정: inspections + inspection_results(불량 포인트) 기록
        await inspectionService.submitInspection({
          userId: inspection.inspector_id,
          machineId: inspection.machine_id || undefined,
          modelId: inspection.model_id,
          inspectionProcess: inspection.inspection_process_code,
          inspectionQuantity: inspection.inspection_quantity,
          defectQuantity: inspection.defect_quantity,
          results: inspection.defect_points.map((p) => ({
            itemId: p.item_id,
            measuredValue: p.measured_value ?? 0,
            result: 'fail' as const,
          })),
          defectType: inspection.defect_type_id || undefined,
          photoUrl: photoUrl || undefined,
          factoryId: inspection.factory_id || undefined,
        })
      } else {
        // 카운트 기반 경로
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
          photo_url: photoUrl,
          factory_id: inspection.factory_id,
        })
      }

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

/**
 * Runs of cacheReferenceData that are still in flight, keyed by factory.
 *
 * useNetworkStatus() calls cacheReferenceData() on mount, and both
 * OfflineIndicator and MobileBottomNav use that hook, so every page load used
 * to start two concurrent runs (four under StrictMode's double-mount). Callers
 * for the same factory now share a single run instead of racing each other.
 */
const inFlightCacheRuns = new Map<string, Promise<void>>()

// Cache reference data for offline use
export function cacheReferenceData(factoryId?: string): Promise<void> {
  if (!isOnline()) return Promise.resolve()

  const key = factoryId ?? ''
  const existing = inFlightCacheRuns.get(key)
  if (existing) return existing

  const run = runCacheReferenceData(factoryId).finally(() => {
    inFlightCacheRuns.delete(key)
  })
  inFlightCacheRuns.set(key, run)
  return run
}

async function runCacheReferenceData(factoryId?: string): Promise<void> {
  try {
    const now = new Date().toISOString()

    // Fetch all reference data in parallel. This must complete before the
    // transaction below opens: awaiting a non-Dexie promise inside a Dexie
    // transaction commits it early.
    const [models, processes, defectTypes, machines] = await Promise.all([
      managementService.getProductModels(),
      managementService.getInspectionProcesses(),
      managementService.getDefectTypesRows(),
      managementService.getMachines(factoryId),
    ])

    const cachedModels = models.map((m): CachedProductModel => ({
      id: m.id,
      code: m.code,
      name: m.name,
      is_active: true, // product_models don't have is_active, assume all are active
      cached_at: now,
    }))

    const cachedProcesses = processes.map((p): CachedInspectionProcess => ({
      id: p.id,
      code: p.code,
      name: p.name,
      is_active: p.is_active,
      cached_at: now,
    }))

    const cachedDefectTypes = defectTypes.map((d): CachedDefectType => ({
      id: d.id,
      code: d.code,
      name: d.name,
      severity: d.severity,
      is_active: d.is_active,
      cached_at: now,
    }))

    const cachedMachines = machines.map((m): CachedMachine => ({
      id: m.id,
      name: m.name,
      model: m.model || null,
      status: m.status,
      factory_id: (m as unknown as { factory_id?: string }).factory_id || factoryId || '',
      cached_at: now,
    }))

    // One transaction for the whole swap: clear() and the repopulate used to be
    // separate transactions, so a second run could insert rows in between and
    // the first one's bulkAdd would then collide on the primary key. bulkPut
    // also makes the write idempotent rather than throwing BulkError on a
    // duplicate id.
    await offlineDb.transaction(
      'rw',
      offlineDb.productModels,
      offlineDb.inspectionProcesses,
      offlineDb.defectTypes,
      offlineDb.machines,
      async () => {
        await offlineDb.productModels.clear()
        await offlineDb.productModels.bulkPut(cachedModels)

        await offlineDb.inspectionProcesses.clear()
        await offlineDb.inspectionProcesses.bulkPut(cachedProcesses)

        await offlineDb.defectTypes.clear()
        await offlineDb.defectTypes.bulkPut(cachedDefectTypes)

        await offlineDb.machines.clear()
        await offlineDb.machines.bulkPut(cachedMachines)
      }
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
export async function getCachedMachines(factoryId?: string): Promise<CachedMachine[]> {
  if (factoryId) {
    return offlineDb.machines.where('factory_id').equals(factoryId).toArray()
  }
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
