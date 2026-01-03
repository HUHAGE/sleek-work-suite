import { useState, useEffect } from 'react';
import { Type, Settings, Archive, FileCode, ChevronLeft, Globe, Shield, Download, PlayCircle, Database, FileJson, KeyRound, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextTools from '@/components/tools/TextTools';
import JarTools from '@/components/tools/JarTools';
import JobAnnotationTool from '@/components/tools/JobAnnotationTool';
import HuhaTools from '@/components/tools/HuhaTools';
import SettingsTools from '@/components/tools/SettingsTools';
import SqlTools from '@/components/tools/SqlTools';
import { useSettings } from '@/lib/store/settings';
import TitleBar from '@/components/TitleBar';
import { LucideIcon } from 'lucide-react';
import { SensitiveLogScanner } from '@/components/tools/SensitiveLogScanner';
import JarQuickPuller from '@/components/tools/JarQuickPuller';
import WorkStarter from '@/components/tools/WorkStarter';
import ApiDocGenerator from '@/components/tools/ApiDocGenerator';
import UrlDecryptTool from '@/components/tools/UrlDecryptTool';
import DbDecryptTool from '@/components/tools/DbDecryptTool';
import CollapsibleDescription from '@/components/CollapsibleDescription';
import { trackMenuSwitch } from '@/lib/analytics';

interface Tool {
  id: string;
  name: string;
  dec?: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

const Index = () => {
  const [activeTool, setActiveTool] = useState('work-starter');
  const { sidebarOpen, setSidebarOpen, loadSettings, menuConfigs } = useSettings();

  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const tools: Tool[] = [
    { id: 'work-starter', name: '工作启动器', dec: '每天开机第一件事，快速打开工作要用的软件和网页', icon: PlayCircle, component: WorkStarter },
    { id: 'text', name: '文本工具', icon: Type, component: TextTools },
    { id: 'sql', name: 'SQL工具', dec: '', icon: Database, component: SqlTools },
    { id: 'api-doc', name: 'AI接口文档生成', dec: '根据代码生成专业的接口文档，支持多种格式导出（实验性功能，请谨慎使用）', icon: FileJson, component: ApiDocGenerator },
    { id: 'url-decrypt', name: 'URL快速解密', dec: '通过系统控制台调用 Util.decryptUrlParams() 方法解密URL参数', icon: KeyRound, component: UrlDecryptTool },
    { id: 'db-decrypt', name: 'JDBC快速加解密', dec: '通过系统控制台自动解密数据库配置信息（url、username、password），注意拨上公司VPN后再使用', icon: Key, component: DbDecryptTool },
    { id: 'jar', name: '个性化Jar管理', dec: '扫描路径下target目录下的jar文件，实现批量复制，简化8.x多个jar的批量更新', icon: Archive, component: JarTools },
    { id: 'jar-quick-puller', name: 'Jar快速拉取', dec: '拉取产品的Jar包，方便整改，支持单个Jar包拉取和批量Maven依赖拉取', icon: Download, component: JarQuickPuller },
    { id: 'job-annotation', name: 'Job注解整改', dec: '扫描并添加Job类的并发控制注解（@DisallowConcurrentExecution）', icon: FileCode, component: JobAnnotationTool },
    { id: 'huha', name: 'HUHA工具集', icon: Globe, component: HuhaTools },
    { id: 'sensitive-log', name: '敏感日志扫描', dec: '扫描代码中的敏感信息日志记录', icon: Shield, component: SensitiveLogScanner },
  ];

  const settingsTool: Tool = { id: 'settings', name: '设置', icon: Settings, component: SettingsTools };

  // 根据菜单配置过滤和排序工具
  const getVisibleTools = () => {
    if (menuConfigs.length === 0) {
      // 如果没有配置，显示所有工具
      return tools
    }
    
    // 根据配置过滤和排序
    const configMap = new Map(menuConfigs.map(c => [c.id, c]))
    return tools
      .filter(tool => {
        const config = configMap.get(tool.id)
        return config ? config.enabled : true
      })
      .sort((a, b) => {
        const configA = configMap.get(a.id)
        const configB = configMap.get(b.id)
        const orderA = configA ? configA.order : 999
        const orderB = configB ? configB.order : 999
        return orderA - orderB
      })
  }

  const visibleTools = getVisibleTools()
  
  // 当菜单配置加载后，检查当前激活的工具是否可见
  useEffect(() => {
    if (menuConfigs.length > 0 && activeTool !== 'settings') {
      const isActiveToolVisible = visibleTools.some(tool => tool.id === activeTool)
      if (!isActiveToolVisible && visibleTools.length > 0) {
        // 如果当前激活的工具不可见，切换到第一个可见的工具
        setActiveTool(visibleTools[0].id)
      }
    }
  }, [menuConfigs, activeTool, visibleTools])
  
  const handleToolSwitch = (toolId: string) => {
    trackMenuSwitch(toolId);
    setActiveTool(toolId);
  };

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
            "relative bg-gradient-to-br from-background/95 via-background/90 to-background/95 border-r border-border/50 backdrop-blur-2xl transition-all duration-300 ease-in-out z-20 flex flex-col h-full shadow-2xl",
            sidebarOpen ? "w-72" : "w-20"
          )}>
            {/* 顶部光泽效果 */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />
            
            {/* 侧边光效 */}
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none" />
            
            {/* 折叠按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border border-primary/40 text-primary hover:from-primary/40 hover:to-primary/30 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className={cn(
                "transition-transform duration-300",
                !sidebarOpen && "rotate-180"
              )} size={16} />
            </button>

            {/* 顶部标题区域 */}
            <div className={cn(
              "p-6 pb-3 relative flex-shrink-0",
              !sidebarOpen && "px-4"
            )}>
              <div className="mb-4">
                <h1 className={cn(
                  "text-2xl font-bold gradient-text mb-2 drop-shadow-sm",
                  !sidebarOpen && "text-center text-sm"
                )}>
                  {!sidebarOpen ? "AiDo" : "工作提效小助手"}
                </h1>
                {sidebarOpen && (
                  <p className="text-muted-foreground text-sm">快速定制，随时更新，随时使用</p>
                )}
              </div>
            </div>

            {/* 可滚动的菜单区域 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <nav className={cn(
                "space-y-2 pb-4",
                sidebarOpen ? "px-6" : "px-4"
              )}>
                {visibleTools.filter(tool => tool.id !== 'huha').map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSwitch(tool.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group",
                        "hover:scale-[1.02] hover:shadow-md",
                        activeTool === tool.id
                          ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/40 shadow-lg shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/5 border border-transparent hover:border-primary/20",
                        !sidebarOpen && "justify-center px-2"
                      )}
                      title={!sidebarOpen ? tool.name : undefined}
                    >
                      {/* 悬停光效 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      
                      <Icon size={20} className="relative z-10" />
                      {sidebarOpen && (
                        <span className="font-medium relative z-10">{tool.name}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 底部固定区域 - HUHA工具集和设置 */}
            <div className="flex-shrink-0 border-t border-border/50 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm">
              {/* HUHA工具集按钮 */}
              <div className="p-4">
                {visibleTools.find(tool => tool.id === 'huha') && (() => {
                  const tool = visibleTools.find(tool => tool.id === 'huha')!;
                  const Icon = tool.icon;
                  return (
                    <button
                      onClick={() => handleToolSwitch(tool.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group",
                        "hover:scale-[1.02] hover:shadow-md",
                        activeTool === tool.id
                          ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/40 shadow-lg shadow-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/5 border border-transparent hover:border-primary/20",
                        !sidebarOpen && "justify-center px-2"
                      )}
                      title={!sidebarOpen ? tool.name : undefined}
                    >
                      {/* 悬停光效 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      
                      <Icon size={20} className="relative z-10" />
                      {sidebarOpen && (
                        <span className="font-medium relative z-10">{tool.name}</span>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* 设置按钮 */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleToolSwitch('settings')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group",
                    "hover:scale-[1.02] hover:shadow-md",
                    activeTool === 'settings'
                      ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/40 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/5 border border-transparent hover:border-primary/20",
                    !sidebarOpen && "justify-center px-2"
                  )}
                  title={!sidebarOpen ? settingsTool.name : undefined}
                >
                  {/* 悬停光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <Settings size={20} className="relative z-10" />
                  {sidebarOpen && (
                    <span className="font-medium relative z-10">{settingsTool.name}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-auto bg-background/30 backdrop-blur-md h-[calc(100vh-40px)] scrollbar-hide">
            <div className="p-6">
              {activeToolInfo?.dec && (
                <CollapsibleDescription 
                  title={activeToolInfo.name}
                  description={activeToolInfo.dec}
                />
              )}
              <div className="min-h-0 flex-1">
                {activeTool === 'settings' ? (
                  <SettingsTools tools={tools} />
                ) : (
                  <ActiveComponent />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
