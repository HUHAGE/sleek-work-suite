import { useState, useEffect } from "react"
import { Menu, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSettings, type MenuConfig } from "@/lib/store/settings"
import { cn } from "@/lib/utils"
import { LucideIcon } from 'lucide-react'

interface MenuManagementProps {
  tools: Array<{
    id: string
    name: string
    icon: LucideIcon
  }>
}

export default function MenuManagement({ tools }: MenuManagementProps) {
  const { menuConfigs, setMenuConfigs } = useSettings()
  const [localConfigs, setLocalConfigs] = useState<MenuConfig[]>([])

  // 过滤掉固定在底部的菜单（如HUHA工具集）
  const manageableTools = tools.filter(tool => tool.id !== 'huha')

  // 初始化菜单配置
  useEffect(() => {
    if (menuConfigs.length === 0) {
      // 如果没有配置，初始化所有菜单为启用状态
      const initialConfigs = manageableTools.map((tool, index) => ({
        id: tool.id,
        enabled: true,
        order: index
      }))
      setLocalConfigs(initialConfigs)
      setMenuConfigs(initialConfigs)
    } else {
      // 合并现有配置和新菜单
      const existingIds = new Set(menuConfigs.map(c => c.id))
      const newTools = manageableTools.filter(t => !existingIds.has(t.id))
      const maxOrder = menuConfigs.length > 0 ? Math.max(...menuConfigs.map(c => c.order)) : -1
      
      const newConfigs = newTools.map((tool, index) => ({
        id: tool.id,
        enabled: true,
        order: maxOrder + index + 1
      }))
      
      const mergedConfigs = [...menuConfigs, ...newConfigs]
        .filter(config => manageableTools.some(t => t.id === config.id))
        .sort((a, b) => a.order - b.order)
      
      setLocalConfigs(mergedConfigs)
    }
  }, [manageableTools, menuConfigs, setMenuConfigs])

  // 切换菜单启用状态
  const toggleMenu = (id: string) => {
    const newConfigs = localConfigs.map(config =>
      config.id === id ? { ...config, enabled: !config.enabled } : config
    )
    setLocalConfigs(newConfigs)
    setMenuConfigs(newConfigs)
    
    // 跟踪菜单切换
    if (typeof window !== 'undefined' && (window as any).umami) {
      const config = newConfigs.find(c => c.id === id);
      (window as any).umami.track('menu_toggle', {
        menu: id,
        enabled: config?.enabled
      });
    }
  }

  // 向上移动
  const moveUp = (index: number) => {
    if (index === 0) return
    const newConfigs = [...localConfigs]
    const temp = newConfigs[index]
    newConfigs[index] = newConfigs[index - 1]
    newConfigs[index - 1] = temp
    
    // 更新order
    newConfigs.forEach((config, idx) => {
      config.order = idx
    })
    
    setLocalConfigs(newConfigs)
    setMenuConfigs(newConfigs)
    
    // 跟踪菜单排序
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('menu_reorder', {
        menu: temp.id,
        direction: 'up'
      });
    }
  }

  // 向下移动
  const moveDown = (index: number) => {
    if (index === localConfigs.length - 1) return
    const newConfigs = [...localConfigs]
    const temp = newConfigs[index]
    newConfigs[index] = newConfigs[index + 1]
    newConfigs[index + 1] = temp
    
    // 更新order
    newConfigs.forEach((config, idx) => {
      config.order = idx
    })
    
    setLocalConfigs(newConfigs)
    setMenuConfigs(newConfigs)
    
    // 跟踪菜单排序
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('menu_reorder', {
        menu: temp.id,
        direction: 'down'
      });
    }
  }

  return (
    <div className="tool-card">
      <div className="flex items-center gap-2 mb-4">
        <Menu size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">菜单管理</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        自定义侧边栏菜单的显示和排序。注：HUHA工具集固定在底部，不参与排序。
      </p>
      <div className="space-y-2">
        {localConfigs.map((config, index) => {
          const tool = manageableTools.find(t => t.id === config.id)
          if (!tool) return null
          
          const Icon = tool.icon
          
          return (
            <div
              key={config.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                config.enabled 
                  ? "bg-background dark:bg-background/60 border-border dark:border-border/80 hover:border-primary/50 dark:hover:border-primary/60" 
                  : "bg-muted/50 dark:bg-muted/30 border-border/50 dark:border-border/40 opacity-60"
              )}
            >
              {/* 拖拽图标 */}
              <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
              
              {/* 菜单图标和名称 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon size={18} className="text-primary flex-shrink-0" />
                <Label className="text-base cursor-pointer flex-1 truncate">
                  {tool.name}
                </Label>
              </div>
              
              {/* 排序按钮 */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={cn(
                    "p-0.5 rounded hover:bg-primary/10 transition-colors",
                    index === 0 && "opacity-30 cursor-not-allowed"
                  )}
                  title="向上移动"
                >
                  <ChevronUp size={14} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === localConfigs.length - 1}
                  className={cn(
                    "p-0.5 rounded hover:bg-primary/10 transition-colors",
                    index === localConfigs.length - 1 && "opacity-30 cursor-not-allowed"
                  )}
                  title="向下移动"
                >
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </div>
              
              {/* iOS风格开关 */}
              <Switch
                checked={config.enabled}
                onCheckedChange={() => toggleMenu(config.id)}
                className="flex-shrink-0"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
