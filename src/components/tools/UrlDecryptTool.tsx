import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackToolUsage, trackButtonClick } from '@/lib/analytics';

const DEFAULT_SYSTEM_URL = 'http://www.njsggzy.cn:181/epoint-ssonew_cs/default/login_tp';

// URL解码函数，支持多次解码直到完全解码
const decodeUrl = (url: string): string => {
  try {
    let decoded = url;
    let prevDecoded = '';
    
    // 循环解码，直到无法再解码为止（处理多次编码的情况）
    while (decoded !== prevDecoded) {
      prevDecoded = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // 如果解码失败，返回当前结果
        break;
      }
    }
    
    return decoded;
  } catch (error) {
    console.error('URL解码失败:', error);
    return url; // 解码失败时返回原始URL
  }
};

const UrlDecryptTool: React.FC = () => {
  const [encryptedUrl, setEncryptedUrl] = useState('');
  const [systemUrl, setSystemUrl] = useState(DEFAULT_SYSTEM_URL);
  const [decryptedUrl, setDecryptedUrl] = useState('');
  const [decodedUrl, setDecodedUrl] = useState(''); // 存储解码后的URL用于显示
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleDecrypt = async () => {
    trackToolUsage('url_decrypt', 'decrypt_start');
    
    if (!encryptedUrl.trim()) {
      toast({
        title: '错误',
        description: '请输入加密的URL',
        variant: 'destructive',
      });
      return;
    }

    if (!systemUrl.trim()) {
      toast({
        title: '错误',
        description: '请输入利用的系统地址',
        variant: 'destructive',
      });
      return;
    }

    setIsDecrypting(true);
    setDecryptedUrl('');
    setDecodedUrl('');
    setIsCopied(false);

    try {
      const result = await (window.electron as any).decryptUrl(encryptedUrl, systemUrl);
      
      if (result.success && result.decryptedUrl) {
        setDecryptedUrl(result.decryptedUrl);
        // 对解密后的URL进行解码
        const decoded = decodeUrl(result.decryptedUrl);
        setDecodedUrl(decoded);
        trackToolUsage('url_decrypt', 'decrypt_success');
        toast({
          title: '解密成功',
          description: 'URL已成功解密',
        });
      } else {
        trackToolUsage('url_decrypt', 'decrypt_failed');
        toast({
          title: '解密失败',
          description: result.error || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('解密失败:', error);
      toast({
        title: '解密失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = async () => {
    try {
      // 复制解码后的URL
      await navigator.clipboard.writeText(decodedUrl);
      setIsCopied(true);
      trackButtonClick('url_decrypt', 'copy_result');
      toast({
        title: '复制成功',
        description: '解密后的URL已复制到剪贴板',
      });
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('复制失败:', error);
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border/50 dark:border-border dark:bg-card/80 dark:shadow-md dark:shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            URL解密工具
          </CardTitle>
          <CardDescription>
            通过系统控制台调用 Util.decryptUrlParams() 方法解密URL参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encrypted-url">加密的URL</Label>
            <Input
              id="encrypted-url"
              placeholder="请输入加密的URL"
              value={encryptedUrl}
              onChange={(e) => setEncryptedUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-url">利用的系统地址</Label>
            <Input
              id="system-url"
              placeholder="例如: http://localhost:8080"
              value={systemUrl}
              onChange={(e) => setSystemUrl(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleDecrypt} 
            disabled={isDecrypting}
            className="w-full"
          >
            {isDecrypting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                解密中...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                解密
              </>
            )}
          </Button>

          {decryptedUrl && (
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="decrypted-url">解密后的URL</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm break-all">{decodedUrl}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UrlDecryptTool;
