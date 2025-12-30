import { useState, useEffect } from 'react'
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
import { Checkbox } from "@/components/ui/checkbox"
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Archive, FolderOpen, Search, Copy, FileArchive, ExternalLink, X, Edit2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { trackToolUsage, trackButtonClick } from '@/lib/analytics';

interface JarFile {
  id: string
  name: string
  path: string
  createTime: Date // 实际存储的是文件的最后修改时间
  selected: boolean
}

interface JarPathItem {
  id: string
  name: string
  path: string
}

const JarTools = () => {
  const [path, setPath] = useState<string>('')
  const [jarFiles, setJarFiles] = useState<JarFile[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [scanning, setScanning] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; path: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [jarToolsPathHistory, setJarToolsPathHistory] = useState<JarPathItem[]>([])
  const { toast } = useToast()

  // 从electron加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const config = (await window.electron.ipcRenderer.invoke('get-jar-tools-config' as any)) as unknown as { pathHistory: JarPathItem[] }
      setJarToolsPathHistory(config.pathHistory || [])
    } catch (error) {
      console.error('加载JAR工具配置失败:', error)
    }
  }

  const saveConfig = async (pathHistory: JarPathItem[]) => {
    try {
      await (window.electron.ipcRenderer.invoke as any)('save-jar-tools-config', { pathHistory })
    } catch (error) {
      console.error('保存JAR工具配置失败:', error)
      toast({
        title: "保存失败",
        description: "无法保存路径历史记录",
        variant: "destructive"
      })
    }
  }

  // 保存路径到历史记录
  const saveToHistory = (newPath: string) => {
    if (!newPath) return
    
    // 检查路径是否已存在
    if (jarToolsPathHistory.some(item => item.path === newPath)) {
      return
    }
    
    // 生成默认名称（路径的最后一个文件夹名）
    const defaultName = newPath.split(/[/\\]/).pop() || newPath
    const newItem: JarPathItem = {
      id: crypto.randomUUID(),
      name: defaultName,
      path: newPath
    }
    
    // 限制最多10条记录
    const newHistory = [newItem, ...jarToolsPathHistory].slice(0, 10)
    setJarToolsPathHistory(newHistory)
    saveConfig(newHistory)
  }

  // 从历史记录中删除路径
  const removeFromHistory = (id: string) => {
    const newHistory = jarToolsPathHistory.filter(item => item.id !== id)
    setJarToolsPathHistory(newHistory)
    saveConfig(newHistory)
  }

  // 更新路径名称
  const updatePathName = (id: string, name: string) => {
    const newHistory = jarToolsPathHistory.map(item =>
      item.id === id ? { ...item, name } : item
    )
    setJarToolsPathHistory(newHistory)
    saveConfig(newHistory)
  }

  // 打开编辑对话框
  const handleEditClick = (item: { id: string; name: string; path: string }) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditDialogOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingItem && editName.trim()) {
      updatePathName(editingItem.id, editName.trim())
      setEditDialogOpen(false)
      setEditingItem(null)
      setEditName('')
      toast({
        title: "保存成功",
        description: "路径名称已更新",
      })
    }
  }

  const handleSelectPath = async () => {
    trackButtonClick('jar_tools', 'select_path');
    try {
      const result = await window.electron.ipcRenderer.invoke('select-directory')
      if (result) {
        setPath(result)
        saveToHistory(result)
      }
    } catch (error) {
      console.error('选择目录失败:', error)
      toast({
        title: "选择目录失败",
        description: "请检查目录权限",
        variant: "destructive"
      })
    }
  }

  const handleScan = async () => {
    if (!path) return
    trackToolUsage('jar_tools', 'scan_start', { path });
    setScanning(true)
    try {
      const files = await window.electron.ipcRenderer.invoke('scan-jar-files', path)
      const jarFiles: JarFile[] = files.map((file: any) => ({
        id: `${file.path}${file.name}`,
        name: file.name,
        path: file.path,
        createTime: new Date(file.createTime),
        selected: false
      }))
      // 默认按更新时间倒序排列
      const sortedFiles = jarFiles.sort((a, b) => b.createTime.getTime() - a.createTime.getTime())
      setJarFiles(sortedFiles)
      setSortOrder('desc')
      saveToHistory(path)
      trackToolUsage('jar_tools', 'scan_success', { count: jarFiles.length });
      toast({
        title: "扫描完成",
        description: `共找到 ${jarFiles.length} 个JAR文件`,
      })
    } catch (error) {
      console.error('扫描JAR文件失败:', error)
      trackToolUsage('jar_tools', 'scan_failed');
      toast({
        title: "扫描失败",
        description: "请检查目录权限或路径是否正确",
        variant: "destructive"
      })
    } finally {
      setScanning(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    setJarFiles(jarFiles.map(file => ({ ...file, selected: checked })))
  }

  const toggleSelect = (id: string) => {
    setJarFiles(jarFiles.map(file => 
      file.id === id ? { ...file, selected: !file.selected } : file
    ))
  }

  const copyFiles = async (files: { path: string, name: string }[]) => {
    try {
      await (window.electron.ipcRenderer.invoke as any)('copy-files', files)
      toast({
        title: "复制成功",
        description: "文件已复制到剪贴板",
      })
    } catch (error) {
      console.error('复制文件失败:', error)
      toast({
        title: "复制失败",
        description: "复制文件时出现错误",
        variant: "destructive"
      })
    }
  }

  const handleCopySelected = () => {
    const selectedFiles = jarFiles
      .filter(file => file.selected)
      .map(file => ({
        path: file.path,
        name: file.name
      }))
    if (selectedFiles.length > 0) {
      trackButtonClick('jar_tools', 'copy_batch');
      copyFiles(selectedFiles)
    }
  }

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    const sorted = [...jarFiles].sort((a, b) => {
      return newOrder === 'asc' 
        ? a.createTime.getTime() - b.createTime.getTime()
        : b.createTime.getTime() - a.createTime.getTime()
    })
    setJarFiles(sorted)
  }

  const handleCopyFile = (file: { path: string, name: string }) => {
    trackButtonClick('jar_tools', 'copy_single');
    copyFiles([file])
  }

  const handleOpenFileDirectory = async (dirPath: string) => {
    trackButtonClick('jar_tools', 'open_file_directory');
    try {
      await window.electron.ipcRenderer.invoke('open-path', dirPath);
      toast({
        title: "打开目录",
        description: "已打开文件所在目录",
      });
    } catch (error) {
      console.error('打开目录失败:', error);
      toast({
        title: "打开失败",
        description: "无法打开目录，请检查路径是否存在",
        variant: "destructive"
      });
    }
  };

  const handleOpenPath = async () => {
    trackButtonClick('jar_tools', 'open_path');
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

  // 点击历史路径卡片，扫描该路径
  const handleHistoryCardClick = async (historyPath: string) => {
    setPath(historyPath);
    setScanning(true);
    try {
      const files = await window.electron.ipcRenderer.invoke('scan-jar-files', historyPath);
      const jarFiles: JarFile[] = files.map((file: any) => ({
        id: `${file.path}${file.name}`,
        name: file.name,
        path: file.path,
        createTime: new Date(file.createTime),
        selected: false
      }));
      // 默认按更新时间倒序排列
      const sortedFiles = jarFiles.sort((a, b) => b.createTime.getTime() - a.createTime.getTime())
      setJarFiles(sortedFiles);
      setSortOrder('desc')
      toast({
        title: "扫描完成",
        description: `共找到 ${jarFiles.length} 个JAR文件`,
      });
    } catch (error) {
      console.error('扫描JAR文件失败:', error);
      toast({
        title: "扫描失败",
        description: "请检查目录权限或路径是否正确",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 路径输入区域 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Archive size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">JAR文件扫描</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="请输入或选择要扫描的路径..."
            className="flex-1"
          />
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
        </div>

        {/* 历史路径卡片列表 */}
        {jarToolsPathHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">常用路径</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jarToolsPathHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative border-2 border-green-500/60 dark:border-green-500/50 rounded-lg p-3 hover:border-green-500 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-green-500/20 transition-all cursor-pointer bg-card dark:bg-card/60"
                  onClick={() => handleHistoryCardClick(item.path)}
                >
                  <div className="flex items-start gap-2">
                    <FolderOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1" title={item.path}>
                        {item.path}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(item)
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromHistory(item.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 编辑名称对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑路径名称</DialogTitle>
            <DialogDescription>
              为这个路径设置一个容易识别的名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入路径名称..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>路径</Label>
              <p className="text-sm text-muted-foreground break-all">
                {editingItem?.path}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              <Check className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JAR文件列表 */}
      {jarFiles.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileArchive size={20} className="text-primary" />
              <h3 className="text-xl font-semibold">扫描结果</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">共</span>
                <span className="font-semibold text-primary text-lg">{jarFiles.length}</span>
                <span className="text-muted-foreground">个JAR文件</span>
                {jarFiles.some(f => f.selected) && (
                  <>
                    <span className="text-muted-foreground mx-1">|</span>
                    <span className="text-muted-foreground">已选</span>
                    <span className="font-semibold text-primary">{jarFiles.filter(f => f.selected).length}</span>
                    <span className="text-muted-foreground">个</span>
                  </>
                )}
              </div>
            </div>
            <Button
              onClick={handleCopySelected}
              disabled={!jarFiles.some(f => f.selected)}
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              批量复制
            </Button>
          </div>

          <div className="border-2 border-border/50 dark:border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={jarFiles.length > 0 && jarFiles.every(f => f.selected)}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">序号</TableHead>
                  <TableHead className="min-w-[200px] w-[300px]">文件名</TableHead>
                  <TableHead 
                    className="w-[180px] cursor-pointer hover:text-primary transition-colors whitespace-nowrap"
                    onClick={handleSort}
                  >
                    更新时间
                    <span className="ml-2">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  </TableHead>
                  <TableHead className="min-w-[150px]">路径</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jarFiles.map((file, index) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={file.selected}
                        onCheckedChange={() => toggleSelect(file.id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium break-all">{file.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(file.createTime, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]" title={file.path}>
                      {file.path}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyFile({ path: file.path, name: file.name })}
                          className="hover:bg-primary/20"
                          title="复制文件"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenFileDirectory(file.path)}
                          className="hover:bg-primary/20"
                          title="打开目录"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default JarTools 