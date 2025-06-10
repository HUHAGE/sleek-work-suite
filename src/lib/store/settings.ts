import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
    }
  )
) 