import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateApiDoc, convertToFormat } from '@/lib/apiDocService';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Clock } from 'lucide-react';

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

export default function ApiDocGenerator() {
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<'html' | 'word' | 'pdf' | 'markdown'>('markdown');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null);

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

  const handleGenerate = async () => {
    if (!code.trim()) {
      toast({
        title: "错误",
        description: "请输入接口代码",
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

      // 转换格式并下载
      const blob = await convertToFormat(docContent, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-documentation.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "成功",
        description: `接口文档已生成并开始下载，耗时 ${totalTime.toFixed(1)} 秒`,
      });
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

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          粘贴您的接口代码，我们将为您生成专业的接口文档。
        </p>
        {lastGenerationTime && !isGenerating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>上次生成耗时: {lastGenerationTime.toFixed(1)} 秒</span>
          </div>
        )}
      </div>

      <Textarea
        placeholder="在此输入接口代码..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="min-h-[300px] font-mono"
      />

      <div className="flex items-center gap-4">
        <Select value={format} onValueChange={(value: 'html' | 'word' | 'pdf' | 'markdown') => setFormat(value)}>
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
          disabled={isGenerating}
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
  );
} 