
import { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const ColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
    toast({
      title: "已复制到剪贴板",
      description: `颜色值 ${text} 已复制`,
    });
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgb = hexToRgb(selectedColor);
  const hsl = hexToHsl(selectedColor);

  const presetColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
    '#d299c2', '#fef9d7', '#dee5ff', '#c3cfe2'
  ];

  const colorFormats = [
    { label: 'HEX', value: selectedColor, key: 'hex' },
    { label: 'RGB', value: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '', key: 'rgb' },
    { label: 'HSL', value: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '', key: 'hsl' },
    { label: 'CSS RGB', value: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '', key: 'css-rgb' },
  ];

  return (
    <div className="space-y-6">
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-6">
          <Palette size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">颜色选择器</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 颜色选择 */}
          <div className="space-y-6">
            <div className="text-center">
              <div 
                className="w-32 h-32 mx-auto rounded-2xl shadow-lg border border-border/50 mb-4"
                style={{ backgroundColor: selectedColor }}
              ></div>
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-12 bg-background/50"
              />
            </div>

            {/* 预设颜色 */}
            <div>
              <h4 className="text-sm font-medium mb-3">预设颜色</h4>
              <div className="grid grid-cols-8 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border border-border/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 颜色格式 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">颜色格式</h4>
            {colorFormats.map((format) => (
              <div key={format.key} className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{format.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(format.value, format.key)}
                    className="hover:bg-primary/20"
                  >
                    {copiedStates[format.key] ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>
                <div className="text-sm font-mono bg-muted/20 rounded p-2">
                  {format.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 颜色分析 */}
      <div className="tool-card">
        <h4 className="text-lg font-semibold mb-4">颜色分析</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{rgb?.r}</div>
            <div className="text-sm text-muted-foreground">红色值</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{rgb?.g}</div>
            <div className="text-sm text-muted-foreground">绿色值</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{rgb?.b}</div>
            <div className="text-sm text-muted-foreground">蓝色值</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
