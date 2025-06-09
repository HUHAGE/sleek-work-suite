
import { useState } from 'react';
import { QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const QRGenerator = () => {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const { toast } = useToast();

  const generateQRCode = () => {
    if (!text.trim()) return '';
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
  };

  const downloadQR = async () => {
    if (!text.trim()) {
      toast({
        title: "请输入内容",
        description: "请先输入要生成二维码的内容",
        variant: "destructive"
      });
      return;
    }

    const qrUrl = generateQRCode();
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "下载成功",
        description: "二维码已保存到本地",
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载二维码，请重试",
        variant: "destructive"
      });
    }
  };

  const qrCodeUrl = generateQRCode();

  return (
    <div className="space-y-6">
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-6">
          <QrCode size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">二维码生成器</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区域 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">输入内容</label>
              <Textarea
                placeholder="输入要生成二维码的文本、网址等..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] bg-background/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">尺寸大小</label>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono bg-background/50 px-3 py-1 rounded">
                  {size}x{size}
                </span>
              </div>
            </div>

            <Button
              onClick={downloadQR}
              disabled={!text.trim()}
              className="w-full bg-primary hover:bg-primary/80"
            >
              <Download size={16} className="mr-2" />
              下载二维码
            </Button>
          </div>

          {/* 预览区域 */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-background/50 rounded-xl p-8 border border-border/50">
              {text.trim() ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}
                />
              ) : (
                <div 
                  className="flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border"
                  style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}
                >
                  <div className="text-center text-muted-foreground">
                    <QrCode size={48} className="mx-auto mb-2 opacity-50" />
                    <p>请输入内容</p>
                  </div>
                </div>
              )}
            </div>
            
            {text.trim() && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {text.length > 50 ? `${text.substring(0, 50)}...` : text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="tool-card">
        <h4 className="text-lg font-semibold mb-4">使用说明</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-background/30 rounded-lg p-4">
            <h5 className="font-medium mb-2">支持的内容类型</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 网址链接</li>
              <li>• 纯文本信息</li>
              <li>• 联系信息</li>
              <li>• WiFi密码</li>
            </ul>
          </div>
          <div className="bg-background/30 rounded-lg p-4">
            <h5 className="font-medium mb-2">尺寸建议</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 100-200px: 适用于名片</li>
              <li>• 200-300px: 适用于海报</li>
              <li>• 300-500px: 适用于横幅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
