import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UrlDecryptTool: React.FC = () => {
  const [encryptedUrl, setEncryptedUrl] = useState('');
  const [systemUrl, setSystemUrl] = useState('');
  const [decryptedUrl, setDecryptedUrl] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const { toast } = useToast();

  const handleDecrypt = async () => {
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

    try {
      const result = await (window.electron as any).decryptUrl(encryptedUrl, systemUrl);
      
      if (result.success && result.decryptedUrl) {
        setDecryptedUrl(result.decryptedUrl);
        toast({
          title: '解密成功',
          description: 'URL已成功解密',
        });
      } else {
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

  return (
    <div className="space-y-6">
      <Card>
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
              <Label htmlFor="decrypted-url">解密后的URL</Label>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm break-all">{decryptedUrl}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UrlDecryptTool;
