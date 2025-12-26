/**
 * Network Status Hook
 * Tracks online/offline status and manages sync operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getPendingCount,
  syncPendingInspections,
  cacheReferenceData,
  isOnline as checkOnline,
} from '@/services/offlineSyncService'

export interface NetworkStatus {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncResult: { success: number; failed: number } | null
  lastSyncTime: Date | null
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncResult: null,
    lastSyncTime: null,
  })

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setStatus((prev) => ({ ...prev, pendingCount: count }))
    } catch (error) {
      console.error('[NetworkStatus] Failed to get pending count:', error)
    }
  }, [])

  // Sync pending inspections
  const sync = useCallback(async () => {
    if (!checkOnline() || status.isSyncing) return

    setStatus((prev) => ({ ...prev, isSyncing: true }))

    try {
      const result = await syncPendingInspections()
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: { success: result.success, failed: result.failed },
        lastSyncTime: new Date(),
      }))
      await updatePendingCount()

      if (result.errors.length > 0) {
        console.warn('[NetworkStatus] Sync errors:', result.errors)
      }
    } catch (error) {
      console.error('[NetworkStatus] Sync failed:', error)
      setStatus((prev) => ({ ...prev, isSyncing: false }))
    }
  }, [status.isSyncing, updatePendingCount])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[NetworkStatus] Online')
      setStatus((prev) => ({ ...prev, isOnline: true }))

      // Auto-sync when coming online
      try {
        await cacheReferenceData()
        await syncPendingInspections()
        await updatePendingCount()
      } catch (error) {
        console.error('[NetworkStatus] Auto-sync error:', error)
      }
    }

    const handleOffline = () => {
      console.log('[NetworkStatus] Offline')
      setStatus((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial load
    updatePendingCount()
    if (checkOnline()) {
      cacheReferenceData().catch(console.error)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updatePendingCount])

  // Periodic sync check (every 5 minutes when online)
  useEffect(() => {
    if (!status.isOnline) return

    const interval = setInterval(() => {
      if (status.pendingCount > 0 && !status.isSyncing) {
        sync()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [status.isOnline, status.pendingCount, status.isSyncing, sync])

  return {
    ...status,
    sync,
    updatePendingCount,
    refreshCache: cacheReferenceData,
  }
}
