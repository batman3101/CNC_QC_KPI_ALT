/**
 * Last-known permission set, so a route guard can still answer offline.
 *
 * Offline this only decides which screens render. It grants nothing: every write
 * an inspector makes goes into the local queue and is replayed later against a
 * real session, where Postgres RLS has the final say. The server remains the
 * authority; this is a convenience so a tablet that lost wifi does not fail
 * closed into "access denied" while an inspector is standing at the machine.
 *
 * Scoped to a user id because these tablets are shared - without that, the next
 * person to open the app offline would inherit the last person's permissions.
 */

import type { PermissionKey } from '@/types/permissions'

const STORAGE_KEY = 'permissions-cache'

interface CachedPermissions {
  userId: string
  permissions: PermissionKey[]
  cachedAt: string
}

export function rememberPermissions(userId: string, permissions: PermissionKey[]): void {
  try {
    const payload: CachedPermissions = {
      userId,
      permissions,
      cachedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    // A full or blocked localStorage must not break a successful permission read.
    console.warn('[Permissions] Could not cache permissions:', error)
  }
}

export function recallPermissions(userId: string): PermissionKey[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw) as CachedPermissions
    if (cached.userId !== userId) return null

    return cached.permissions
  } catch {
    return null
  }
}

export function forgetPermissions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do - a stale entry is discarded on the next user-id mismatch.
  }
}
