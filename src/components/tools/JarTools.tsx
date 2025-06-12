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
import { Archive, FolderOpen, Search, Copy, FileArchive, ExternalLink, X } from 'lucide-react'
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
import { useUserData } from '@/lib/store/userDataManager'

interface JarFile {
  id: string
  name: string
  path: string
  createTime: Date
  selected: boolean
}

const MAX_HISTORY = 10

const JarTools = () => {
  const [path, setPath] = useState<string>('')
  const [jarFiles, setJarFiles] = useState<JarFile[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [scanning, setScanning] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  const { jarToolsPathHistory, setJarToolsPathHistory } = useUserData()

  // 保存路径到历史记录
  const saveToHistory = (newPath: string) => {
    if (!newPath || jarToolsPathHistory.includes(newPath)) return
    
    const newHistory = [newPath, ...jarToolsPathHistory].slice(0, MAX_HISTORY)
    setJarToolsPathHistory(newHistory)
  }

  // 从历史记录中删除路径
  const removeFromHistory = (pathToRemove: string) => {
    const newHistory = jarToolsPathHistory.filter(p => p !== pathToRemove)
    setJarToolsPathHistory(newHistory)
  }

  const handleSelectPath = async () => {
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
      setJarFiles(jarFiles)
      saveToHistory(path)
      toast({
        title: "扫描完成",
        description: `共找到 ${jarFiles.length} 个JAR文件`,
      })
    } catch (error) {
      console.error('扫描JAR文件失败:', error)
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
      await window.electron.ipcRenderer.invoke('copy-files', files)
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
    copyFiles([file])
  }

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

  return (
    <div className="space-y-6">
      {/* 路径输入区域 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Archive size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">JAR文件扫描</h3>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="请输入或选择要扫描的路径..."
              className="flex-1"
            />
            {jarToolsPathHistory.length > 0 && (
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
                      {jarToolsPathHistory.map((historyPath) => (
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
        </div>
      </div>

      {/* JAR文件列表 */}
      {jarFiles.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileArchive size={20} className="text-primary" />
              <h3 className="text-xl font-semibold">扫描结果</h3>
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

          <div className="border rounded-lg">
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
                  <TableHead>文件名</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={handleSort}
                  >
                    创建时间
                    <span className="ml-2">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  </TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead className="w-24">操作</TableHead>
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
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>
                      {format(file.createTime, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {file.path}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyFile({ path: file.path, name: file.name })}
                        className="hover:bg-primary/20"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
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