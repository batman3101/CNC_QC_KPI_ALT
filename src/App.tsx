import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import { SnackbarProvider } from 'notistack'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InspectionPage } from '@/pages/InspectionPage'
import { DefectsPage } from '@/pages/DefectsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AIInsightsPage } from '@/pages/AIInsightsPage'
import { ManagementPage } from '@/pages/ManagementPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { MonitorPage } from '@/pages/MonitorPage'
import { SPCPage } from '@/pages/SPCPage'
import { useAuthStore } from '@/stores/authStore'
import { useFactoryStore } from '@/stores/factoryStore'
import { supabase } from '@/lib/supabase'
import { subscribeToRealtime, unsubscribeFromRealtime } from '@/services/realtimeService'
import { InstallPrompt } from '@/components/pwa'
import '@/i18n/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inspection" element={<InspectionPage />} />
        <Route path="/defects" element={<DefectsPage />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spc"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <SPCPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-insights"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AIInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
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
