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

// JAR工具路径项
export interface JarPathItem {
  id: string
  name: string
  path: string
}

// 用户数据类型定义
interface UserData {
  jarToolsPathHistory: JarPathItem[]
  jobToolsPathHistory: string[]
  sensitiveLogPathHistory: string[]
  workItems: WorkItem[] // 工作启动项配置
  sqlToolsHistory: SqlToolsHistory // SQL工具历史记录
}

interface UserDataState extends UserData {
  setJarToolsPathHistory: (history: JarPathItem[]) => void
  addJarToolsPath: (path: string, name?: string) => void
  removeJarToolsPath: (id: string) => void
  updateJarToolsPath: (id: string, name: string) => void
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
      addJarToolsPath: (path, name) => set((state) => {
        // 检查路径是否已存在
        if (state.jarToolsPathHistory.some(item => item.path === path)) {
          return state;
        }
        // 生成默认名称（路径的最后一个文件夹名）
        const defaultName = name || path.split(/[/\\]/).pop() || path;
        const newItem: JarPathItem = {
          id: crypto.randomUUID(),
          name: defaultName,
          path
        };
        // 限制最多10条记录
        const newHistory = [newItem, ...state.jarToolsPathHistory].slice(0, 10);
        return { jarToolsPathHistory: newHistory };
      }),
      removeJarToolsPath: (id) => set((state) => ({
        jarToolsPathHistory: state.jarToolsPathHistory.filter(item => item.id !== id)
      })),
      updateJarToolsPath: (id, name) => set((state) => ({
        jarToolsPathHistory: state.jarToolsPathHistory.map(item =>
          item.id === id ? { ...item, name } : item
        )
      })),
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
            const oldHistory = JSON.parse(jarHistory);
            // 如果是旧格式（字符串数组），转换为新格式
            if (Array.isArray(oldHistory) && oldHistory.length > 0 && typeof oldHistory[0] === 'string') {
              const newHistory: JarPathItem[] = oldHistory.map((path: string) => ({
                id: crypto.randomUUID(),
                name: path.split(/[/\\]/).pop() || path,
                path
              }));
              set({ jarToolsPathHistory: newHistory });
            } else {
              set({ jarToolsPathHistory: oldHistory });
            }
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
      version: 4, // 增加版本号
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

          // 迁移旧的jarToolsPathHistory数据格式（从字符串数组到对象数组）
          if (Array.isArray(state.jarToolsPathHistory)) {
            const oldHistory = state.jarToolsPathHistory;
            const isOldFormat = oldHistory.length > 0 && typeof oldHistory[0] === 'string';
            
            if (isOldFormat) {
              state.jarToolsPathHistory = (oldHistory as unknown as string[]).map((path: string) => ({
                id: crypto.randomUUID(),
                name: path.split(/[/\\]/).pop() || path,
                path
              }));
            }
          }
        };
      }
    }
  )
)