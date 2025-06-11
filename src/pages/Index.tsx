import { useState, useEffect } from 'react';
import { Calculator, Clock, Type, Palette, QrCode, Clipboard, Settings, Archive, FileCode, ChevronLeft, Globe, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextTools from '@/components/tools/TextTools';
import TimeTools from '@/components/tools/TimeTools';
import CalculatorTool from '@/components/tools/CalculatorTool';
import ColorPicker from '@/components/tools/ColorPicker';
import QRGenerator from '@/components/tools/QRGenerator';
import ClipboardHistory from '@/components/tools/ClipboardHistory';
import JarTools from '@/components/tools/JarTools';
import JobAnnotationTool from '@/components/tools/JobAnnotationTool';
import HuhaTools from '@/components/tools/HuhaTools';
import SettingsTools from '@/components/tools/SettingsTools';
import { useSettings } from '@/lib/store/settings';
import TitleBar from '@/components/TitleBar';
import { LucideIcon } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  dec?: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

const Index = () => {
  const [activeTool, setActiveTool] = useState('text');
  const { sidebarOpen, setSidebarOpen } = useSettings();

  const tools: Tool[] = [
    { id: 'text', name: '文本工具', icon: Type, component: TextTools },
    // { id: 'time', name: '时间工具', icon: Clock, component: TimeTools },
    // { id: 'calculator', name: '计算器', icon: Calculator, component: CalculatorTool },
    // { id: 'color', name: '颜色工具', icon: Palette, component: ColorPicker },
    // { id: 'qr', name: '二维码', icon: QrCode, component: QRGenerator },
    // { id: 'clipboard', name: '剪贴板', icon: Clipboard, component: ClipboardHistory },
    { id: 'jar', name: '个性化JAR管理', dec: '扫描路径下target目录下的jar文件，实现批量复制，简化8.x多个jar的批量更新', icon: Archive, component: JarTools },
    { id: 'job-annotation', name: 'Job注解整改', dec: '扫描并添加Job类的并发控制注解（@DisallowConcurrentExecution）', icon: FileCode, component: JobAnnotationTool },
    { id: 'huha', name: 'HUHA工具集', icon: Globe, component: HuhaTools },
  ];

  const settingsTool: Tool = { id: 'settings', name: '设置', icon: Settings, component: SettingsTools };

  const ActiveComponent = (activeTool === 'settings' ? settingsTool : tools.find(tool => tool.id === activeTool))?.component || TextTools;
  const activeToolInfo = activeTool === 'settings' ? settingsTool : tools.find(tool => tool.id === activeTool);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', sidebarOpen ? '288px' : '80px');
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background flex flex-col scrollbar-hide">
      <TitleBar />
      <div className="flex-1 relative scrollbar-hide mt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative flex h-[calc(100vh-40px)] overflow-hidden">
          {/* 侧边栏 */}
          <div className={cn(
            "bg-background/80 border-r border-border/50 backdrop-blur-xl transition-all duration-300 ease-in-out z-20 flex flex-col h-full",
            sidebarOpen ? "w-72" : "w-20"
          )}>
            <div className="relative flex-1">
              {/* 折叠按钮 */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors"
              >
                <ChevronLeft className={cn(
                  "transition-transform duration-300",
                  !sidebarOpen && "rotate-180"
                )} size={16} />
              </button>

              <div className={cn(
                "p-6",
                !sidebarOpen && "px-4"
              )}>
                <div className="mb-8">
                  <h1 className={cn(
                    "text-2xl font-bold gradient-text mb-2",
                    !sidebarOpen && "text-center text-sm"
                  )}>
                    {!sidebarOpen ? "HUHA" : "工作提效小助手"}
                  </h1>
                  {sidebarOpen && (
                    <p className="text-muted-foreground text-sm">快速定制，随时更新，随时使用</p>
                  )}
                </div>

                <nav className="space-y-2">
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                          "hover:bg-primary/5 hover:scale-[1.02]",
                          activeTool === tool.id
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground",
                          !sidebarOpen && "justify-center px-2"
                        )}
                        title={!sidebarOpen ? tool.name : undefined}
                      >
                        <Icon size={20} />
                        {sidebarOpen && (
                          <span className="font-medium">{tool.name}</span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* 设置按钮 */}
            <div className="p-4 border-t border-border/50">
              <button
                onClick={() => setActiveTool('settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-primary/5 hover:scale-[1.02]",
                  activeTool === 'settings'
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground",
                  !sidebarOpen && "justify-center px-2"
                )}
                title={!sidebarOpen ? settingsTool.name : undefined}
              >
                <Settings size={20} />
                {sidebarOpen && (
                  <span className="font-medium">{settingsTool.name}</span>
                )}
              </button>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm h-[calc(100vh-32px)] scrollbar-hide">
            <div className="container mx-auto p-6 h-full">
              {activeToolInfo?.dec && (
                <div className="mb-6 p-4 rounded-xl bg-card/50 border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Info className="text-primary mt-1" size={20} />
                    <div>
                      <h2 className="text-lg font-medium text-primary mb-2">{activeToolInfo.name}</h2>
                      <p className="text-muted-foreground">{activeToolInfo.dec}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="h-[calc(100%-theme(space.6)-2px)]">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
