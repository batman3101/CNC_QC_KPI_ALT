import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InspectionPage } from '@/pages/InspectionPage'
import { DefectsPage } from '@/pages/DefectsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ManagementPage } from '@/pages/ManagementPage'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
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
  const { profile, setUser, setProfile, setLoading } = useAuthStore()

  // Initialize auth state on app load
  useEffect(() => {
    // Check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)

        // TODO: Remove this mock user when Supabase is connected
        // For development without Supabase, auto-login as mock admin
        if (!session?.user) {
          const mockUser = {
            id: 'mock-admin-001',
            email: 'admin@test.com',
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
          } as any

          setUser(mockUser)

          // Set mock profile
          if (!profile) {
            const mockProfile = {
              id: 'mock-admin-001',
              email: 'admin@test.com',
              name: 'Mock Admin',
              role: 'admin' as const,
            }
            setProfile(mockProfile)
          }
        }
      })
      .catch((error) => {
        console.error('Auth session error:', error)

        // Fallback to mock user on error
        const mockUser = {
          id: 'mock-admin-001',
          email: 'admin@test.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
        } as any

        setUser(mockUser)

        if (!profile) {
          const mockProfile = {
            id: 'mock-admin-001',
            email: 'admin@test.com',
            name: 'Mock Admin',
            role: 'admin' as const,
          }
          setProfile(mockProfile)
        }
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, profile])

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
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
