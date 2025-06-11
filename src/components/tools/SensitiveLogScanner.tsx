import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, FolderOpen, Search, ExternalLink, X, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_FILE_EXTENSIONS } from '@/types/file-types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MAX_HISTORY = 10;

interface ScanResult {
  filePath: string;
  fileType: string;
  line: number;
  content: string;
  sensitiveWord: string;
}

// 支持的文件类型
const FILE_TYPES = [
  { ext: '.java', name: 'Java' },
  { ext: '.html', name: 'HTML' },
  { ext: '.js', name: 'JavaScript' },
] as const;

// 默认选中的文件类型（除了 JavaScript）
const DEFAULT_SELECTED_TYPES = FILE_TYPES
  .filter(type => type.name !== 'JavaScript')
  .map(type => type.ext);

const defaultSensitiveWords = [
  "danweiguid",
  "danweiname",
  "单位唯一标识",
  "单位名称",
  "专家名称",
  "密码",
  "password",
  "联系电话",
  "身份证号"
];

export function SensitiveLogScanner() {
  const [projectPath, setProjectPath] = useState<string>("");
  const [customWords, setCustomWords] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [sensitiveWords, setSensitiveWords] = useState<string[]>(defaultSensitiveWords);
  const [useDefaultWords, setUseDefaultWords] = useState(true);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(DEFAULT_SELECTED_TYPES);
  const { toast } = useToast();

  // 加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      const history = localStorage.getItem('sensitiveLogPathHistory')
      if (history) {
        setPathHistory(JSON.parse(history))
      }
    }
    loadHistory()
  }, [])

  // 保存路径到历史记录
  const saveToHistory = (newPath: string) => {
    if (!newPath || pathHistory.includes(newPath)) return
    
    const newHistory = [newPath, ...pathHistory].slice(0, MAX_HISTORY)
    setPathHistory(newHistory)
    localStorage.setItem('sensitiveLogPathHistory', JSON.stringify(newHistory))
  }

  // 从历史记录中删除路径
  const removeFromHistory = (pathToRemove: string) => {
    const newHistory = pathHistory.filter(p => p !== pathToRemove)
    setPathHistory(newHistory)
    localStorage.setItem('sensitiveLogPathHistory', JSON.stringify(newHistory))
  }

  const handleSelectPath = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-directory');
      if (result) {
        setProjectPath(result);
        saveToHistory(result);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      toast({
        title: "选择目录失败",
        description: "请检查目录权限",
        variant: "destructive"
      });
    }
  };

  const handleOpenPath = async () => {
    if (!projectPath) {
      toast({
        title: "路径为空",
        description: "请先选择路径",
        variant: "destructive"
      });
      return;
    }
    try {
      await window.electron.ipcRenderer.invoke('open-path', projectPath);
      toast({
        title: "打开路径",
        description: "已打开指定路径",
      });
    } catch (error) {
      console.error('打开路径失败:', error);
      toast({
        title: "打开失败",
        description: "无法打开路径，请检查路径是否存在",
        variant: "destructive"
      });
    }
  };

  const handleScan = async () => {
    if (!projectPath) {
      toast({
        title: "路径为空",
        description: "请先选择项目路径",
        variant: "destructive"
      });
      return;
    }

    if (selectedFileTypes.length === 0) {
      toast({
        title: "未选择文件类型",
        description: "请至少选择一种要扫描的文件类型",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      const scanResults = await window.electron.ipcRenderer.invoke('scan-sensitive-logs', {
        projectPath,
        sensitiveWords,
        fileTypes: selectedFileTypes
      });
      setResults(scanResults);
      toast({
        title: "扫描完成",
        description: `共发现 ${scanResults.length} 处敏感信息`,
      });
    } catch (error) {
      console.error("扫描出错:", error);
      toast({
        title: "扫描失败",
        description: "扫描过程中出错：" + error.message,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCustomWordsChange = (value: string) => {
    setCustomWords(value);
    if (!useDefaultWords) {
      setSensitiveWords(value.split(",").map(word => word.trim()).filter(Boolean));
    }
  };

  const toggleDefaultWords = (checked: boolean) => {
    setUseDefaultWords(checked);
    setSensitiveWords(checked ? defaultSensitiveWords : 
      customWords.split(",").map(word => word.trim()).filter(Boolean));
  };

  // 处理文件类型选择
  const handleFileTypeChange = (checked: boolean, fileType: string) => {
    setSelectedFileTypes(prev => 
      checked 
        ? [...prev, fileType]
        : prev.filter(type => type !== fileType)
    );
  };

  // 导出扫描结果
  const handleExport = async () => {
    if (results.length === 0) {
      toast({
        title: "无数据可导出",
        description: "请先进行扫描",
        variant: "destructive"
      });
      return;
    }

    try {
      // 构建CSV内容
      const headers = ['序号', '敏感词', '文件类型', '敏感段落', '行号', '文件路径'];
      const rows = results.map((result, index) => [
        (index + 1).toString(),
        result.sensitiveWord,
        result.fileType,
        result.content,
        result.line.toString(),
        result.filePath
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // 调用主进程保存文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultPath = `sensitive-logs-scan-${timestamp}.csv`;
      
      await window.electron.ipcRenderer.invoke('save-file', {
        defaultPath,
        fileContent: csvContent
      });

      toast({
        title: "导出成功",
        description: "扫描结果已保存",
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: "导出失败",
        description: error.message || "导出过程中出错",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-primary" />
          <h2 className="text-2xl font-bold">敏感日志扫描工具</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="请输入或选择要扫描的项目路径..."
                className="flex-1"
              />
              {pathHistory.length > 0 && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="shrink-0 w-[120px]">
                      历史记录
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[500px]" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="搜索历史路径..." />
                      <CommandEmpty>未找到匹配的路径</CommandEmpty>
                      <CommandGroup>
                        {pathHistory.map((historyPath) => (
                          <CommandItem
                            key={historyPath}
                            onSelect={() => {
                              setProjectPath(historyPath)
                              setOpen(false)
                            }}
                            className="flex justify-between items-center"
                          >
                            <span className="truncate flex-1 mr-4">{historyPath}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromHistory(historyPath)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Button onClick={handleSelectPath} variant="outline" className="shrink-0">
              <FolderOpen className="w-4 h-4 mr-2" />
              选择
            </Button>
            <Button onClick={handleOpenPath} variant="outline" className="shrink-0">
              <ExternalLink className="w-4 h-4 mr-2" />
              打开
            </Button>
            <Button onClick={handleScan} disabled={!projectPath || isScanning} className="shrink-0">
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  扫描中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  扫描
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">选择要扫描的文件类型：</h4>
              <div className="grid grid-cols-3 gap-4">
                {FILE_TYPES.map((type) => (
                  <div key={type.ext} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.ext}
                      checked={selectedFileTypes.includes(type.ext)}
                      onCheckedChange={(checked) => handleFileTypeChange(!!checked, type.ext)}
                    />
                    <Label htmlFor={type.ext}>
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-default"
                  checked={useDefaultWords}
                  onCheckedChange={toggleDefaultWords}
                />
                <Label htmlFor="use-default">使用默认敏感词</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-words">自定义敏感词（用逗号分隔）</Label>
                <Input
                  id="custom-words"
                  placeholder="输入自定义敏感词，用逗号分隔"
                  value={customWords}
                  onChange={(e) => handleCustomWordsChange(e.target.value)}
                  disabled={useDefaultWords}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-card">
        <h3 className="text-lg font-semibold mb-4">当前使用的敏感词：</h3>
        <Card className="p-4">
          <ScrollArea className="h-20">
            <div className="space-x-2">
              {sensitiveWords.map((word, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 rounded px-2 py-1 text-sm mb-2 mr-2"
                >
                  {word}
                </span>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">扫描结果：</h3>
            <Button onClick={handleExport} variant="outline" className="shrink-0">
              <FileDown className="w-4 h-4 mr-2" />
              导出结果
            </Button>
          </div>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">序号</TableHead>
                  <TableHead className="w-[100px]">敏感词</TableHead>
                  <TableHead className="w-[100px]">文件类型</TableHead>
                  <TableHead className="w-[300px]">敏感段落</TableHead>
                  <TableHead className="w-[200px]">文件路径</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index} className="h-[100px]">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{result.sensitiveWord}</TableCell>
                    <TableCell>{result.fileType}</TableCell>
                    <TableCell className="max-w-[300px] p-0">
                      <div className="h-[100px] overflow-y-auto">
                        <div className="font-mono text-sm bg-gray-100 p-2">
                          <div className="whitespace-pre-wrap break-all">
                            {result.content}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            行号：{result.line}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]" title={result.filePath}>
                      {result.filePath}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.electron.ipcRenderer.invoke('open-path', result.filePath)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        打开
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 