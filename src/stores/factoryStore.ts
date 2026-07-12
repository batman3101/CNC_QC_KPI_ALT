import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FactoryCode } from '@/types/factory'

interface FactoryState {
  activeFactoryId: FactoryCode | null
  factories: Array<{ id: FactoryCode; name: string; name_vi: string | null }>
  setActiveFactory: (id: FactoryCode) => void
  setFactories: (factories: Array<{ id: FactoryCode; name: string; name_vi: string | null }>) => void
  initializeFromUser: (factoryId: string | null) => void
  reset: () => void
}

export const useFactoryStore = create<FactoryState>()(
  persist(
    (set) => ({
      activeFactoryId: null,
      factories: [
        { id: 'ALT', name: 'ALT 공장', name_vi: 'Nhà máy ALT' },
        { id: 'ALV', name: 'ALV 공장', name_vi: 'Nhà máy ALV' },
      ],

      setActiveFactory: (id) => set({ activeFactoryId: id }),

      setFactories: (factories) => set({ factories }),

      // activeFactoryId is persisted, so it must be cleared - not just left
      // alone - when the signed-in user has no factory. Otherwise the previous
      // user's factory survives on a shared tablet and the next user's
      // inspections are written into it.
      initializeFromUser: (factoryId) => {
        set({
          activeFactoryId:
            factoryId === 'ALT' || factoryId === 'ALV' ? factoryId : null,
        })
      },

      reset: () => set({ activeFactoryId: null }),
    }),
    {
      name: 'factory-storage',
      partialize: (state) => ({
        activeFactoryId: state.activeFactoryId,
      }),
    }
  )
)
