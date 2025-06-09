
import { useState } from 'react';
import { Calculator, Clock, Type, Palette, QrCode, Clipboard, Camera, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextTools from '@/components/tools/TextTools';
import TimeTools from '@/components/tools/TimeTools';
import CalculatorTool from '@/components/tools/CalculatorTool';
import ColorPicker from '@/components/tools/ColorPicker';
import QRGenerator from '@/components/tools/QRGenerator';
import ClipboardHistory from '@/components/tools/ClipboardHistory';

const tools = [
  { id: 'text', name: '文本工具', icon: Type, component: TextTools },
  { id: 'time', name: '时间工具', icon: Clock, component: TimeTools },
  { id: 'calculator', name: '计算器', icon: Calculator, component: CalculatorTool },
  { id: 'color', name: '颜色工具', icon: Palette, component: ColorPicker },
  { id: 'qr', name: '二维码', icon: QrCode, component: QRGenerator },
  { id: 'clipboard', name: '剪贴板', icon: Clipboard, component: ClipboardHistory },
];

const Index = () => {
  const [activeTool, setActiveTool] = useState('text');
  const ActiveComponent = tools.find(tool => tool.id === activeTool)?.component || TextTools;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative flex h-screen">
        {/* 侧边栏 */}
        <div className="w-72 glass border-r border-white/10 p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold gradient-text mb-2">工作提效工具</h1>
            <p className="text-muted-foreground text-sm">让工作更高效，让生活更简单</p>
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
                    "hover:bg-white/5 hover:scale-[1.02]",
                    activeTool === tool.id 
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tool.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="glass rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Settings size={16} />
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const tool = tools.find(t => t.id === activeTool);
                  const Icon = tool?.icon || Type;
                  return (
                    <>
                      <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                        <Icon size={24} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-foreground">{tool?.name}</h2>
                        <p className="text-muted-foreground">高效便捷的{tool?.name.slice(0, -2)}解决方案</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="animate-fade-in">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
