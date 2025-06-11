import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeColor = 
  | 'blue' | 'green' | 'purple' | 'rose' | 'orange'
  | 'blue-vibrant' | 'green-vibrant' | 'purple-vibrant' | 'rose-vibrant' | 'orange-vibrant'

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
      theme: 'dark',
      themeColor: 'green',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setThemeColor: (color) => set({ themeColor: color }),
    }),
    {
      name: 'settings-storage',
    }
  )
) 