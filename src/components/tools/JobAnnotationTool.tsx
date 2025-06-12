import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileCode, FolderOpen, Search, ExternalLink, Plus, X, Clock, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useUserData } from '@/lib/store/userDataManager'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JobClass {
  className: string;
  classPath: string;
  hasAnnotation: boolean;
}

interface LogEntry {
  timestamp: string;
  filePath: string;
  action: string;
}

const MAX_HISTORY = 10;

const JobAnnotationTool: React.FC = () => {
  const [path, setPath] = useState('');
  const [jobClasses, setJobClasses] = useState<JobClass[]>([]);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAddingAnnotations, setIsAddingAnnotations] = useState(false);
  const { toast } = useToast();
  
  const { jobToolsPathHistory, setJobToolsPathHistory } = useUserData();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 加载日志
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      console.log('开始加载日志');
      const loadedLogs = await window.electron.ipcRenderer.invoke('load-logs');
      console.log('获取到日志数据:', loadedLogs);
      setLogs(loadedLogs);
    } catch (error) {
      console.error('加载日志失败:', error);
    }
  };

  // 保存路径到历史记录
  const saveToHistory = (newPath: string) => {
    if (!newPath || jobToolsPathHistory.includes(newPath)) return;
    
    const newHistory = [newPath, ...jobToolsPathHistory].slice(0, MAX_HISTORY);
    setJobToolsPathHistory(newHistory);
  }

  // 从历史记录中删除路径
  const removeFromHistory = (pathToRemove: string) => {
    const newHistory = jobToolsPathHistory.filter(p => p !== pathToRemove);
    setJobToolsPathHistory(newHistory);
  }

  const handleSelectPath = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-directory');
      if (result) {
        setPath(result);
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

  const handleScan = async () => {
    if (!path) {
      toast({
        title: "路径为空",
        description: "请先选择或输入Java项目路径",
        variant: "destructive"
      });
      return;
    }
    setScanning(true);
    try {
      console.log('开始扫描路径:', path);
      const result = await window.electron.ipcRenderer.invoke('scan-job-classes', path);
      console.log('扫描结果:', result);
      setJobClasses(result);
      saveToHistory(path);
      toast({
        title: "扫描完成",
        description: `共找到 ${result.length} 个Job类`,
      });
    } catch (error) {
      console.error('扫描出错:', error);
      toast({
        title: "扫描失败",
        description: error.message || "请检查路径是否正确，以及是否包含Job类文件",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const handleOpenFile = async (classPath: string) => {
    try {
      await window.electron.ipcRenderer.invoke('open-file', classPath);
      toast({
        title: "打开文件",
        description: "已在编辑器中打开文件",
      });
    } catch (error) {
      console.error('打开文件失败:', error);
      toast({
        title: "打开失败",
        description: "无法打开文件，请检查文件是否存在",
        variant: "destructive"
      });
    }
  };

  const handleAddAnnotation = async (classPath: string) => {
    try {
      console.log('开始添加注解:', classPath);
      await window.electron.ipcRenderer.invoke('add-annotation', classPath);
      // 更新列表中的注解状态
      setJobClasses(prevClasses =>
        prevClasses.map(cls =>
          cls.classPath === classPath
            ? { ...cls, hasAnnotation: true }
            : cls
        )
      );
      // 刷新日志
      console.log('刷新日志');
      await loadLogs();
      toast({
        title: "添加成功",
        description: "已成功添加@DisallowConcurrentExecution注解",
      });
    } catch (error) {
      console.error('添加注解失败:', error);
      toast({
        title: "添加失败",
        description: "添加注解时出现错误",
        variant: "destructive"
      });
    }
  };

  const handleAddAllAnnotations = async () => {
    const unannotatedClasses = jobClasses.filter(job => !job.hasAnnotation);
    if (unannotatedClasses.length === 0) {
      toast({
        title: "提示",
        description: "没有需要添加注解的类",
      });
      return;
    }

    setIsAddingAnnotations(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const jobClass of unannotatedClasses) {
        try {
          console.log('批量添加注解:', jobClass.classPath);
          await window.electron.ipcRenderer.invoke('add-annotation', jobClass.classPath);
          successCount++;
        } catch (error) {
          console.error(`为 ${jobClass.classPath} 添加注解失败:`, error);
          failCount++;
        }
      }

      // 更新列表中的注解状态
      setJobClasses(prevClasses =>
        prevClasses.map(cls =>
          !cls.hasAnnotation ? { ...cls, hasAnnotation: true } : cls
        )
      );

      // 刷新日志
      console.log('批量添加完成，刷新日志');
      await loadLogs();

      toast({
        title: "批量添加完成",
        description: `成功: ${successCount} 个, 失败: ${failCount} 个`,
        variant: successCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('批量添加注解失败:', error);
      toast({
        title: "批量添加失败",
        description: "处理过程中出现错误",
        variant: "destructive"
      });
    } finally {
      setIsAddingAnnotations(false);
    }
  };

  const handleOpenPath = async () => {
    if (!path) {
      toast({
        title: "路径为空",
        description: "请先选择或输入路径",
        variant: "destructive"
      });
      return;
    }
    try {
      await window.electron.ipcRenderer.invoke('open-path', path);
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 路径输入区域 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <FileCode size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">Job类扫描</h3>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="请输入或选择Java项目路径..."
              className="flex-1"
            />
            {jobToolsPathHistory.length > 0 && (
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
                      {jobToolsPathHistory.map((historyPath) => (
                        <CommandItem
                          key={historyPath}
                          onSelect={() => {
                            setPath(historyPath)
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
          <Button onClick={handleScan} disabled={!path || scanning} className="shrink-0">
            <Search className="w-4 h-4 mr-2" />
            {scanning ? '扫描中...' : '扫描'}
          </Button>
          <Dialog onOpenChange={(open) => !open && setIsFullscreen(false)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Clock className="w-4 h-4 mr-2" />
                查看日志
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "duration-300 transition-all p-4",
              isFullscreen 
                ? "max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]" 
                : "max-w-4xl max-h-[80vh]"
            )}>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute right-[40px] top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isFullscreen ? '退出全屏' : '全屏'}
                </span>
              </button>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <DialogTitle>操作日志记录</DialogTitle>
                </div>
              </DialogHeader>
              <div className="text-sm text-muted-foreground mb-4 border-b pb-2">
                记录了所有Job类注解的添加历史，包括文件路径和操作时间。
              </div>
              <ScrollArea className={cn(
                "w-full rounded-md border",
                isFullscreen ? "h-[calc(95vh-180px)]" : "h-[calc(80vh-180px)]"
              )}>
                {logs.length > 0 ? (
                  <div className="space-y-1 p-4">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm py-1.5 px-2 hover:bg-muted/50 rounded-sm"
                      >
                        <span className="text-muted-foreground min-w-[160px] font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </span>
                        <span className="truncate flex-1 text-xs">
                          {log.filePath}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn(
                    "flex flex-col items-center justify-center text-muted-foreground p-4",
                    isFullscreen ? "h-[calc(95vh-180px)]" : "h-[calc(80vh-180px)]"
                  )}>
                    <Clock className="w-12 h-12 mb-4" />
                    <p className="text-lg mb-2">暂无操作日志</p>
                    <p className="text-sm text-center max-w-md">
                      当你对Job类添加@DisallowConcurrentExecution注解时，操作记录会显示在这里
                    </p>
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Job类列表 */}
      {jobClasses.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCode size={20} className="text-primary" />
              <h3 className="text-xl font-semibold">扫描结果</h3>
              <span className="text-sm text-muted-foreground ml-2">
                共 {jobClasses.length} 个Job类，
                <span className="text-yellow-600 font-medium">
                  {jobClasses.filter(job => !job.hasAnnotation).length} 个未添加注解
                </span>
              </span>
            </div>
            {jobClasses.some(job => !job.hasAnnotation) && (
              <Button 
                onClick={handleAddAllAnnotations}
                disabled={isAddingAnnotations}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {isAddingAnnotations ? '添加中...' : '一键添加所有注解'}
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">序号</TableHead>
                  <TableHead>类名</TableHead>
                  <TableHead>类路径</TableHead>
                  <TableHead>注解状态</TableHead>
                  <TableHead className="w-[200px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobClasses.map((jobClass, index) => (
                  <TableRow key={jobClass.classPath}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{jobClass.className}</TableCell>
                    <TableCell className="max-w-md truncate" title={jobClass.classPath}>
                      {jobClass.classPath}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                        jobClass.hasAnnotation 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                      }`}>
                        {jobClass.hasAnnotation ? '已添加注解' : '⚠️ 未添加注解'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenFile(jobClass.classPath)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>打开</span>
                        </Button>
                        {!jobClass.hasAnnotation && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAddAnnotation(jobClass.classPath)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>加注解</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 空状态提示 */}
      {jobClasses.length === 0 && path && !scanning && (
        <div className="tool-card">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileCode size={48} className="mb-4 text-primary/50" />
            <h3 className="text-lg font-medium mb-2">未找到Job类</h3>
            <p className="text-sm">在指定路径下未找到实现Job接口的类文件</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAnnotationTool;