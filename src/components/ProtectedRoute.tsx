import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/types/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: PermissionKey
}

export function ProtectedRoute({
  children,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()
  const permissionState = usePermissions()

  if (isLoading || (requiredPermission && permissionState.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Fail closed: an RPC error or a missing permission never grants access.
  if (
    requiredPermission &&
    (permissionState.isError || !permissionState.hasPermission(requiredPermission))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">접근 거부</h1>
          <p className="mt-2 text-muted-foreground">
            이 페이지에 접근할 권한이 없습니다.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
