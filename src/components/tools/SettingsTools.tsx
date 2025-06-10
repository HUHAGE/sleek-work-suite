import { Settings } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "@/lib/store/settings"

export default function SettingsTools() {
  const { sidebarOpen, theme, setSidebarOpen, setTheme } = useSettings()

  return (
    <div className="space-y-6">
      {/* 基本设置 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">基本设置</h3>
        </div>
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sidebar" className="text-base">显示侧边栏</Label>
            <Switch
              id="sidebar"
              checked={sidebarOpen}
              onCheckedChange={setSidebarOpen}
            />
          </div>
          <div className="space-y-4">
            <Label className="text-base">主题</Label>
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
      </div>
    </div>
  )
} 