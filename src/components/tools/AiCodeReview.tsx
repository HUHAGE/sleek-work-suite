import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, FileCode, Trash2, Eye, Download, Copy, CheckCircle2 } from 'lucide-react';
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
  url?: string; // 添加url字段用于API调用
}

interface ReviewResult {
  id: string;
  fileName: string;
  result: string;
  createdAt: Date;
  size: number;
  reportUrl?: string; // 添加报告链接
  htmlReport?: string; // 添加HTML报告
}

// 更新API接口格式 - API需要url字段
interface ApiCodeFile {
  url: string;
  file_type: 'document';
}

interface CodeReviewRequest {
  code_files: ApiCodeFile[];
}

interface CodeReviewResponse {
  review_report: string;
  review_report_html: string;
  report_url: string;
  feishu_sent: boolean;
  feishu_message: string;
  run_id?: string;
}

const API_URL = 'https://8pj8hj7r8w.coze.site/run';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1NWIzNDljLTE5ZWItNGVhMC1iY2YzLTYwODFmY2Q4OTIyZiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkp3QXBJWk1JajA3T3M2YVVWSlN3QW1oYzdZWWd1UkJmIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY3NTM2MTc3LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTkxMzg0NTg0NzIyMzE3MzQ3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTkxNTEwMDc1MDA1NDY4NzI2In0.Kr_GOHK8B_FTjrgD8XaGgYqFIo2HnoJNAz4MOuixxU8BgQ8VlM9bdiNMJ291I8wbeks7M1WEbIrOS1n7-VOyYcMHutinm-Kyhl2viRlQC7Xe80pfLFoUQuYaav2TokTN4q_75KMA_9SWfmkAX_EvzHTaWrlcO8NQDlatL5n4Appu5I4hg6BCKNDUchz7JYJ48q4spXGHdx3qjT7qyN3fiti0lXg8HCPai5D3MGIDND6prHHYxLHY5Il-zDUm2VUSBx-5WHHmocWZi6l1pfkhmwbz-Lf9sy_9eQiQq_tYkP86twSEaojqVBH5lIjcMlkFTyHlNgVwwPRHg18fnFOcZw';

export default function AiCodeReview() {
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const [previewResult, setPreviewResult] = useState<ReviewResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 调试：监控 codeFiles 变化
  useEffect(() => {
    console.log('codeFiles state changed:', codeFiles);
  }, [codeFiles]);

  // 从localStorage加载评审历史
  useEffect(() => {
    const savedResults = localStorage.getItem('ai-code-review-results');
    if (savedResults) {
      try {
        const results = JSON.parse(savedResults).map((result: any) => ({
          ...result,
          createdAt: new Date(result.createdAt)
        }));
        setReviewResults(results);
      } catch (error) {
        console.error('Failed to load saved results:', error);
      }
    }
  }, []);

  // 保存评审结果到localStorage
  const saveResultsToStorage = (results: ReviewResult[]) => {
    try {
      localStorage.setItem('ai-code-review-results', JSON.stringify(results));
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

    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    console.log(`Processing ${totalFiles} files`);
    
    const newFiles: CodeFile[] = [];
    let filesProcessed = 0;

    fileArray.forEach((file, index) => {
      console.log(`Reading file ${index + 1}/${totalFiles}: ${file.name}`);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log(`File ${file.name} loaded, size: ${content.length} chars`);
        
        const newFile = {
          id: crypto.randomUUID(),
          name: file.name,
          content,
          size: calculateSize(content)
        };
        
        newFiles.push(newFile);
        filesProcessed++;
        
        console.log(`Processed ${filesProcessed}/${totalFiles} files`);
        
        if (filesProcessed === totalFiles) {
          console.log('All files processed, updating state with:', newFiles);
          setCodeFiles(prevFiles => {
            const updated = [...prevFiles, ...newFiles];
            console.log('Updated codeFiles:', updated);
            return updated;
          });
          
          toast({
            title: "文件上传成功",
            description: `已添加 ${newFiles.length} 个文件`,
          });
        }
      };
      
      reader.onerror = (error) => {
        console.error(`Error reading file ${file.name}:`, error);
        filesProcessed++;
        toast({
          title: "文件读取失败",
          description: `无法读取文件: ${file.name}`,
          variant: "destructive",
        });
        
        // 即使出错也要检查是否所有文件都处理完了
        if (filesProcessed === totalFiles && newFiles.length > 0) {
          console.log('All files processed (with some errors), updating state with:', newFiles);
          setCodeFiles(prevFiles => {
            const updated = [...prevFiles, ...newFiles];
            console.log('Updated codeFiles:', updated);
            return updated;
          });
          
          toast({
            title: "部分文件上传成功",
            description: `已添加 ${newFiles.length} 个文件`,
          });
        }
      };
      
      reader.readAsText(file);
    });

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
  const handleRemoveFile = (fileId: string) => {
    setCodeFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  // 清空所有文件
  const handleClearFiles = () => {
    setCodeFiles([]);
  };

  // 创建Data URL（base64编码）
  const createDataUrl = (file: CodeFile): string => {
    const base64Content = btoa(unescape(encodeURIComponent(file.content)));
    return `data:text/plain;base64,${base64Content}`;
  };

  // 测试API连接
  const handleTestAPI = async () => {
    try {
      setIsReviewing(true);
      
      // 创建一个简单的测试文件
      const testContent = `public class TestClass {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`;
      
      const testDataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(testContent)))}`;
      
      const testData: CodeReviewRequest = {
        code_files: [{
          url: testDataUrl,
          file_type: 'document'
        }]
      };

      console.log('Testing API connection with data URL:', {
        url: API_URL,
        dataUrlLength: testDataUrl.length,
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
        description: "API连接正常，可以进行代码评审",
      });
      
    } catch (error) {
      console.error('Test API error:', error);
      toast({
        title: "API测试失败",
        description: error instanceof Error ? error.message : "网络连接错误",
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // 调用AI评审接口
  const handleReview = async () => {
    if (codeFiles.length === 0) {
      toast({
        title: "错误",
        description: "请先上传代码文件",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReviewing(true);

      // 为每个文件创建Data URL
      const apiCodeFiles: ApiCodeFile[] = codeFiles.map(file => {
        const dataUrl = createDataUrl(file);
        return {
          url: dataUrl,
          file_type: 'document'
        };
      });

      // 准备请求数据
      const requestData: CodeReviewRequest = {
        code_files: apiCodeFiles
      };

      console.log('Sending request to API:', {
        url: API_URL,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN.substring(0, 20)}...`,
          'Content-Type': 'application/json',
        },
        filesCount: codeFiles.length,
        totalContentLength: codeFiles.reduce((sum, file) => sum + file.content.length, 0),
        dataUrlsLength: apiCodeFiles.map(f => f.url.length)
      });

      // 调用API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // 尝试获取错误详情
        let errorMessage = `API请求失败: ${response.status}`;
        try {
          const errorText = await response.text();
          console.log('API error response:', errorText);
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
            } catch {
              errorMessage += ` - ${errorText}`;
            }
          }
        } catch (e) {
          console.log('Could not read error response:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('API response result:', result);
      
      // 处理不同的响应格式
      let reviewReport = '';
      let htmlReport = '';
      let reportUrl = '';
      
      if (result.review_report) {
        // 标准格式响应
        reviewReport = result.review_report;
        htmlReport = result.review_report_html || '';
        reportUrl = result.report_url || '';
      } else if (typeof result === 'string') {
        // 简单字符串响应
        reviewReport = result;
      } else {
        // JSON格式响应
        reviewReport = JSON.stringify(result, null, 2);
      }
      
      // 保存评审结果
      const newResult: ReviewResult = {
        id: crypto.randomUUID(),
        fileName: codeFiles.length === 1 ? codeFiles[0].name : `${codeFiles.length}个文件`,
        result: reviewReport,
        createdAt: new Date(),
        size: calculateSize(reviewReport),
        reportUrl: reportUrl || undefined,
        htmlReport: htmlReport || undefined
      };

      const updatedResults = [newResult, ...reviewResults];
      setReviewResults(updatedResults);
      saveResultsToStorage(updatedResults);

      toast({
        title: "评审完成",
        description: `AI代码评审已完成${result.feishu_sent ? '，已发送到飞书' : ''}`,
      });

      // 自动预览结果
      setPreviewResult(newResult);
      setPreviewOpen(true);

      // 清空已上传的文件
      setCodeFiles([]);
    } catch (error) {
      console.error('Review error:', error);
      toast({
        title: "评审失败",
        description: error instanceof Error ? error.message : "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // 预览结果
  const handlePreview = (result: ReviewResult) => {
    setPreviewResult(result);
    setPreviewOpen(true);
  };

  // 复制结果
  const handleCopy = async (result: ReviewResult) => {
    try {
      await navigator.clipboard.writeText(result.result);
      toast({
        title: "复制成功",
        description: "评审结果已复制到剪贴板",
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
  const handleDownload = (result: ReviewResult) => {
    try {
      const blob = new Blob([result.result], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-review-${result.fileName}-${formatDate(result.createdAt, 'yyyyMMdd-HHmmss')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "下载成功",
        description: "评审结果已开始下载",
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载评审结果",
        variant: "destructive",
      });
    }
  };

  // 删除评审结果
  const handleDeleteResult = (resultId: string) => {
    const updatedResults = reviewResults.filter(result => result.id !== resultId);
    setReviewResults(updatedResults);
    saveResultsToStorage(updatedResults);
    
    toast({
      title: "删除成功",
      description: "评审结果已删除",
    });
  };

  // 清空所有评审结果
  const handleClearAllResults = () => {
    setReviewResults([]);
    saveResultsToStorage([]);
    toast({
      title: "清空成功",
      description: "所有评审结果已清空",
    });
  };

  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">上传代码文件</h3>
          <p className="text-sm text-gray-500">
            上传单个或多个代码文件，AI将为您提供专业的代码评审建议。
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={triggerFileUpload}
            disabled={isReviewing}
          >
            <Upload className="w-4 h-4 mr-2" />
            选择文件
          </Button>
          
          {codeFiles.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearFiles}
              disabled={isReviewing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空文件
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".js,.ts,.java,.py,.php,.cs,.go,.rb,.cpp,.c,.h,.hpp,.jsx,.tsx,.vue,.swift,.kt,.scala,.rs,.dart,.m,.mm"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 已上传文件列表 */}
        {codeFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                已上传文件 ({codeFiles.length})
              </label>
            </div>
            <div className="border-2 border-border/50 dark:border-border rounded-lg overflow-hidden">
              <div className="max-h-[200px] overflow-y-auto">
                {codeFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileCode className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatSize(file.size)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={isReviewing}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 评审按钮 */}
        <div className="space-y-2">
          <Button
            onClick={handleReview}
            disabled={isReviewing || codeFiles.length === 0}
            className="w-full"
          >
            {isReviewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI评审中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                开始评审
              </>
            )}
          </Button>
          
          {/* 测试API按钮 */}
          <Button
            variant="outline"
            onClick={handleTestAPI}
            disabled={isReviewing}
            className="w-full"
          >
            测试API连接
          </Button>
        </div>
      </Card>

      {/* 评审历史 */}
      {reviewResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileCode size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">评审历史</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">共</span>
                <span className="font-semibold text-primary text-lg">{reviewResults.length}</span>
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
                  <TableHead className="w-[180px]">评审时间</TableHead>
                  <TableHead className="w-[120px]">报告链接</TableHead>
                  <TableHead className="w-[200px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewResults.map((result, index) => (
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
                        <a
                          href={result.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          查看报告
                        </a>
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
            <DialogTitle>评审结果 - {previewResult?.fileName}</DialogTitle>
            <DialogDescription>
              大小: {previewResult ? formatSize(previewResult.size) : ''} | 评审时间: {previewResult ? formatDate(previewResult.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''}
              {previewResult?.reportUrl && (
                <>
                  {' | '}
                  <a
                    href={previewResult.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    查看完整HTML报告
                  </a>
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
                onClick={() => window.open(previewResult.reportUrl, '_blank')}
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
