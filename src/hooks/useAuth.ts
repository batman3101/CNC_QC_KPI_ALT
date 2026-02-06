/**
 * useAuth Hook - Supabase 전용
 * Auth 상태는 App.tsx의 onAuthStateChange에서 단일 관리
 * 이 훅은 상태 읽기 + signIn/signOut 액션만 제공
 */

import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, profile, isLoading, logout } = useAuthStore()

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // onAuthStateChange에서 user/profile 설정 후 navigate
      navigate('/dashboard')

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
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
    isAuthenticated: !!user || !!profile,
    signIn,
    signOut,
  }
}
