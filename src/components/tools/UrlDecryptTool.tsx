import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lock, Unlock, Copy, Check, Link, Globe } from 'lucide-react';
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

// 解析URL结构
interface ParsedUrl {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
}

const parseUrl = (url: string): ParsedUrl | null => {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    // 解析查询参数
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      protocol: urlObj.protocol,
      host: urlObj.host,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      params
    };
  } catch (error) {
    console.error('URL解析失败:', error);
    return null;
  }
};

// 复制按钮组件
interface CopyButtonProps {
  text: string;
  label: string;
  size?: 'sm' | 'default';
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label, size = 'sm' }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      trackButtonClick('url_decrypt', `copy_${label}`);
      toast({
        title: '复制成功',
        description: `${label}已复制到剪贴板`,
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
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
    <Button
      variant="outline"
      size={size}
      onClick={handleCopy}
      className={size === 'sm' ? 'h-7 px-2' : ''}
    >
      {isCopied ? (
        <>
          <Check className="mr-1 h-3 w-3" />
          已复制
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" />
          复制
        </>
      )}
    </Button>
  );
};

const UrlDecryptTool: React.FC = () => {
  const [encryptedUrl, setEncryptedUrl] = useState('');
  const [systemUrl, setSystemUrl] = useState(DEFAULT_SYSTEM_URL);
  const [decryptedUrl, setDecryptedUrl] = useState('');
  const [decodedUrl, setDecodedUrl] = useState(''); // 存储解码后的URL用于显示
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null); // 存储解析后的URL结构
  const [isDecrypting, setIsDecrypting] = useState(false);
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
    setParsedUrl(null);

    try {
      const result = await (window.electron as any).decryptUrl(encryptedUrl, systemUrl);
      
      if (result.success && result.decryptedUrl) {
        setDecryptedUrl(result.decryptedUrl);
        // 对解密后的URL进行解码
        const decoded = decodeUrl(result.decryptedUrl);
        setDecodedUrl(decoded);
        // 解析URL结构
        const parsed = parseUrl(decoded);
        setParsedUrl(parsed);
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
            <div className="space-y-6 mt-6">
              {/* 完整URL展示 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    完整URL
                  </Label>
                  <CopyButton text={decodedUrl} label="完整URL" />
                </div>
                <div className="p-3 bg-muted rounded-lg border">
                  <p className="text-sm break-all font-mono">{decodedUrl}</p>
                </div>
              </div>

              {/* URL结构解析 */}
              {parsedUrl && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Globe className="w-4 h-4" />
                      URL结构解析
                    </Label>

                    {/* 基本信息 */}
                    <div className="space-y-4">
                      {parsedUrl.host && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">主机</Label>
                            <CopyButton text={parsedUrl.host} label="主机" />
                          </div>
                          <div className="p-2 bg-muted rounded border">
                            <p className="text-sm font-mono">{parsedUrl.host}</p>
                          </div>
                        </div>
                      )}

                      {parsedUrl.pathname && parsedUrl.pathname !== '/' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">路径</Label>
                            <CopyButton text={parsedUrl.pathname} label="路径" />
                          </div>
                          <div className="p-2 bg-muted rounded border">
                            <p className="text-sm font-mono break-all">{parsedUrl.pathname}</p>
                          </div>
                        </div>
                      )}

                      {parsedUrl.hash && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">锚点</Label>
                            <CopyButton text={parsedUrl.hash} label="锚点" />
                          </div>
                          <div className="p-2 bg-muted rounded border">
                            <p className="text-sm font-mono break-all">{parsedUrl.hash}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 查询参数 */}
                    {Object.keys(parsedUrl.params).length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">查询参数</Label>
                        {/* 表头 */}
                        <div className="grid grid-cols-3 gap-2 p-2 bg-muted rounded border text-sm font-bold">
                          <div>参数名</div>
                          <div>参数值</div>
                          <div className="text-center">操作</div>
                        </div>
                        {/* 参数列表 */}
                        <div className="space-y-1">
                          {(() => {
                            // 定义重要参数
                            const importantParams = ['RowGuid', 'ProcessVersionInstanceGuid'];
                            
                            // 分离重要参数和普通参数
                            const entries = Object.entries(parsedUrl.params);
                            const importantEntries = entries.filter(([key]) => importantParams.includes(key));
                            const normalEntries = entries.filter(([key]) => !importantParams.includes(key));
                            
                            // 按重要性排序重要参数
                            const sortedImportantEntries = importantEntries.sort(([keyA], [keyB]) => {
                              const indexA = importantParams.indexOf(keyA);
                              const indexB = importantParams.indexOf(keyB);
                              return indexA - indexB;
                            });
                            
                            // 合并排序后的参数
                            const sortedEntries = [...sortedImportantEntries, ...normalEntries];
                            
                            return sortedEntries.map(([key, value]) => {
                              const isImportant = importantParams.includes(key);
                              return (
                                <div key={key} className="grid grid-cols-3 gap-2 p-2 bg-muted rounded border items-center">
                                  <div className={`text-sm font-mono break-all ${isImportant ? 'font-bold' : ''}`}>{key}</div>
                                  <div className={`text-sm font-mono break-all ${isImportant ? 'font-bold' : ''}`}>{value}</div>
                                  <div className="flex justify-center">
                                    <CopyButton text={value} label={`参数值: ${key}`} />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UrlDecryptTool;
