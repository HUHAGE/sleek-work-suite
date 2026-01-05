import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, FileText, Trash2, Eye, Download, Copy, CheckCircle2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format as formatDate } from 'date-fns';

interface CodeFile {
  id: string;
  name: string;
  content: string;
  size: number;
}

interface ApiDocResult {
  id: string;
  fileName: string;
  result: string;
  createdAt: Date;
  size: number;
  reportUrl?: string;
  htmlReport?: string;
}

interface CozeApiDocRequest {
  java_file: {
    name: string;
    content: string;
    url: string;
  };
}

const API_URL = 'https://qxwkzdftrg.coze.site/run';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjJhYzk5MmRhLWEzODItNDIyMC04NTA0LWFjNGY1YzIzZDM3NSJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbImNUcUVYS2hDeHl6eTVBUTZIMDhMcGMzRDk1Und2bUMxIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NTgxMTk2LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkxMTA4NTQ4MTk3OTQxMjkwIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxNzAzNDMyNzk3MzU2MDcyIn0.kwJ53S7bORpOdgqyAWVwYGHUWzZoqq1BsCL_F1vKO9rO7l_Y2mE617VeJtR9_4qatXEjxM9ZIyoZ30BRBNFNQIlUXZwIpOhv-x7DEAEJSyIaviB-D-2WSVxlfSiMNWp0pfEBlAzZztk876A2n0u_24omTi9D9aV1hq9oyEdsPMXgutKEecWhE_W5rF-NrjqetheMjTcig4WpuP-EWWd2GwrJk7bnOlFLzprn1Ptz-o4KFUerG9KgmnOEUVMZrk4df29v9xMfhqMK2fI6lTR4WNrzGkcCs9CVPncQponN2NtKjdQFmUjloes5hcBKcyqpJCl8-AAi9K_pP_fIY-XwGw';

export default function CozeApiDocGenerator() {
  const [codeFile, setCodeFile] = useState<CodeFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docResults, setDocResults] = useState<ApiDocResult[]>([]);
  const [previewResult, setPreviewResult] = useState<ApiDocResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从localStorage加载生成历史
  useEffect(() => {
    const savedResults = localStorage.getItem('coze-api-doc-results');
    if (savedResults) {
      try {
        const results = JSON.parse(savedResults).map((result: any) => ({
          ...result,
          createdAt: new Date(result.createdAt)
        }));
        setDocResults(results);
      } catch (error) {
        console.error('Failed to load saved results:', error);
      }
    }
  }, []);

  // 保存结果到localStorage
  const saveResultsToStorage = (results: ApiDocResult[]) => {
    try {
      localStorage.setItem('coze-api-doc-results', JSON.stringify(results));
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  };

  // 计算文件大小
  const calculateSize = (content: string): number => {
    return new Blob([content]).size;
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('File input changed, files:', files);
    
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    // 只处理第一个文件
    const file = files[0];
    console.log(`Processing file: ${file.name}`);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log(`File ${file.name} loaded, size: ${content.length} chars`);
      
      const newFile: CodeFile = {
        id: crypto.randomUUID(),
        name: file.name,
        content,
        size: calculateSize(content)
      };
      
      setCodeFile(newFile);
      
      toast({
        title: "文件上传成功",
        description: `已加载文件: ${file.name}`,
      });
    };
    
    reader.onerror = (error) => {
      console.error(`Error reading file ${file.name}:`, error);
      toast({
        title: "文件读取失败",
        description: `无法读取文件: ${file.name}`,
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);

    // 重置input以允许重复上传相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 删除文件
  const handleRemoveFile = () => {
    setCodeFile(null);
  };

  // 清空文件
  const handleClearFile = () => {
    setCodeFile(null);
  };

  // 创建Data URL（base64编码）
  const createDataUrl = (file: CodeFile): string => {
    const base64Content = btoa(encodeURIComponent(file.content));
    return `data:text/plain;base64,${base64Content}`;
  };

  // 重试机制的API调用函数
  const callApiWithRetry = async (requestData: CozeApiDocRequest, maxRetries = 3): Promise<any> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API调用尝试 ${attempt}/${maxRetries}`);
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        console.log(`尝试 ${attempt} - API response status:`, response.status);
        console.log(`尝试 ${attempt} - API response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`尝试 ${attempt} - API error response:`, errorText);
          
          let errorMessage = `API请求失败: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage += ` - ${errorJson.message || errorJson.msg || errorJson.error || errorText}`;
            
            // 检查是否是超时错误，如果是则重试
            if (errorJson.msg && errorJson.msg.includes('timeout')) {
              if (attempt < maxRetries) {
                console.log(`检测到超时错误，等待 ${attempt * 2} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                continue;
              }
            }
          } catch {
            errorMessage += ` - ${errorText}`;
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log(`尝试 ${attempt} - API response result:`, result);
        return result;
        
      } catch (error) {
        console.error(`尝试 ${attempt} 失败:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 等待后重试
        console.log(`等待 ${attempt * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    throw lastError || new Error('未知错误');
  };

  // 测试API连接
  const handleTestAPI = async () => {
    try {
      setIsGenerating(true);
      
      // 创建一个简单的测试文件
      const testContent = `/**
 * 用户管理API
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        // 获取用户信息
        return ResponseEntity.ok(userService.findById(id));
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // 创建新用户
        return ResponseEntity.ok(userService.save(user));
    }
}`;
      
      const testDataUrl = `data:text/plain;base64,${btoa(encodeURIComponent(testContent))}`;
      
      const testData: CozeApiDocRequest = {
        java_file: {
          name: "UserController.java",
          content: testContent,
          url: testDataUrl
        }
      };

      console.log('Testing API connection with data:', {
        url: API_URL,
        contentLength: testContent.length
      });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      console.log('Test API response status:', response.status);
      console.log('Test API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `API测试失败: ${response.status}`;
        try {
          const errorText = await response.text();
          console.log('Test API error response:', errorText);
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
            } catch {
              errorMessage += ` - ${errorText}`;
            }
          }
        } catch (e) {
          console.log('Could not read test error response:', e);
        }
        
        toast({
          title: "API测试失败",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
      console.log('Test API response result:', result);
      
      toast({
        title: "API测试成功",
        description: "API连接正常，可以生成接口文档",
      });
      
    } catch (error) {
      console.error('Test API error:', error);
      toast({
        title: "API测试失败",
        description: error instanceof Error ? error.message : "网络连接错误",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 调用Coze接口文档生成API
  const handleGenerateDoc = async () => {
    if (!codeFile) {
      toast({
        title: "错误",
        description: "请先上传代码文件",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      // 准备请求数据
      const dataUrl = createDataUrl(codeFile);
      const requestData: CozeApiDocRequest = {
        java_file: {
          name: codeFile.name,
          content: codeFile.content,
          url: dataUrl
        }
      };

      console.log('Sending request to API:', {
        url: API_URL,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN.substring(0, 20)}...`,
          'Content-Type': 'application/json',
        },
        fileName: codeFile.name,
        contentLength: codeFile.content.length
      });

      // 使用重试机制调用API
      const result = await callApiWithRetry(requestData, 3);
      
      // 处理不同的响应格式
      let apiDoc = '';
      let htmlDoc = '';
      let reportUrl = '';
      
      if (result.api_documentation) {
        apiDoc = result.api_documentation;
        htmlDoc = result.documentation_html || '';
        reportUrl = result.report_url || '';
      } else if (typeof result === 'string') {
        apiDoc = result;
      } else {
        apiDoc = JSON.stringify(result, null, 2);
      }
      
      // 保存生成结果
      const newResult: ApiDocResult = {
        id: crypto.randomUUID(),
        fileName: codeFile.name,
        result: apiDoc,
        createdAt: new Date(),
        size: calculateSize(apiDoc),
        reportUrl: reportUrl || undefined,
        htmlReport: htmlDoc || undefined
      };

      const updatedResults = [newResult, ...docResults];
      setDocResults(updatedResults);
      saveResultsToStorage(updatedResults);

      toast({
        title: "文档生成完成",
        description: `Coze接口文档已生成完成`
      });

      // 自动预览结果
      setPreviewResult(newResult);
      setPreviewOpen(true);

      // 清空已上传的文件
      setCodeFile(null);
    } catch (error) {
      console.error('Generate doc error:', error);
      
      let errorMessage = "请检查网络连接后重试";
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "服务器处理超时，请稍后重试或尝试上传更小的文件";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "文档生成失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 在外部浏览器中打开链接
  const openExternalUrl = async (url: string) => {
    try {
      if (window.electron && window.electron.openExternal) {
        await window.electron.openExternal(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('打开外部链接失败:', error);
      toast({
        title: "打开链接失败",
        description: "无法在外部浏览器中打开链接",
        variant: "destructive",
      });
    }
  };

  // 预览结果
  const handlePreview = (result: ApiDocResult) => {
    setPreviewResult(result);
    setPreviewOpen(true);
  };

  const handleCopy = async (result: ApiDocResult) => {
    try {
      await navigator.clipboard.writeText(result.result);
      toast({
        title: "复制成功",
        description: "接口文档已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  // 下载结果
  const handleDownload = (result: ApiDocResult) => {
    try {
      const blob = new Blob([result.result], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-doc-${result.fileName}-${formatDate(result.createdAt, 'yyyyMMdd-HHmmss')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "下载成功",
        description: "接口文档已开始下载",
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载接口文档",
        variant: "destructive",
      });
    }
  };

  // 删除结果
  const handleDeleteResult = (resultId: string) => {
    const updatedResults = docResults.filter(result => result.id !== resultId);
    setDocResults(updatedResults);
    saveResultsToStorage(updatedResults);
    
    toast({
      title: "删除成功",
      description: "接口文档已删除",
    });
  };

  // 清空所有结果
  const handleClearAllResults = () => {
    setDocResults([]);
    saveResultsToStorage([]);
    toast({
      title: "清空成功",
      description: "所有接口文档已清空",
    });
  };

  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">上传代码文件</h3>
          <p className="text-sm text-muted-foreground">
            支持上传单个代码文件，AI将为您生成专业的接口文档。如遇超时，系统会自动重试。
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={triggerFileUpload}
            disabled={isGenerating}
          >
            <Upload className="w-4 h-4 mr-2" />
            选择文件
          </Button>
          
          {codeFile && (
            <Button
              variant="outline"
              onClick={handleClearFile}
              disabled={isGenerating}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空文件
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".js,.ts,.java,.py,.php,.cs,.go,.rb,.cpp,.c,.h,.hpp,.jsx,.tsx,.vue,.swift,.kt,.scala,.rs,.dart,.m,.mm"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 已上传文件显示 */}
        {codeFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                已上传文件
              </label>
            </div>
            <div className="border-2 border-border/50 dark:border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{codeFile.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatSize(codeFile.size)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveFile}
                  disabled={isGenerating}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateDoc}
            disabled={isGenerating || !codeFile}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                生成接口文档
              </>
            )}
          </Button>
          
          {/* 测试API按钮 */}
          <Button
            variant="outline"
            onClick={handleTestAPI}
            disabled={isGenerating}
            className="flex-1"
          >
            测试API连接
          </Button>
        </div>
      </Card>

      {/* 生成历史 */}
      {docResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">生成历史</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">共</span>
                <span className="font-semibold text-primary text-lg">{docResults.length}</span>
                <span className="text-muted-foreground">条记录</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllResults}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空全部
            </Button>
          </div>

          <div className="border-2 border-border/50 dark:border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">序号</TableHead>
                  <TableHead className="min-w-[200px]">文件名</TableHead>
                  <TableHead className="w-[100px]">大小</TableHead>
                  <TableHead className="w-[180px]">生成时间</TableHead>
                  <TableHead className="w-[120px]">报告链接</TableHead>
                  <TableHead className="w-[200px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docResults.map((result, index) => (
                  <TableRow key={result.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{result.fileName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(result.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(result.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {result.reportUrl ? (
                        <button
                          onClick={() => openExternalUrl(result.reportUrl!)}
                          className="text-primary hover:underline text-sm cursor-pointer bg-transparent border-none"
                        >
                          查看报告
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-sm">无链接</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(result)}
                          className="hover:bg-primary/20"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(result)}
                          className="hover:bg-primary/20"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(result)}
                          className="hover:bg-primary/20"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteResult(result.id)}
                          className="hover:bg-destructive/20 text-destructive"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>接口文档 - {previewResult?.fileName}</DialogTitle>
            <DialogDescription>
              大小: {previewResult ? formatSize(previewResult.size) : ''} | 生成时间: {previewResult ? formatDate(previewResult.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''}
              {previewResult?.reportUrl && (
                <>
                  {' | '}
                  <button
                    onClick={() => openExternalUrl(previewResult.reportUrl!)}
                    className="text-primary hover:underline cursor-pointer bg-transparent border-none"
                  >
                    查看完整HTML报告
                  </button>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="p-4 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewResult?.result}
              </pre>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            {previewResult?.reportUrl && (
              <Button
                variant="outline"
                onClick={() => openExternalUrl(previewResult.reportUrl!)}
              >
                <Eye className="w-4 h-4 mr-2" />
                查看HTML报告
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => previewResult && handleCopy(previewResult)}
            >
              <Copy className="w-4 h-4 mr-2" />
              复制结果
            </Button>
            <Button
              onClick={() => previewResult && handleDownload(previewResult)}
            >
              <Download className="w-4 h-4 mr-2" />
              下载结果
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}