import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useFactoryStore } from '@/stores/factoryStore'

export type UserRole = 'admin' | 'manager' | 'inspector'

/**
 * 'missing' means the account authenticates but has no public.users row, so
 * every RLS helper resolves to false. It is a distinct state from 'error'
 * because only an administrator can resolve it - retrying never will.
 */
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  factory_id: string | null
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  profileStatus: ProfileStatus
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  loadProfile: (userId: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      profileStatus: 'idle',
      isLoading: true,

      setUser: (user) => set({ user }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      loadProfile: async (userId) => {
        set({ profileStatus: 'loading' })

        // maybeSingle keeps "no profile row" out of the error channel so it can
        // be reported as its own state instead of being swallowed as a failure.
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, role, factory_id')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error('Failed to load user profile:', error)
          set({ profile: null, profileStatus: 'error' })
          return
        }

        if (!data) {
          set({ profile: null, profileStatus: 'missing' })
          return
        }

        const profile = data as UserProfile
        set({ profile, profileStatus: 'ready' })
        useFactoryStore.getState().initializeFromUser(profile.factory_id)
      },

      logout: () => {
        // The factory store is persisted too. Leaving it set would carry the
        // outgoing user's factory into the next session on a shared tablet.
        useFactoryStore.getState().reset()
        set({ user: null, profile: null, profileStatus: 'idle' })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
)
