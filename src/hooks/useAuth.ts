/**
 * useAuth Hook - Supabase 전용
 *
 * Session restore and the onAuthStateChange subscription live in AppRoutes,
 * which is mounted exactly once. This hook is only a view onto the auth store
 * plus the sign-in/sign-out actions, so mounting it in several components does
 * not create competing auth listeners.
 */

import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, profile, profileStatus, isLoading, loadProfile, logout } =
    useAuthStore()

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await loadProfile(data.user.id)
        // '/' resolves to the first feature this user is allowed to open.
        // Routing straight to /dashboard would dead-end on an access-denied
        // screen for any role whose dashboard permission an admin has revoked.
        navigate('/')
      }

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
    profileStatus,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}
