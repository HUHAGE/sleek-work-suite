import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Unlock, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DbDecryptTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      toast({
        title: '错误',
        description: '请输入密文',
        variant: 'destructive',
      });
      return;
    }

    setIsDecrypting(true);
    setOutputText('');
    setIsCopied(false);

    try {
      // 解析输入的密文
      const urlMatch = inputText.match(/url=\{SM4_1::\}([A-F0-9]+)/);
      const usernameMatch = inputText.match(/username=\{SM4_1::\}([A-F0-9]+)/);
      const passwordMatch = inputText.match(/password=\{SM4_1::\}([A-F0-9]+)/);

      if (!urlMatch || !usernameMatch || !passwordMatch) {
        toast({
          title: '格式错误',
          description: '请按照正确的格式输入密文',
          variant: 'destructive',
        });
        setIsDecrypting(false);
        return;
      }

      const urlCipher = urlMatch[1];
      const usernameCipher = usernameMatch[1];
      const passwordCipher = passwordMatch[1];

      // 调用后台解密
      const result = await (window.electron as any).decryptDbConfig({
        urlCipher,
        usernameCipher,
        passwordCipher
      });

      if (result.success) {
        const output = `url=${result.url}\nusername=${result.username}\npassword=${result.password}`;
        setOutputText(output);
        toast({
          title: '解密成功',
          description: '数据库配置已成功解密',
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      toast({
        title: '复制成功',
        description: '解密结果已复制到剪贴板',
      });
      
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

  const insertSample = () => {
    const sample = `url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username={SM4_1::}F4735284672EFED7FF0389BAD2B93DAC
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9`;
    setInputText(sample);
    toast({
      title: '已插入示例',
      description: '示例密文已填充到输入框',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            数据库快速加解密
          </CardTitle>
          <CardDescription>
            通过系统控制台自动解密数据库配置信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input-text">密文输入</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={insertSample}
                className="h-8"
              >
                插入示例
              </Button>
            </div>
            <Textarea
              id="input-text"
              placeholder="请按照以下格式输入：&#10;url={SM4_1::}密文&#10;username={SM4_1::}密文&#10;password={SM4_1::}密文"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
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

          {outputText && (
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="output-text">解密结果</Label>
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
                <pre className="text-sm whitespace-pre-wrap break-all font-mono">{outputText}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DbDecryptTool;
