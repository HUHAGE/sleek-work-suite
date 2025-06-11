import { Settings, Sidebar, Palette, Sun, Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useSettings, type ThemeColor } from "@/lib/store/settings"
import { cn } from "@/lib/utils"

const themeColors: { value: ThemeColor; label: string; lightClass: string; darkClass: string }[] = [
  { 
    value: 'blue', 
    label: '深邃蓝', 
    lightClass: 'bg-[hsl(221.2,50%,45%)]',
    darkClass: 'bg-[hsl(221.2,50%,55%)]'
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
  
  return (
    <div className="tool-card">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">主题色设置</h3>
      </div>
      <div className="space-y-4">
        <RadioGroup value={themeColor} onValueChange={(value: ThemeColor) => setThemeColor(value)}>
          <div className="grid grid-cols-2 gap-4">
            {themeColors.map((color) => (
              <div key={color.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={color.value} id={color.value} />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background",
                    isDark ? color.darkClass : color.lightClass,
                    themeColor === color.value ? "ring-primary" : "ring-border"
                  )} />
                  <Label htmlFor={color.value} className="text-base">{color.label}</Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
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
        </div>
      </div>
    </div>
  )
}

export default function SettingsTools() {
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
        <AboutSetting />
      </div>
    </div>
  )
}