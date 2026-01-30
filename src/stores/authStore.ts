import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager' | 'inspector'

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
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({ user: null, profile: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
)
