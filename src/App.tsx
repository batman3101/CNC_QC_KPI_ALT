import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { ManagementPage } from '@/pages/ManagementPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { useAuthStore } from '@/stores/authStore'
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
  const { profile, setLoading } = useAuthStore()

  // Initialize auth state on app load
  useEffect(() => {
    // Auth 초기화는 useAuth hook에서 처리
    // 여기서는 로딩 상태만 false로 설정
    setLoading(false)
  }, [setLoading])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

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
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ReportsPage />
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
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
