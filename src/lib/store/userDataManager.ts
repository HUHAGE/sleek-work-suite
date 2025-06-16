import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 工作启动项类型定义
interface WorkItem {
  id: string
  name: string
  path: string
  type: 'software' | 'website'
}

// SQL工具历史记录类型定义
interface SqlToolsHistory {
  sqlInHistory: Array<{
    sql: string;
    params: string;
    timestamp: number;
  }>;
  insertParserHistory: string[];
  truncateDetectorHistory: {
    createTableSql: string[];
    insertSql: string[];
  }
}

// 用户数据类型定义
interface UserData {
  jarToolsPathHistory: string[]
  jobToolsPathHistory: string[]
  sensitiveLogPathHistory: string[]
  workItems: WorkItem[] // 工作启动项配置
  sqlToolsHistory: SqlToolsHistory // SQL工具历史记录
}

interface UserDataState extends UserData {
  setJarToolsPathHistory: (history: string[]) => void
  setJobToolsPathHistory: (history: string[]) => void
  setSensitiveLogPathHistory: (history: string[]) => void
  // 工作启动项相关方法
  addWorkItem: (item: Omit<WorkItem, 'id'>) => void
  removeWorkItem: (id: string) => void
  updateWorkItem: (id: string, item: Partial<Omit<WorkItem, 'id'>>) => void
  // SQL工具相关方法
  addSqlInHistory: (sql: string, params: string) => void
  addInsertParserHistory: (sql: string) => void
  addTruncateDetectorHistory: (createTableSql: string, insertSql: string) => void
  clearSqlToolsHistory: () => void
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
      workItems: [], // 工作启动项初始值
      sqlToolsHistory: {
        sqlInHistory: [],
        insertParserHistory: [],
        truncateDetectorHistory: {
          createTableSql: [],
          insertSql: []
        }
      },

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

      // SQL工具相关方法
      addSqlInHistory: (sql, params) => set((state) => ({
        sqlToolsHistory: {
          ...state.sqlToolsHistory,
          sqlInHistory: [
            {
              sql,
              params,
              timestamp: Date.now()
            },
            ...state.sqlToolsHistory.sqlInHistory.slice(0, 9)
          ]
        }
      })),
      addInsertParserHistory: (sql) => set((state) => ({
        sqlToolsHistory: {
          ...state.sqlToolsHistory,
          insertParserHistory: [sql, ...state.sqlToolsHistory.insertParserHistory.slice(0, 9)]
        }
      })),
      addTruncateDetectorHistory: (createTableSql, insertSql) => set((state) => ({
        sqlToolsHistory: {
          ...state.sqlToolsHistory,
          truncateDetectorHistory: {
            createTableSql: [createTableSql, ...state.sqlToolsHistory.truncateDetectorHistory.createTableSql.slice(0, 9)],
            insertSql: [insertSql, ...state.sqlToolsHistory.truncateDetectorHistory.insertSql.slice(0, 9)]
          }
        }
      })),
      clearSqlToolsHistory: () => set((state) => ({
        sqlToolsHistory: {
          sqlInHistory: [],
          insertParserHistory: [],
          truncateDetectorHistory: {
            createTableSql: [],
            insertSql: []
          }
        }
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
      version: 3, // 增加版本号
      onRehydrateStorage: () => {
        return (state) => {
          // 确保sqlToolsHistory存在且具有正确的结构
          if (!state) return;
          
          if (!state.sqlToolsHistory) {
            state.sqlToolsHistory = {
              sqlInHistory: [],
              insertParserHistory: [],
              truncateDetectorHistory: {
                createTableSql: [],
                insertSql: []
              }
            };
          }

          // 迁移旧的sqlInHistory数据格式
          if (Array.isArray(state.sqlToolsHistory.sqlInHistory)) {
            const oldHistory = state.sqlToolsHistory.sqlInHistory;
            const isOldFormat = oldHistory.length > 0 && 
              typeof (oldHistory[0] as any) === 'string';
            
            if (isOldFormat) {
              state.sqlToolsHistory.sqlInHistory = (oldHistory as unknown as string[]).map(sql => ({
                sql,
                params: '',
                timestamp: Date.now()
              }));
            }
          }
        };
      }
    }
  )
)