import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 工作启动项类型定义
interface WorkItem {
  id: string
  name: string
  path: string
  type: 'software' | 'website'
}

// 用户数据类型定义
interface UserData {
  jarToolsPathHistory: string[]
  jobToolsPathHistory: string[]
  sensitiveLogPathHistory: string[]
  workItems: WorkItem[] // 新增工作启动项配置
}

interface UserDataState extends UserData {
  setJarToolsPathHistory: (history: string[]) => void
  setJobToolsPathHistory: (history: string[]) => void
  setSensitiveLogPathHistory: (history: string[]) => void
  // 新增工作启动项相关方法
  addWorkItem: (item: Omit<WorkItem, 'id'>) => void
  removeWorkItem: (id: string) => void
  updateWorkItem: (id: string, item: Partial<Omit<WorkItem, 'id'>>) => void
  migrateFromLocalStorage: () => void
}

// 创建用户数据存储
export const useUserData = create<UserDataState>()(
  persist(
    (set) => ({
      // 初始状态
      jarToolsPathHistory: [],
      jobToolsPathHistory: [],
      sensitiveLogPathHistory: [],
      workItems: [], // 新增工作启动项初始值

      // 更新方法
      setJarToolsPathHistory: (history) => set({ jarToolsPathHistory: history }),
      setJobToolsPathHistory: (history) => set({ jobToolsPathHistory: history }),
      setSensitiveLogPathHistory: (history) => set({ sensitiveLogPathHistory: history }),

      // 工作启动项相关方法
      addWorkItem: (item) => set((state) => ({
        workItems: [...state.workItems, { ...item, id: crypto.randomUUID() }]
      })),
      removeWorkItem: (id) => set((state) => ({
        workItems: state.workItems.filter(item => item.id !== id)
      })),
      updateWorkItem: (id, item) => set((state) => ({
        workItems: state.workItems.map(existingItem =>
          existingItem.id === id ? { ...existingItem, ...item } : existingItem
        )
      })),

      // 从localStorage迁移数据
      migrateFromLocalStorage: () => {
        try {
          // 获取并迁移JAR工具历史记录
          const jarHistory = localStorage.getItem('jarToolsPathHistory')
          if (jarHistory) {
            set({ jarToolsPathHistory: JSON.parse(jarHistory) })
            localStorage.removeItem('jarToolsPathHistory')
          }

          // 获取并迁移Job工具历史记录
          const jobHistory = localStorage.getItem('jobToolsPathHistory')
          if (jobHistory) {
            set({ jobToolsPathHistory: JSON.parse(jobHistory) })
            localStorage.removeItem('jobToolsPathHistory')
          }

          // 获取并迁移敏感日志扫描历史记录
          const sensitiveLogHistory = localStorage.getItem('sensitiveLogPathHistory')
          if (sensitiveLogHistory) {
            set({ sensitiveLogPathHistory: JSON.parse(sensitiveLogHistory) })
            localStorage.removeItem('sensitiveLogPathHistory')
          }
        } catch (error) {
          console.error('迁移用户数据失败:', error)
        }
      }
    }),
    {
      name: 'user-data-storage',
      // 使用版本号来管理数据结构变更
      version: 1,
    }
  )
)