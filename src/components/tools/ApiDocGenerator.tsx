import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { generateApiDoc, convertToFormat } from '@/lib/apiDocService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Clock, Upload, FileText, Download, Trash2, Eye, Copy } from 'lucide-react';
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

const loadingMessages = [
  "AI正在卖力地生成文档...",
  "正在解读代码的奥秘...",
  "让我想想怎么写更专业...",
  "正在组织语言，马上就好...",
  "努力提炼代码精华中...",
  "正在发挥创意写文档...",
  "让文档更专业一点...",
  "正在检查文档细节...",
  "快要完成了，再等等...",
  "正在打磨文档格式...",
];

interface GeneratedDoc {
  id: string;
  name: string;
  format: 'html' | 'word' | 'pdf' | 'markdown';
  content: string;
  createdAt: Date;
  size: number;
}

export default function ApiDocGenerator() {
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<'html' | 'word' | 'pdf' | 'markdown'>('markdown');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从localStorage加载已生成的文档
  useEffect(() => {
    const savedDocs = localStorage.getItem('generated-api-docs');
    if (savedDocs) {
      try {
        const docs = JSON.parse(savedDocs).map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt)
        }));
        setGeneratedDocs(docs);
      } catch (error) {
        console.error('Failed to load saved docs:', error);
      }
    }
  }, []);

  // 保存文档到localStorage
  const saveDocsToStorage = (docs: GeneratedDoc[]) => {
    try {
      localStorage.setItem('generated-api-docs', JSON.stringify(docs));
    } catch (error) {
      console.error('Failed to save docs:', error);
      toast({
        title: "保存失败",
        description: "无法保存文档到本地存储",
        variant: "destructive",
      });
    }
  };

  // 定时更新加载消息
  useEffect(() => {
    if (!isGenerating) return;

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[currentIndex]);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isGenerating]);

  // 计时器效果
  useEffect(() => {
    if (!isGenerating || !startTime) return;

    const intervalId = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isGenerating, startTime]);

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      // 自动设置文档名称为文件名（去掉扩展名）
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setDocName(fileName);
      toast({
        title: "文件上传成功",
        description: `已加载文件: ${file.name}`,
      });
    };
    reader.readAsText(file);
  };

  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 计算文档大小
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

  const handleGenerate = async () => {
    if (!code.trim()) {
      toast({
        title: "错误",
        description: "请输入接口代码或上传代码文件",
        variant: "destructive",
      });
      return;
    }

    if (!docName.trim()) {
      toast({
        title: "错误",
        description: "请输入文档名称",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingMessage(loadingMessages[0]);
      const genStartTime = Date.now();
      setStartTime(genStartTime);
      setElapsedTime(0);
      
      // 生成文档内容
      const docContent = await generateApiDoc({ code, format });
      const genEndTime = Date.now();
      const totalTime = (genEndTime - genStartTime) / 1000;
      setLastGenerationTime(totalTime);

      // 创建新的文档记录
      const newDoc: GeneratedDoc = {
        id: crypto.randomUUID(),
        name: docName.trim(),
        format,
        content: docContent,
        createdAt: new Date(),
        size: calculateSize(docContent)
      };

      // 添加到文档列表并保存
      const updatedDocs = [newDoc, ...generatedDocs];
      setGeneratedDocs(updatedDocs);
      saveDocsToStorage(updatedDocs);

      // 自动下载
      const blob = await convertToFormat(docContent, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "成功",
        description: `接口文档已生成并开始下载，耗时 ${totalTime.toFixed(1)} 秒`,
      });

      // 清空输入
      setCode('');
      setDocName('');
    } catch (error) {
      toast({
        title: "错误",
        description: "生成文档失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setStartTime(null);
    }
  };

  // 下载文档
  const handleDownload = async (doc: GeneratedDoc) => {
    try {
      const blob = await convertToFormat(doc.content, doc.format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.${doc.format === 'markdown' ? 'md' : doc.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "下载成功",
        description: `文档 ${doc.name} 已开始下载`,
      });
    } catch (error) {
      toast({
        title: "下载失败",
        description: "无法下载文档，请重试",
        variant: "destructive",
      });
    }
  };

  // 删除文档
  const handleDelete = (docId: string) => {
    const updatedDocs = generatedDocs.filter(doc => doc.id !== docId);
    setGeneratedDocs(updatedDocs);
    saveDocsToStorage(updatedDocs);
    
    toast({
      title: "删除成功",
      description: "文档已从列表中删除",
    });
  };

  // 预览文档
  const handlePreview = (doc: GeneratedDoc) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  // 复制文档内容
  const handleCopy = async (doc: GeneratedDoc) => {
    try {
      await navigator.clipboard.writeText(doc.content);
      toast({
        title: "复制成功",
        description: "文档内容已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  // 清空所有文档
  const handleClearAll = () => {
    setGeneratedDocs([]);
    saveDocsToStorage([]);
    toast({
      title: "清空成功",
      description: "所有文档已清空",
    });
  };

  return (
    <div className="space-y-6">
      {/* 文档生成区域 */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">生成接口文档</h3>
          <p className="text-sm text-gray-500">
            输入接口代码或上传代码文件，我们将为您生成专业的接口文档。
          </p>
          {lastGenerationTime && !isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>上次生成耗时: {lastGenerationTime.toFixed(1)} 秒</span>
            </div>
          )}
        </div>

        {/* 文档名称输入 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">文档名称</label>
          <Input
            placeholder="请输入文档名称..."
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full"
          />
        </div>

        {/* 代码输入区域 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">接口代码</label>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileUpload}
              disabled={isGenerating}
            >
              <Upload className="w-4 h-4 mr-2" />
              上传文件
            </Button>
          </div>
          <Textarea
            placeholder="在此输入接口代码或点击上传文件..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[300px] font-mono"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.ts,.java,.py,.php,.cs,.go,.rb,.cpp,.c,.h,.hpp,.jsx,.tsx,.vue,.swift,.kt,.scala,.rs,.dart,.m,.mm"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* 生成控制区域 */}
        <div className="flex items-center gap-4">
          <Select value={format} onValueChange={(value) => setFormat(value as 'html' | 'word' | 'pdf' | 'markdown')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="选择格式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !code.trim() || !docName.trim()}
            className="w-32"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中
              </>
            ) : (
              '生成文档'
            )}
          </Button>

          {isGenerating && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground animate-pulse">
                {loadingMessage}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {elapsedTime}s
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* 生成历史列表 */}
      {generatedDocs.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">生成历史</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">共</span>
                <span className="font-semibold text-primary text-lg">{generatedDocs.length}</span>
                <span className="text-muted-foreground">个文档</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={generatedDocs.length === 0}
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
                  <TableHead className="min-w-[200px]">文档名称</TableHead>
                  <TableHead className="w-[100px]">格式</TableHead>
                  <TableHead className="w-[100px]">大小</TableHead>
                  <TableHead className="w-[180px]">创建时间</TableHead>
                  <TableHead className="w-[200px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedDocs.map((doc, index) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {doc.format.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(doc.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(doc)}
                          className="hover:bg-primary/20"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(doc)}
                          className="hover:bg-primary/20"
                          title="复制内容"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          className="hover:bg-primary/20"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
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
            <DialogTitle>文档预览 - {previewDoc?.name}</DialogTitle>
            <DialogDescription>
              格式: {previewDoc?.format.toUpperCase()} | 大小: {previewDoc ? formatSize(previewDoc.size) : ''} | 创建时间: {previewDoc ? formatDate(previewDoc.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="p-4 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewDoc?.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => previewDoc && handleCopy(previewDoc)}
            >
              <Copy className="w-4 h-4 mr-2" />
              复制内容
            </Button>
            <Button
              onClick={() => previewDoc && handleDownload(previewDoc)}
            >
              <Download className="w-4 h-4 mr-2" />
              下载文档
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 