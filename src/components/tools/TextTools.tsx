
import { useState } from 'react';
import { Copy, Check, FileText, Hash, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const TextTools = () => {
  const [text, setText] = useState('');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
    toast({
      title: "已复制到剪贴板",
      description: "内容已成功复制",
    });
  };

  const getWordCount = () => {
    return {
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      lines: text.split('\n').length,
      paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length
    };
  };

  const transformText = (type: string) => {
    switch (type) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.replace(/\b\w/g, l => l.toUpperCase());
      case 'reverse':
        return text.split('').reverse().join('');
      case 'base64':
        return btoa(encodeURIComponent(text));
      case 'url':
        return encodeURIComponent(text);
      default:
        return text;
    }
  };

  const stats = getWordCount();
  
  const transformations = [
    { key: 'uppercase', label: '大写', icon: '↑' },
    { key: 'lowercase', label: '小写', icon: '↓' },
    { key: 'capitalize', label: '首字母大写', icon: 'Aa' },
    { key: 'reverse', label: '反转', icon: '↔' },
    { key: 'base64', label: 'Base64编码', icon: '#' },
    { key: 'url', label: 'URL编码', icon: '@' },
  ];

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">文本输入</h3>
        </div>
        <Textarea
          placeholder="在此输入您要处理的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* 统计信息 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Hash size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">文本统计</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.characters}</div>
            <div className="text-sm text-muted-foreground">字符数</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-muted-foreground">字符数(无空格)</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.words}</div>
            <div className="text-sm text-muted-foreground">单词数</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.lines}</div>
            <div className="text-sm text-muted-foreground">行数</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.paragraphs}</div>
            <div className="text-sm text-muted-foreground">段落数</div>
          </div>
        </div>
      </div>

      {/* 文本转换 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Link size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">文本转换</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformations.map((transform) => {
            const transformedText = transformText(transform.key);
            return (
              <div key={transform.key} className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <span className="text-primary">{transform.icon}</span>
                    {transform.label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(transformedText, transform.key)}
                    className="hover:bg-primary/20"
                  >
                    {copiedStates[transform.key] ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>
                <div className="text-sm bg-muted/20 rounded p-2 max-h-20 overflow-y-auto">
                  {transformedText || '请输入文本...'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TextTools;
