import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeColor = 'blue' | 'green' | 'purple' | 'rose' | 'orange'

interface SettingsState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  themeColor: ThemeColor
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setThemeColor: (color: ThemeColor) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      themeColor: 'blue',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setThemeColor: (color) => set({ themeColor: color }),
    }),
    {
      name: 'settings-storage',
    }
  )
) 