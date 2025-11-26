import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { USE_MOCK_AUTH } from '@/config/app.config'

// UI 테스트용 Mock 서비스
import * as mockAuthService from '@/ui_test/mockServices/mockAuthService'

export function useAuth() {
  const navigate = useNavigate()
  const { user, profile, isLoading, setUser, setProfile, setLoading, logout } =
    useAuthStore()

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Mock 인증: 콘솔에 테스트 계정 정보 출력
      mockAuthService.printMockCredentials()

      // Mock 세션 확인
      mockAuthService.mockGetSession().then(({ user }) => {
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setUser(user as any)
          setProfile({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          })
        }
        setLoading(false)
      })

      return
    }

    // 실제 Supabase 인증 (USE_MOCK_AUTH = false일 때)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser, setProfile, setLoading])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile({
          id: (data as { id: string }).id,
          email: (data as { email: string }).email,
          name: (data as { name: string }).name,
          role: (data as { role: 'admin' | 'manager' | 'inspector' }).role,
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (USE_MOCK_AUTH) {
      // Mock 로그인
      const { user, error } = await mockAuthService.mockSignIn(email, password)

      if (error) {
        return { error }
      }

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser(user as any)
        setProfile({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        })
        navigate('/dashboard')
      }

      return { error: null }
    }

    // 실제 Supabase 로그인
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchUserProfile(data.user.id)
        navigate('/dashboard')
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const signOut = async () => {
    if (USE_MOCK_AUTH) {
      // Mock 로그아웃
      await mockAuthService.mockSignOut()
      logout()
      navigate('/login')
      return
    }

    // 실제 Supabase 로그아웃
    try {
      await supabase.auth.signOut()
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}
