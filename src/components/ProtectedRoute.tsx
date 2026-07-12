import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/types/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: PermissionKey
}

function CenteredMessage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold text-destructive">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {children && <div className="mt-6 flex justify-center gap-2">{children}</div>}
      </div>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({
  children,
  requiredPermission,
}: ProtectedRouteProps) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const profileStatus = useAuthStore((state) => state.profileStatus)
  const loadProfile = useAuthStore((state) => state.loadProfile)
  const logout = useAuthStore((state) => state.logout)
  const permissionState = usePermissions()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    logout()
  }

  if (isLoading) {
    return <Spinner label={t('common.loading')} />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profileStatus === 'idle' || profileStatus === 'loading') {
    return <Spinner label={t('common.loading')} />
  }

  // Authenticated but no public.users row: every RLS helper resolves to false,
  // so the account can reach nothing. Only an administrator can resolve this,
  // which is why no retry is offered here.
  if (profileStatus === 'missing') {
    return (
      <CenteredMessage
        title={t('auth.profileMissingTitle')}
        description={t('auth.profileMissingDescription')}
      >
        <Button variant="outline" onClick={handleSignOut}>
          {t('auth.logout')}
        </Button>
      </CenteredMessage>
    )
  }

  if (profileStatus === 'error') {
    return (
      <CenteredMessage
        title={t('auth.profileErrorTitle')}
        description={t('auth.profileErrorDescription')}
      >
        <Button onClick={() => loadProfile(user.id)}>{t('common.retry')}</Button>
        <Button variant="outline" onClick={handleSignOut}>
          {t('auth.logout')}
        </Button>
      </CenteredMessage>
    )
  }

  if (requiredPermission && permissionState.isLoading) {
    return <Spinner label={t('common.loading')} />
  }

  // Fail closed: an RPC error or a missing permission never grants access.
  if (
    requiredPermission &&
    (permissionState.isError || !permissionState.hasPermission(requiredPermission))
  ) {
    return (
      <CenteredMessage
        title={t('auth.accessDeniedTitle')}
        description={t('auth.accessDeniedDescription')}
      />
    )
  }

  return <>{children}</>
}
