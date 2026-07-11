import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { permissionQueryKeys, permissionService } from '@/services/permissionService'
import type { PermissionKey } from '@/types/permissions'

export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const query = useQuery({
    queryKey: permissionQueryKeys.mine(user?.id, profile?.role, profile?.factory_id),
    queryFn: permissionService.getMyPermissions,
    enabled: Boolean(user && profile),
    staleTime: 60_000,
  })

  const permissions = useMemo(
    () => new Set<PermissionKey>(query.data ?? []),
    [query.data]
  )

  return {
    permissions,
    hasPermission: (permission: PermissionKey) => permissions.has(permission),
    isLoading: Boolean(user && profile) && query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
