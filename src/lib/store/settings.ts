import { create } from 'zustand'

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
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettings = create<SettingsState>((set, get) => ({
  sidebarOpen: true,
  theme: 'dark',
  themeColor: 'green',
  
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
    get().saveSettings()
  },
  
  setTheme: (theme) => {
    set({ theme })
    get().saveSettings()
  },
  
  setThemeColor: (color) => {
    set({ themeColor: color })
    get().saveSettings()
  },
  
  loadSettings: async () => {
    try {
      const settings = await window.electron.ipcRenderer.invoke('get-app-settings')
      if (settings) {
        set({
          sidebarOpen: settings.sidebarOpen ?? true,
          theme: settings.theme ?? 'dark',
          themeColor: settings.themeColor ?? 'green'
        })
      }
    } catch (error) {
      console.error('加载应用设置失败:', error)
    }
  },
  
  saveSettings: async () => {
    try {
      const state = get()
      await window.electron.ipcRenderer.invoke('save-app-settings', {
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        themeColor: state.themeColor
      })
    } catch (error) {
      console.error('保存应用设置失败:', error)
    }
  }
})) 