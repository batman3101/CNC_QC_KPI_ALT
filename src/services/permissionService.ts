import { supabase } from '@/lib/supabase'
import { isOnline } from '@/lib/network'
import { rememberPermissions, recallPermissions } from '@/lib/permissionCache'
import type { UserRole } from '@/stores/authStore'
import type { PermissionKey } from '@/types/permissions'
import type { Json } from '@/types/database'

export interface RolePermission {
  factory_id: string
  role: UserRole
  feature_key: PermissionKey
  allowed: boolean
  updated_at: string | null
  updated_by: string | null
}

export interface PermissionChange {
  role: Extract<UserRole, 'manager' | 'inspector'>
  feature_key: PermissionKey
  allowed: boolean
}

export const permissionQueryKeys = {
  all: ['permissions'] as const,
  mine: (userId?: string, role?: UserRole, factoryId?: string | null) =>
    [...permissionQueryKeys.all, 'mine', userId, role, factoryId] as const,
  roles: (factoryId: string | null) => [...permissionQueryKeys.all, 'roles', factoryId] as const,
}

export const permissionService = {
  /**
   * The route guard fails closed, so offline this used to deny every screen -
   * including the inspection form, which is the one thing a disconnected tablet
   * still needs to do. Offline we answer from the last set the server gave this
   * user; the server re-decides for real when the queued work syncs.
   */
  async getMyPermissions(userId: string): Promise<PermissionKey[]> {
    if (!isOnline()) {
      const cached = recallPermissions(userId)
      if (cached === null) {
        throw new Error('Permissions: offline and no cached copy for this user')
      }
      console.info('[Offline] Permissions: served from cache')
      return cached
    }

    const { data, error } = await supabase.rpc('get_my_permissions')
    if (error) throw error

    const permissions = (data ?? []).map((row) => row.feature_key as PermissionKey)
    rememberPermissions(userId, permissions)
    return permissions
  },

  async getRolePermissions(factoryId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase.rpc('get_role_permissions', {
      p_factory_id: factoryId,
    })
    if (error) throw error
    return (data ?? []) as RolePermission[]
  },

  async setRolePermissions(factoryId: string, changes: PermissionChange[]): Promise<void> {
    const { error } = await supabase.rpc('set_role_permissions', {
      p_factory_id: factoryId,
      p_changes: changes as unknown as Json,
    })
    if (error) throw error
  },
}
