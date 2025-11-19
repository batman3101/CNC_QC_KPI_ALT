import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, profile, isLoading, setUser, setProfile, setLoading, logout } =
    useAuthStore()

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // 프로필 정보 가져오기
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
    })

    // 인증 상태 변경 리스너
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
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
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
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const signOut = async () => {
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
