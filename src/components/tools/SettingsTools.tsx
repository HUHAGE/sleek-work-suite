import { Settings, Sidebar, Palette, Sun, Info, Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useSettings, type ThemeColor } from "@/lib/store/settings"
import { cn } from "@/lib/utils"
import MenuManagement from "@/components/MenuManagement"

interface ToolInfo {
  id: string
  name: string
  icon: any
}

const themeColors: { value: ThemeColor; label: string; lightClass: string; darkClass: string }[] = [
  { 
    value: 'blue', 
    label: '深邃蓝', 
    lightClass: 'bg-[hsl(221.2,50%,53.3%)]',
    darkClass: 'bg-[hsl(221.2,50%,53.3%)]'
  },
  { 
    value: 'green', 
    label: '翠绿', 
    lightClass: 'bg-[hsl(150,40%,40%)]',
    darkClass: 'bg-[hsl(150,40%,45%)]'
  },
  { 
    value: 'purple', 
    label: '优雅紫', 
    lightClass: 'bg-[hsl(262,45%,55%)]',
    darkClass: 'bg-[hsl(262,45%,60%)]'
  },
  { 
    value: 'rose', 
    label: '玫瑰红', 
    lightClass: 'bg-[hsl(346,40%,45%)]',
    darkClass: 'bg-[hsl(346,40%,50%)]'
  },
  { 
    value: 'orange', 
    label: '活力橙', 
    lightClass: 'bg-[hsl(30,40%,45%)]',
    darkClass: 'bg-[hsl(30,40%,50%)]'
  },
  { 
    value: 'blue-vibrant', 
    label: '亮蓝', 
    lightClass: 'bg-[hsl(221.2,83.2%,53.3%)]',
    darkClass: 'bg-[hsl(221.2,83.2%,53.3%)]'
  },
  { 
    value: 'green-vibrant', 
    label: '亮绿', 
    lightClass: 'bg-[hsl(150,76.2%,36.3%)]',
    darkClass: 'bg-[hsl(150,76.2%,41.3%)]'
  },
  { 
    value: 'purple-vibrant', 
    label: '亮紫', 
    lightClass: 'bg-[hsl(262,83.3%,57.8%)]',
    darkClass: 'bg-[hsl(262,83.3%,62.8%)]'
  },
  { 
    value: 'rose-vibrant', 
    label: '亮玫红', 
    lightClass: 'bg-[hsl(346,77.2%,49.8%)]',
    darkClass: 'bg-[hsl(346,77.2%,54.8%)]'
  },
  { 
    value: 'orange-vibrant', 
    label: '亮橙', 
    lightClass: 'bg-[hsl(30,95%,53.1%)]',
    darkClass: 'bg-[hsl(30,95%,58.1%)]'
  },
]

// 侧边栏设置组件
function SidebarSetting() {
  const { sidebarOpen, setSidebarOpen } = useSettings()
  
  return (
    <div className="tool-card">
      <div className="flex items-center gap-2 mb-4">
        <Sidebar size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">侧边栏设置</h3>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="sidebar" className="text-base">显示侧边栏</Label>
        <Switch
          id="sidebar"
          checked={sidebarOpen}
          onCheckedChange={setSidebarOpen}
        />
      </div>
    </div>
  )
}

// 主题设置组件
function ThemeSetting() {
  const { theme, setTheme } = useSettings()
  
  return (
    <div className="tool-card">
      <div className="flex items-center gap-2 mb-4">
        <Sun size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">主题设置</h3>
      </div>
      <div className="space-y-4">
        <RadioGroup value={theme} onValueChange={(value: any) => setTheme(value)}>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="text-base">浅色</Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="text-base">深色</Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system" className="text-base">跟随系统</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

// 主题色设置组件
function ThemeColorSetting() {
  const { theme, themeColor, setThemeColor } = useSettings()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  // 将颜色分为两组：柔和色和鲜艳色
  const softColors = themeColors.slice(0, 5)
  const vibrantColors = themeColors.slice(5)
  
  return (
    <div className="tool-card">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">主题色设置</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-2">柔和色调</div>
          <div className="grid grid-cols-5 gap-2 max-w-[400px]">
            {softColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setThemeColor(color.value)}
                className={cn(
                  "group relative w-16 aspect-square rounded-lg transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg",
                  themeColor === color.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background"
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-lg",
                  isDark ? color.darkClass : color.lightClass
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20 rounded-lg" />
                </div>
                {themeColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 p-1.5 text-[10px] font-medium text-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "bg-gradient-to-t from-black/60 to-transparent text-white rounded-b-lg"
                )}>
                  {color.label}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground mb-2">鲜艳色调</div>
          <div className="grid grid-cols-5 gap-2 max-w-[400px]">
            {vibrantColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setThemeColor(color.value)}
                className={cn(
                  "group relative w-16 aspect-square rounded-lg transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg",
                  themeColor === color.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background"
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-lg",
                  isDark ? color.darkClass : color.lightClass
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20 rounded-lg" />
                </div>
                {themeColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 p-1.5 text-[10px] font-medium text-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "bg-gradient-to-t from-black/60 to-transparent text-white rounded-b-lg"
                )}>
                  {color.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 关于信息组件
function AboutSetting() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Info size={20} className="text-primary" />
        <h3 className="text-xl font-semibold">关于</h3>
      </div>
      <div className="tool-card">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">软件版本</span>
            <span>v4.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">作者</span>
            <span>HUHA</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">邮箱</span>
            <a 
              href="mailto:wsyhok@126.com" 
              className="text-primary hover:underline"
            >
              wsyhok@126.com
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">问题反馈</span>
            <a 
              href="https://y6ero6gpth.feishu.cn/share/base/form/shrcnhUsDhClwkrb28UAaCrKWid" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              点击反馈
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SettingsToolsProps {
  tools?: ToolInfo[]
}

export default function SettingsTools({ tools = [] }: SettingsToolsProps) {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-primary" />
        <h3 className="text-xl font-semibold">基本设置</h3>
      </div>
      <div className="grid gap-6">
        <SidebarSetting />
        <ThemeSetting />
        <ThemeColorSetting />
        {tools.length > 0 && <MenuManagement tools={tools} />}
        <AboutSetting />
      </div>
    </div>
  )
}