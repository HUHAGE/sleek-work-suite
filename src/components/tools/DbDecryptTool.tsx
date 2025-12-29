import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock, Unlock, Copy, Check, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DbDecryptTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEncryptMode, setIsEncryptMode] = useState(false); // false=解密, true=加密
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

    setIsProcessing(true);
    setOutputText('');
    setIsCopied(false);

    try {
      // 解析输入的密文
      const urlMatch = inputText.match(/url=\{SM4_1::\}([A-F0-9]+)/i);
      const usernameMatch = inputText.match(/username=\{SM4_1::\}([A-F0-9]+)/i);
      const passwordMatch = inputText.match(/password=\{SM4_1::\}([A-F0-9]+)/i);

      if (!urlMatch || !usernameMatch || !passwordMatch) {
        toast({
          title: '格式错误',
          description: '请按照正确的格式输入密文',
          variant: 'destructive',
        });
        setIsProcessing(false);
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
      setIsProcessing(false);
    }
  };

  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      toast({
        title: '错误',
        description: '请输入明文',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setOutputText('');
    setIsCopied(false);

    try {
      // 解析输入的明文
      const urlMatch = inputText.match(/url=([^\n]+)/);
      const usernameMatch = inputText.match(/username=([^\n]+)/);
      const passwordMatch = inputText.match(/password=([^\n]+)/);

      if (!urlMatch || !usernameMatch || !passwordMatch) {
        toast({
          title: '格式错误',
          description: '请按照正确的格式输入明文（url=xxx username=xxx password=xxx）',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      const urlPlain = urlMatch[1].trim();
      const usernamePlain = usernameMatch[1].trim();
      const passwordPlain = passwordMatch[1].trim();

      // 调用后台加密
      const result = await (window.electron as any).encryptDbConfig({
        urlPlain,
        usernamePlain,
        passwordPlain
      });

      if (result.success) {
        const output = `url={SM4_1::}${result.urlCipher}\nusername={SM4_1::}${result.usernameCipher}\npassword={SM4_1::}${result.passwordCipher}`;
        setOutputText(output);
        toast({
          title: '加密成功',
          description: '数据库配置已成功加密',
        });
      } else {
        toast({
          title: '加密失败',
          description: result.error || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('加密失败:', error);
      toast({
        title: '加密失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (isEncryptMode) {
      handleEncrypt();
    } else {
      handleDecrypt();
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
    if (isEncryptMode) {
      // 加密模式示例
      const sample = `url=jdbc:sqlserver://localhost;databaseName=epointbid_JAVAYEWU_test
username=sa
password=123456`;
      setInputText(sample);
      toast({
        title: '已插入示例',
        description: '示例明文已填充到输入框',
      });
    } else {
      // 解密模式示例
      const sample = `url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username={SM4_1::}F4735284672EFED7FF0389BAD2B93DAC
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9`;
      setInputText(sample);
      toast({
        title: '已插入示例',
        description: '示例密文已填充到输入框',
      });
    }
  };

  const handleModeChange = (checked: boolean) => {
    setIsEncryptMode(checked);
    setInputText('');
    setOutputText('');
    setIsCopied(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            数据库快速加解密
          </CardTitle>
          <CardDescription>
            通过系统控制台自动加密或解密数据库配置信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 模式切换 */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Unlock className={`w-5 h-5 ${!isEncryptMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${!isEncryptMode ? 'text-primary' : 'text-muted-foreground'}`}>
                解密模式
              </span>
            </div>
            <Switch
              checked={isEncryptMode}
              onCheckedChange={handleModeChange}
              className="data-[state=checked]:bg-primary"
            />
            <div className="flex items-center gap-3">
              <span className={`font-medium ${isEncryptMode ? 'text-primary' : 'text-muted-foreground'}`}>
                加密模式
              </span>
              <Lock className={`w-5 h-5 ${isEncryptMode ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input-text">
                {isEncryptMode ? '明文输入' : '密文输入'}
              </Label>
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
              placeholder={
                isEncryptMode
                  ? '请按照以下格式输入：\nurl=jdbc:sqlserver://localhost;databaseName=xxx\nusername=sa\npassword=123456'
                  : '请按照以下格式输入：\nurl={SM4_1::}密文\nusername={SM4_1::}密文\npassword={SM4_1::}密文'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEncryptMode ? '加密中...' : '解密中...'}
              </>
            ) : (
              <>
                {isEncryptMode ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    加密
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    解密
                  </>
                )}
              </>
            )}
          </Button>

          {outputText && (
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="output-text">
                  {isEncryptMode ? '加密结果' : '解密结果'}
                </Label>
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
