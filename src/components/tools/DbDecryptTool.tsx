import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Lock, Unlock, Copy, Check, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackToolUsage, trackButtonClick } from '@/lib/analytics';

const DbDecryptTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mode, setMode] = useState<'decrypt' | 'encrypt'>('decrypt'); // 'decrypt' 或 'encrypt'
  const { toast } = useToast();

  const handleDecrypt = async () => {
    trackToolUsage('db_decrypt', 'decrypt_start');
    
    if (!inputText.trim()) {
      toast({
        title: '错误',
        description: '请输入要解密的内容',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setOutputText('');
    setIsCopied(false);

    try {
      // 解析输入内容，支持灵活的格式
      const lines = inputText.trim().split('\n').map(line => line.trim()).filter(line => line);
      const results: string[] = [];
      let hasEncryptedContent = false;

      for (const line of lines) {
        // 匹配各种可能的格式
        const urlMatch = line.match(/^url\s*=\s*(.+)$/i);
        const usernameMatch = line.match(/^username\s*=\s*(.+)$/i);
        const passwordMatch = line.match(/^password\s*=\s*(.+)$/i);

        if (urlMatch) {
          const value = urlMatch[1].trim();
          // 检查是否是加密格式
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            hasEncryptedContent = true;
            // 需要解密
            const cipher = encryptedMatch[1];
            const result = await (window.electron as any).decryptSingleValue({ cipher, type: 'url' });
            if (result.success) {
              results.push(`url=${result.plaintext}`);
            } else {
              results.push(`url=解密失败: ${result.error || '未知错误'}`);
            }
          } else {
            // 已经是明文，直接保留
            results.push(`url=${value}`);
          }
        } else if (usernameMatch) {
          const value = usernameMatch[1].trim();
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            hasEncryptedContent = true;
            const cipher = encryptedMatch[1];
            const result = await (window.electron as any).decryptSingleValue({ cipher, type: 'username' });
            if (result.success) {
              results.push(`username=${result.plaintext}`);
            } else {
              results.push(`username=解密失败: ${result.error || '未知错误'}`);
            }
          } else {
            results.push(`username=${value}`);
          }
        } else if (passwordMatch) {
          const value = passwordMatch[1].trim();
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            hasEncryptedContent = true;
            const cipher = encryptedMatch[1];
            const result = await (window.electron as any).decryptSingleValue({ cipher, type: 'password' });
            if (result.success) {
              results.push(`password=${result.plaintext}`);
            } else {
              results.push(`password=解密失败: ${result.error || '未知错误'}`);
            }
          } else {
            results.push(`password=${value}`);
          }
        } else {
          // 不匹配的行，直接保留
          results.push(line);
        }
      }

      if (results.length === 0) {
        toast({
          title: '格式错误',
          description: '未找到有效的url、username或password配置',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      setOutputText(results.join('\n'));
      
      if (hasEncryptedContent) {
        trackToolUsage('db_decrypt', 'decrypt_success');
        toast({
          title: '处理完成',
          description: '数据库配置已处理完成（包含解密内容）',
        });
      } else {
        toast({
          title: '处理完成',
          description: '输入内容均为明文，无需解密',
        });
      }
    } catch (error) {
      console.error('处理失败:', error);
      trackToolUsage('db_decrypt', 'decrypt_failed');
      toast({
        title: '处理失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncrypt = async () => {
    trackToolUsage('db_decrypt', 'encrypt_start');
    
    if (!inputText.trim()) {
      toast({
        title: '错误',
        description: '请输入要加密的内容',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setOutputText('');
    setIsCopied(false);

    try {
      // 解析输入内容，支持灵活的格式
      const lines = inputText.trim().split('\n').map(line => line.trim()).filter(line => line);
      const results: string[] = [];
      let hasPlaintextContent = false;

      for (const line of lines) {
        // 匹配各种可能的格式
        const urlMatch = line.match(/^url\s*=\s*(.+)$/i);
        const usernameMatch = line.match(/^username\s*=\s*(.+)$/i);
        const passwordMatch = line.match(/^password\s*=\s*(.+)$/i);

        if (urlMatch) {
          const value = urlMatch[1].trim();
          // 检查是否已经是加密格式
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            // 已经是密文，直接保留
            results.push(`url=${value}`);
          } else {
            hasPlaintextContent = true;
            // 需要加密
            const result = await (window.electron as any).encryptSingleValue({ plaintext: value, type: 'url' });
            if (result.success) {
              results.push(`url={SM4_1::}${result.cipher}`);
            } else {
              results.push(`url=加密失败: ${result.error || '未知错误'}`);
            }
          }
        } else if (usernameMatch) {
          const value = usernameMatch[1].trim();
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            results.push(`username=${value}`);
          } else {
            hasPlaintextContent = true;
            const result = await (window.electron as any).encryptSingleValue({ plaintext: value, type: 'username' });
            if (result.success) {
              results.push(`username={SM4_1::}${result.cipher}`);
            } else {
              results.push(`username=加密失败: ${result.error || '未知错误'}`);
            }
          }
        } else if (passwordMatch) {
          const value = passwordMatch[1].trim();
          const encryptedMatch = value.match(/^\{SM4_1::\}([A-F0-9]+)$/i);
          if (encryptedMatch) {
            results.push(`password=${value}`);
          } else {
            hasPlaintextContent = true;
            const result = await (window.electron as any).encryptSingleValue({ plaintext: value, type: 'password' });
            if (result.success) {
              results.push(`password={SM4_1::}${result.cipher}`);
            } else {
              results.push(`password=加密失败: ${result.error || '未知错误'}`);
            }
          }
        } else {
          // 不匹配的行，直接保留
          results.push(line);
        }
      }

      if (results.length === 0) {
        toast({
          title: '格式错误',
          description: '未找到有效的url、username或password配置',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      setOutputText(results.join('\n'));
      
      if (hasPlaintextContent) {
        trackToolUsage('db_decrypt', 'encrypt_success');
        toast({
          title: '处理完成',
          description: '数据库配置已处理完成（包含加密内容）',
        });
      } else {
        toast({
          title: '处理完成',
          description: '输入内容均为密文，无需加密',
        });
      }
    } catch (error) {
      console.error('处理失败:', error);
      trackToolUsage('db_decrypt', 'encrypt_failed');
      toast({
        title: '处理失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (mode === 'encrypt') {
      handleEncrypt();
    } else {
      handleDecrypt();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      trackButtonClick('db_decrypt', 'copy_result');
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
    trackButtonClick('db_decrypt', `insert_sample_${mode}`);
    
    if (mode === 'encrypt') {
      // 加密模式示例 - 支持混合格式
      const sample = `url=jdbc:sqlserver://localhost;databaseName=epointbid_JAVAYEWU_test
username=sa
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9`;
      setInputText(sample);
      toast({
        title: '已插入示例',
        description: '示例内容已填充（包含明文和密文混合）',
      });
    } else {
      // 解密模式示例 - 支持混合格式
      const sample = `url={SM4_1::}63C13E74F04FD790D3F9E5A34CCB92DB7D8FEA24C1FC8016BAC98488EA980D253817DC8CE3A0983DFCAFB023B04C7ED34C9D5DA634BEC1969402C59698FDCEC6F66EC795741CC001E60B3C482B1F133406BCE661049487CE23E8DCF4711E0D76
username=sa
password={SM4_1::}1699EBEA1BD4E12CB09E7F2B1763BDB9`;
      setInputText(sample);
      toast({
        title: '已插入示例',
        description: '示例内容已填充（包含明文和密文混合）',
      });
    }
  };

  const handleModeChange = (value: string) => {
    trackButtonClick('db_decrypt', `switch_mode_${value}`);
    setMode(value as 'decrypt' | 'encrypt');
    setInputText('');
    setOutputText('');
    setIsCopied(false);
  };

  return (
    <div className="space-y-6">
      {/* 顶部功能切换 */}
      <div className="flex items-center justify-center">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-auto">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="decrypt" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              解密模式
            </TabsTrigger>
            <TabsTrigger value="encrypt" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              加密模式
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-2 border-border/50 dark:border-border dark:bg-card/80 dark:shadow-md dark:shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            数据库快速加解密
          </CardTitle>
          <CardDescription>
            通过系统控制台智能处理数据库配置信息，支持明文和密文混合输入，自动识别并处理
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input-text">
                {mode === 'encrypt' ? '输入内容（支持明文/密文混合）' : '输入内容（支持明文/密文混合）'}
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
                mode === 'encrypt'
                  ? '支持灵活输入格式，例如：\nurl=jdbc:sqlserver://localhost;databaseName=xxx\nusername=sa\npassword={SM4_1::}已加密的密码\n\n可以只输入其中一行或多行，支持明文和密文混合'
                  : '支持灵活输入格式，例如：\nurl={SM4_1::}密文\nusername=明文用户名\npassword={SM4_1::}密文\n\n可以只输入其中一行或多行，支持明文和密文混合'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="font-mono text-sm resize-none"
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
                处理中...
              </>
            ) : (
              <>
                {mode === 'encrypt' ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    智能加密
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    智能解密
                  </>
                )}
              </>
            )}
          </Button>

          {outputText && (
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="output-text">
                  处理结果
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
