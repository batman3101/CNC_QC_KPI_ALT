/**
 * useAuth Hook - Supabase 전용
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFactoryStore } from '@/stores/factoryStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, profile, isLoading, setUser, setProfile, setLoading, logout } =
    useAuthStore()

  useEffect(() => {
    // Supabase 세션 확인
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
        const factoryId = (data as { factory_id: string | null }).factory_id
        setProfile({
          id: (data as { id: string }).id,
          email: (data as { email: string }).email,
          name: (data as { name: string }).name,
          role: (data as { role: 'admin' | 'manager' | 'inspector' }).role,
          factory_id: factoryId,
        })
        useFactoryStore.getState().initializeFromUser(factoryId)
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
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}
