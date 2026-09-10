/**
 * Offline Sync Service
 * Manages offline data storage and synchronization with Supabase
 */

import {
  offlineDb,
  generateOfflineId,
  cleanupSyncedInspections,
  type OfflineInspection,
} from '@/lib/offlineDb'
import * as inspectionService from '@/services/inspectionService'
import * as managementService from '@/services/managementService'
import { isOnline } from '@/lib/network'
import type { DefectPointEntry } from '@/types/spc'
import imageCompression from 'browser-image-compression'

// isOnline moved to lib/network so managementService can consult it without
// importing this module, which imports managementService. Re-exported here so
// existing callers keep working.
export { isOnline }

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

/**
 * Status of one queued inspection, or null if the row is gone.
 *
 * The page that just queued an entry reports success from THIS, not from the
 * aggregate sync result: a sync that was already running when the entry was
 * queued may have finished without ever touching it, and a sync that did save
 * it may still report failures for older rows.
 */
export async function getQueuedInspectionStatus(
  id: string
): Promise<OfflineInspection['status'] | null> {
  const row = await offlineDb.offlineInspections.get(id)
  return row?.status ?? null
}

/**
 * The sync currently running, if any.
 *
 * useNetworkStatus() is mounted twice (OfflineIndicator and MobileBottomNav),
 * so an 'online' event used to start two syncs at once. Both read the same
 * pending rows before either flipped them to 'syncing', and every queued
 * inspection was uploaded twice. Callers now share one run.
 */
let inFlightSync: Promise<{ success: number; failed: number; errors: string[] }> | null = null

// Sync all pending inspections
export function syncPendingInspections(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  if (!isOnline()) {
    return Promise.resolve({ success: 0, failed: 0, errors: ['Offline'] })
  }

  if (inFlightSync) return inFlightSync

  inFlightSync = runSync().finally(() => {
    inFlightSync = null
  })
  return inFlightSync
}

async function runSync(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  // Reclaim orphans: a row is flipped to 'syncing' before its upload, and every
  // pending query looks only at 'pending'/'error'. If the tab was closed mid
  // upload the row was stranded in 'syncing' forever - never retried, never
  // counted, never sent. No other sync can be running here (see the guard
  // above), so anything still 'syncing' is left over from a previous page load.
  const orphans = await offlineDb.offlineInspections
    .where('status')
    .equals('syncing')
    .toArray()

  if (orphans.length > 0) {
    console.warn(`[OfflineSync] Reclaiming ${orphans.length} interrupted upload(s)`)
    await offlineDb.offlineInspections.bulkUpdate(
      orphans.map((o) => ({ key: o.id, changes: { status: 'pending' as const } }))
    )
  }

  let success = 0
  let failed = 0
  const errors: string[] = []

  // Drain the queue rather than process one snapshot of it. The list used to
  // be read once at the start, so an entry queued while this run was already
  // uploading was skipped - and the caller who queued it, having joined this
  // run's promise, was told everything succeeded. Later passes read 'pending'
  // only: an item that failed in this run is already 'error' and must wait for
  // the next run, not be retried three times in a row here.
  let pass = 0
  for (;;) {
    const pending = await offlineDb.offlineInspections
      .where('status')
      .anyOf(pass === 0 ? ['pending', 'error'] : ['pending'])
      .filter((i) => i.retry_count < 3) // Skip items that failed too many times
      .toArray()
    if (pending.length === 0) break
    pass += 1

    for (const inspection of pending) {
      try {
        // Update status to syncing
        await offlineDb.offlineInspections.update(inspection.id, { status: 'syncing' })

        // Upload photo (stored as Base64 offline) now that we're online. The URL
        // is written back to the queue row at once, so a retry after a stop
        // between upload and save does not push the same file a second time.
        let photoUrl: string | null = inspection.photo_url ?? null
        if (!photoUrl && inspection.photo_data) {
          const file = dataUrlToFile(inspection.photo_data, `${inspection.id}.jpg`)
          photoUrl = await inspectionService.uploadDefectPhoto(file, inspection.id)
          await offlineDb.offlineInspections.update(inspection.id, { photo_url: photoUrl })
        }

        // One request, one transaction: inspection + measured points + defect
        // record land together or not at all. The queue id goes along as the
        // idempotency key, so replaying this row (reclaimed 'syncing', or a
        // retry after 'error') returns the inspection it already created
        // instead of inserting a second one.
        await inspectionService.submitInspectionRecord({
          clientRef: inspection.id,
          userId: inspection.inspector_id,
          machineId: inspection.machine_id,
          modelId: inspection.model_id,
          inspectionProcess: inspection.inspection_process_code,
          inspectionQuantity: inspection.inspection_quantity,
          defectQuantity: inspection.defect_quantity,
          results: (inspection.defect_points ?? []).map((p) => ({
            itemId: p.item_id,
            measuredValue: p.measured_value ?? 0,
            result: 'fail' as const,
          })),
          defectType: inspection.defect_type_id,
          photoUrl,
          factoryId: inspection.factory_id,
        })

        // Mark as synced. The photo is now in Supabase Storage, so drop the local
        // Base64 copy - it is the bulkiest field on the row (up to ~0.5MB) and
        // keeping it duplicates what the server already has.
        await offlineDb.offlineInspections.update(inspection.id, {
          status: 'synced',
          synced_at: new Date().toISOString(),
          error_message: null,
          photo_data: null,
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
  }

  // Synced rows were marked and then kept forever: nothing ever called the
  // cleanup, so IndexedDB grew without bound on a shared factory tablet.
  if (success > 0) {
    try {
      const removed = await cleanupSyncedInspections()
      if (removed > 0) {
        console.info(`[OfflineSync] Removed ${removed} synced record(s) older than 7 days`)
      }
    } catch (error) {
      // Housekeeping must never fail the sync it follows.
      console.warn('[OfflineSync] Cleanup of old synced records failed:', error)
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
    // Fetch all reference data in parallel. This must complete before the
    // transaction below opens: awaiting a non-Dexie promise inside a Dexie
    // transaction commits it early.
    //
    // inspectionItems and users are new here. Without them the form could pick a
    // model offline but not measure anything against it, and an admin could not
    // choose which inspector the record belongs to - so caching the other four
    // still left the page unusable.
    const [models, processes, items, defectTypes, machines, users] = await Promise.all([
      managementService.getProductModels(),
      managementService.getInspectionProcesses(),
      managementService.getInspectionItems(),
      managementService.getDefectTypesRows(),
      managementService.getMachines(factoryId),
      managementService.getUsers(),
    ])

    // One transaction for the whole swap: clear() and the repopulate used to be
    // separate transactions, so a second run could insert rows in between and
    // the first one's bulkAdd would then collide on the primary key. bulkPut
    // also makes the write idempotent rather than throwing BulkError on a
    // duplicate id.
    await offlineDb.transaction(
      'rw',
      [
        offlineDb.productModels,
        offlineDb.inspectionProcesses,
        offlineDb.inspectionItems,
        offlineDb.defectTypes,
        offlineDb.machines,
        offlineDb.users,
      ],
      async () => {
        await offlineDb.productModels.clear()
        await offlineDb.productModels.bulkPut(models)

        await offlineDb.inspectionProcesses.clear()
        await offlineDb.inspectionProcesses.bulkPut(processes)

        await offlineDb.inspectionItems.clear()
        await offlineDb.inspectionItems.bulkPut(items)

        await offlineDb.defectTypes.clear()
        await offlineDb.defectTypes.bulkPut(defectTypes)

        await offlineDb.machines.clear()
        await offlineDb.machines.bulkPut(machines)

        await offlineDb.users.clear()
        await offlineDb.users.bulkPut(users)
      }
    )

    console.log(
      `[OfflineSync] Reference data cached: ${models.length} models, ${processes.length} processes, ` +
        `${items.length} items, ${defectTypes.length} defect types, ${machines.length} machines, ${users.length} users`
    )
  } catch (error) {
    console.error('[OfflineSync] Failed to cache reference data:', error)
  }
}
