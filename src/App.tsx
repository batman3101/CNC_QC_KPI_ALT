import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { isOnline } from '@/lib/network'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { MonitorPage } from '@/pages/MonitorPage'
import { useAuthStore } from '@/stores/authStore'
import { useFactoryStore } from '@/stores/factoryStore'
import { supabase } from '@/lib/supabase'
import { subscribeToRealtime, unsubscribeFromRealtime } from '@/services/realtimeService'
import { InstallPrompt } from '@/components/pwa'
import { usePermissions } from '@/hooks/usePermissions'
import { PERMISSION_KEYS, PERMISSION_ROUTES, type PermissionKey } from '@/types/permissions'
import '@/i18n/config'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const InspectionPage = lazy(() => import('@/pages/InspectionPage').then((module) => ({ default: module.InspectionPage })))
const DefectsPage = lazy(() => import('@/pages/DefectsPage').then((module) => ({ default: module.DefectsPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage').then((module) => ({ default: module.AIInsightsPage })))
const ManagementPage = lazy(() => import('@/pages/ManagementPage').then((module) => ({ default: module.ManagementPage })))
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage').then((module) => ({ default: module.UserManagementPage })))
const SPCPage = lazy(() => import('@/pages/SPCPage').then((module) => ({ default: module.SPCPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      // Default is 'online', which does not merely fail a query while offline -
      // it never calls the queryFn at all, parking the query in fetchStatus
      // 'paused'. Every screen then sits on a loading spinner forever, and the
      // services' offline fallbacks (which read the IndexedDB cache and would
      // have answered fine) are never reached.
      //
      // 'offlineFirst' runs the queryFn once regardless, which is exactly right
      // here: the reads the inspection form depends on can be served from cache
      // without a network. Queries that genuinely need the server still fail,
      // and refetchOnReconnect brings them back when the network returns.
      //
      // Mutations are deliberately left on 'online': they must reach the server,
      // so pausing them until it is reachable is the correct behaviour.
      networkMode: 'offlineFirst',
    },
  },
})

function FirstAllowedRoute() {
  const { t } = useTranslation()
  const { hasPermission, isLoading, isError } = usePermissions()

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">{t('common.loading')}</div>
  }

  const firstPermission = PERMISSION_KEYS.find(hasPermission)
  if (firstPermission) {
    return <Navigate to={PERMISSION_ROUTES[firstPermission]} replace />
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-center">
      <div>
        <h1 className="text-2xl font-bold text-destructive">{t('auth.accessDeniedTitle')}</h1>
        <p className="mt-2 text-muted-foreground">
          {isError ? t('auth.permissionLoadFailed') : t('auth.noAccessibleFeatures')}
        </p>
      </div>
    </div>
  )
}

function permissionRoute(permission: PermissionKey, page: React.ReactNode) {
  return <ProtectedRoute requiredPermission={permission}>{page}</ProtectedRoute>
}

function AppRoutes() {
  const { profile, user, setUser, setLoading, loadProfile, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const { activeFactoryId } = useFactoryStore()

  // Single auth bootstrap for the app. useAuth() deliberately does not run its
  // own session restore: two competing bootstraps used to race here, and the
  // one that lost silently dropped profile-load failures.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id)
        } else if (isOnline()) {
          logout()
        } else {
          // Offline with no readable session. Deliberately not logout(): that
          // clears the persisted profile and the cached permissions, which are
          // the only things that let this device work offline - and being
          // offline, it could not fetch them back. Leave the stored state alone;
          // the next start with a network restores the session.
          console.warn('[Offline] No readable session at startup — keeping stored profile')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Same reasoning: a failure here while offline is a network failure, not
        // a sign-out.
        if (isOnline()) logout()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Auth 상태 변화 리스너
    //
    // supabase-js invokes this callback while it still holds the auth lock, and
    // every PostgREST call re-enters getSession() to mint an Authorization
    // header. Awaiting a query here therefore deadlocks the client: the query
    // waits for a lock the callback itself is holding, getSession() never
    // returns, and the app hangs on its loading spinner with no request ever
    // leaving the browser. Defer any Supabase work to a later task so the lock
    // is released first.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          logout()
          unsubscribeFromRealtime()
          return
        }

        if (!session?.user) return

        setUser(session.user)

        // TOKEN_REFRESHED fires on a timer and carries no profile change, so
        // the profile is only reloaded when the identity itself changes.
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const userId = session.user.id
          setTimeout(() => {
            loadProfile(userId)
          }, 0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, loadProfile, logout])

  // Realtime 구독 - 로그인 상태에서만
  useEffect(() => {
    if (user) {
      subscribeToRealtime(queryClient, activeFactoryId)
    }

    return () => {
      unsubscribeFromRealtime()
    }
  }, [user, queryClient, activeFactoryId])

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/monitor" element={<MonitorPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout userName={profile?.name} userRole={profile?.role} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FirstAllowedRoute />} />
        <Route path="/dashboard" element={permissionRoute('dashboard', <DashboardPage />)} />
        <Route path="/inspection" element={permissionRoute('inspection', <InspectionPage />)} />
        <Route path="/defects" element={permissionRoute('defects', <DefectsPage />)} />
        <Route path="/analytics" element={permissionRoute('analytics', <AnalyticsPage />)} />
        <Route path="/spc" element={permissionRoute('spc', <SPCPage />)} />
        <Route path="/reports" element={permissionRoute('reports', <ReportsPage />)} />
        <Route path="/ai-insights" element={permissionRoute('aiInsights', <AIInsightsPage />)} />
        <Route path="/management" element={permissionRoute('management', <ManagementPage />)} />
        <Route path="/users" element={permissionRoute('userManagement', <UserManagementPage />)} />
      </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <AppRoutes />
            <InstallPrompt />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
