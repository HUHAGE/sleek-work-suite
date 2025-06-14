import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserData } from '@/lib/store/userDataManager'
import { Laptop, Globe, Trash2, Plus, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"

type ItemType = 'software' | 'website'

interface NewItem {
  name: string
  path: string
  type: ItemType
}

const WorkStarter = () => {
  const { workItems, addWorkItem, removeWorkItem } = useUserData()
  const [newItem, setNewItem] = useState<NewItem>({ name: '', path: '', type: 'software' })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItem.name && newItem.path) {
      addWorkItem(newItem)
      setNewItem({ name: '', path: '', type: newItem.type })
    }
  }

  const handleStartAll = async () => {
    if (workItems.length === 0) {
      toast({
        title: "没有配置项",
        description: "请先添加需要启动的软件或网页",
        variant: "destructive"
      })
      return
    }

    for (const item of workItems) {
      if (item.type === 'website') {
        try {
          await window.electron.openExternal(item.path)
        } catch (error) {
          console.error('打开网页失败:', error)
        }
      } else {
        try {
          await window.electron.openSoftware(item.path)
        } catch (error) {
          console.error('打开软件失败:', error)
        }
      }
    }
  }

  const softwareItems = workItems.filter(item => item.type === 'software')
  const websiteItems = workItems.filter(item => item.type === 'website')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>工作启动器</CardTitle>
          </div>
          <Button onClick={handleStartAll} className="gap-2">
            <Play size={16} />
            一键启动全部
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-[200px_1fr_auto_auto] items-end gap-4">
              <div>
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入名称"
                />
              </div>
              <div>
                <Label htmlFor="path">路径/网址</Label>
                <Input
                  id="path"
                  value={newItem.path}
                  onChange={e => setNewItem(prev => ({ ...prev, path: e.target.value }))}
                  placeholder={newItem.type === 'software' ? '输入软件路径' : '输入网址'}
                />
              </div>
              <RadioGroup
                value={newItem.type}
                onValueChange={(value: ItemType) => setNewItem(prev => ({ ...prev, type: value }))}
                className="flex gap-4 h-10 items-center"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="software" id="software" />
                  <Label htmlFor="software" className="flex items-center gap-1 cursor-pointer">
                    <Laptop size={16} />
                    软件
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="website" id="website" />
                  <Label htmlFor="website" className="flex items-center gap-1 cursor-pointer">
                    <Globe size={16} />
                    网页
                  </Label>
                </div>
              </RadioGroup>
              <Button type="submit" className="gap-2" variant="outline">
                <Plus size={16} />
                添加
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Laptop size={20} className="text-primary" />
              <CardTitle>软件 ({softwareItems.length})</CardTitle>
            </div>
            {softwareItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  for (const item of softwareItems) {
                    window.electron.openSoftware(item.path).catch(error => {
                      console.error('打开软件失败:', error)
                    })
                  }
                }}
              >
                <Play size={14} />
                启动全部软件
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {softwareItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                还没有添加任何软件，在上方添加一个吧
              </div>
            ) : (
              <div className="grid gap-4">
                {softwareItems.map(item => (
                  <WorkItemCard key={item.id} item={item} onRemove={removeWorkItem} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              <CardTitle>网页 ({websiteItems.length})</CardTitle>
            </div>
            {websiteItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  for (const item of websiteItems) {
                    window.electron.openExternal(item.path).catch(error => {
                      console.error('打开网页失败:', error)
                    })
                  }
                }}
              >
                <Play size={14} />
                打开全部网页
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {websiteItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                还没有添加任何网页，在上方添加一个吧
              </div>
            ) : (
              <div className="grid gap-4">
                {websiteItems.map(item => (
                  <WorkItemCard key={item.id} item={item} onRemove={removeWorkItem} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface WorkItemCardProps {
  item: {
    id: string
    name: string
    path: string
    type: ItemType
  }
  onRemove: (id: string) => void
}

const WorkItemCard = ({ item, onRemove }: WorkItemCardProps) => {
  const handleStart = async () => {
    if (item.type === 'website') {
      try {
        await window.electron.openExternal(item.path)
      } catch (error) {
        console.error('打开网页失败:', error)
      }
    } else {
      try {
        await window.electron.openSoftware(item.path)
      } catch (error) {
        console.error('打开软件失败:', error)
      }
    }
  }

  return (
    <Card className={cn(
      "relative group transition-all duration-200 hover:shadow-md",
      "hover:border-primary/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{item.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{item.path}</p>
          </div>
          <div className="flex gap-2 flex-none">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleStart}
              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Play size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WorkStarter 