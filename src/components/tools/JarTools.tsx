import { useState } from 'react'
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
import { Archive, FolderOpen, Search, Copy, FileArchive } from 'lucide-react'

interface JarFile {
  id: string
  name: string
  path: string
  createTime: Date
  selected: boolean
}

const JarTools = () => {
  const [path, setPath] = useState<string>('')
  const [jarFiles, setJarFiles] = useState<JarFile[]>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [scanning, setScanning] = useState(false)
  const { toast } = useToast()

  const handleSelectPath = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-directory')
      if (result) {
        setPath(result)
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

  const copyToClipboard = async (paths: string[]) => {
    try {
      await window.electron.ipcRenderer.invoke('copy-to-clipboard', paths)
      toast({
        title: "复制成功",
        description: "文件路径已复制到剪贴板",
      })
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
      toast({
        title: "复制失败",
        description: "复制到剪贴板时出现错误",
        variant: "destructive"
      })
    }
  }

  const handleCopySelected = () => {
    const selectedPaths = jarFiles
      .filter(file => file.selected)
      .map(file => `${file.path}${file.name}`)
    if (selectedPaths.length > 0) {
      copyToClipboard(selectedPaths)
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

  const handleCopyPath = (path: string) => {
    copyToClipboard([path])
  }

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
                {jarFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={file.selected}
                        onCheckedChange={() => toggleSelect(file.id)}
                      />
                    </TableCell>
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
                        onClick={() => handleCopyPath(`${file.path}${file.name}`)}
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