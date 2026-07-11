import { supabase } from '@/lib/supabase'
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
  async getMyPermissions(): Promise<PermissionKey[]> {
    const { data, error } = await supabase.rpc('get_my_permissions')
    if (error) throw error
    return (data ?? []).map((row) => row.feature_key as PermissionKey)
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
