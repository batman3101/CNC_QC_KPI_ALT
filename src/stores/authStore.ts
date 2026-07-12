import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isOnline } from '@/lib/network'
import { forgetPermissions } from '@/lib/permissionCache'
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
    (set, get) => ({
      user: null,
      profile: null,
      profileStatus: 'idle',
      isLoading: true,

      setUser: (user) => set({ user }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      loadProfile: async (userId) => {
        set({ profileStatus: 'loading' })

        // Offline, the persisted profile is the only answer there is - and it is
        // a good one, since the session that vouches for it is still valid.
        // Querying would fail and drop the app into the profile-error screen,
        // which is exactly the moment an inspector needs to keep working.
        if (!isOnline()) {
          const persisted = get().profile

          if (persisted && persisted.id === userId) {
            console.info('[Offline] Profile: using the persisted copy')
            set({ profileStatus: 'ready' })
            useFactoryStore.getState().initializeFromUser(persisted.factory_id)
            return
          }

          // A different user, or none ever stored: this device has nothing to go
          // on and cannot ask.
          set({ profile: null, profileStatus: 'error' })
          return
        }

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
        // Same reasoning for the offline permission copy: it is keyed by user id
        // and would be rejected anyway, but there is no reason to leave one
        // user's permissions sitting on a tablet the next shift will pick up.
        forgetPermissions()
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
