import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Suspense, lazy, useEffect } from 'react'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider } from '@/contexts/ThemeContext'
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
    },
  },
})

function FirstAllowedRoute() {
  const { hasPermission, isLoading, isError } = usePermissions()

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>
  }

  const firstPermission = PERMISSION_KEYS.find(hasPermission)
  if (firstPermission) {
    return <Navigate to={PERMISSION_ROUTES[firstPermission]} replace />
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-center">
      <div>
        <h1 className="text-2xl font-bold text-destructive">접근 거부</h1>
        <p className="mt-2 text-muted-foreground">
          {isError ? '권한 정보를 불러오지 못했습니다.' : '접근 가능한 기능이 없습니다.'}
        </p>
      </div>
    </div>
  )
}

function permissionRoute(permission: PermissionKey, page: React.ReactNode) {
  return <ProtectedRoute requiredPermission={permission}>{page}</ProtectedRoute>
}

function AppRoutes() {
  const { profile, user, setUser, setProfile, setLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const { activeFactoryId } = useFactoryStore()

  // Initialize auth state on app load - 세션 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Supabase 세션 확인
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // 프로필 정보 가져오기
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            const factoryId = (userData as { factory_id: string | null }).factory_id
            setProfile({
              id: (userData as { id: string }).id,
              email: (userData as { email: string }).email,
              name: (userData as { name: string }).name,
              role: (userData as { role: 'admin' | 'manager' | 'inspector' }).role,
              factory_id: factoryId,
            })
            useFactoryStore.getState().initializeFromUser(factoryId)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          unsubscribeFromRealtime()
        } else if (session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading])

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
