
import { useState, useEffect } from 'react';
import { Clipboard, Copy, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'url' | 'email';
}

const ClipboardHistory = () => {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // 从localStorage加载历史记录
    const saved = localStorage.getItem('clipboardHistory');
    if (saved) {
      const parsed = JSON.parse(saved).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setClipboardHistory(parsed);
    }
  }, []);

  useEffect(() => {
    // 保存到localStorage
    localStorage.setItem('clipboardHistory', JSON.stringify(clipboardHistory));
  }, [clipboardHistory]);

  const detectContentType = (content: string): 'text' | 'url' | 'email' => {
    if (content.includes('@') && content.includes('.')) return 'email';
    if (content.startsWith('http') || content.includes('www.')) return 'url';
    return 'text';
  };

  const addToHistory = (content: string) => {
    if (!content.trim()) return;
    
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: new Date(),
      type: detectContentType(content)
    };

    setClipboardHistory(prev => {
      // 避免重复添加相同内容
      const filtered = prev.filter(item => item.content !== content.trim());
      return [newItem, ...filtered].slice(0, 50); // 最多保存50条
    });

    toast({
      title: "已添加到历史",
      description: "内容已保存到剪贴板历史",
    });
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "已复制到剪贴板",
        description: "内容已成功复制",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };

  const deleteItem = (id: string) => {
    setClipboardHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: "已删除",
      description: "项目已从历史记录中删除",
    });
  };

  const clearHistory = () => {
    setClipboardHistory([]);
    toast({
      title: "历史记录已清空",
      description: "所有剪贴板历史已删除",
    });
  };

  const filteredHistory = clipboardHistory.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'url': return '🔗';
      case 'email': return '📧';
      default: return '📝';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  return (
    <div className="space-y-6">
      <div className="tool-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clipboard size={20} className="text-primary" />
            <h3 className="text-xl font-semibold">剪贴板历史</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              disabled={clipboardHistory.length === 0}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* 添加新内容 */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="输入要添加到历史的内容..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToHistory(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="bg-background/50"
            />
            <Button
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input?.value) {
                  addToHistory(input.value);
                  input.value = '';
                }
              }}
              className="bg-primary hover:bg-primary/80"
            >
              添加
            </Button>
          </div>
        </div>

        {/* 搜索 */}
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索历史记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>

        {/* 历史记录列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {clipboardHistory.length === 0 ? (
                <div>
                  <Clipboard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无剪贴板历史</p>
                  <p className="text-sm">添加内容开始使用</p>
                </div>
              ) : (
                <p>未找到匹配的内容</p>
              )}
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-background/30 rounded-lg p-4 hover:bg-background/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.content)}
                      className="hover:bg-primary/20"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(item.id)}
                      className="hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="tool-card">
        <h4 className="text-lg font-semibold mb-4">统计信息</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{clipboardHistory.length}</div>
            <div className="text-sm text-muted-foreground">总记录数</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {clipboardHistory.filter(item => item.type === 'text').length}
            </div>
            <div className="text-sm text-muted-foreground">文本</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {clipboardHistory.filter(item => item.type === 'url').length}
            </div>
            <div className="text-sm text-muted-foreground">链接</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {clipboardHistory.filter(item => item.type === 'email').length}
            </div>
            <div className="text-sm text-muted-foreground">邮箱</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipboardHistory;
