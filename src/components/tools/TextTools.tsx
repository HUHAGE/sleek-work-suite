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
      lines: text.trim() ? text.split('\n').length : 0,
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
    <div className="space-y-8">
      {/* 输入区域 */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText size={24} className="text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">文本输入</h3>
        </div>
        <Textarea
          placeholder="在此输入您要处理的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-base"
        />
      </div>

      {/* 统计信息 */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Hash size={24} className="text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">文本统计</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-background/70 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-primary mb-2">{stats.characters}</div>
            <div className="text-sm text-muted-foreground font-medium">字符数</div>
          </div>
          <div className="bg-background/70 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-500 mb-2">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-muted-foreground font-medium">字符数(无空格)</div>
          </div>
          <div className="bg-background/70 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-green-500 mb-2">{stats.words}</div>
            <div className="text-sm text-muted-foreground font-medium">单词数</div>
          </div>
          <div className="bg-background/70 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-yellow-500 mb-2">{stats.lines}</div>
            <div className="text-sm text-muted-foreground font-medium">行数</div>
          </div>
          <div className="bg-background/70 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl font-bold text-purple-500 mb-2">{stats.paragraphs}</div>
            <div className="text-sm text-muted-foreground font-medium">段落数</div>
          </div>
        </div>
      </div>

      {/* 文本转换 */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Link size={24} className="text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">文本转换</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {transformations.map((transform) => {
            const transformedText = transformText(transform.key);
            return (
              <div key={transform.key} className="bg-background/70 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold flex items-center gap-3 text-lg">
                    <div className="bg-primary/10 w-8 h-8 flex items-center justify-center rounded-lg">
                      <span className="text-primary text-lg">{transform.icon}</span>
                    </div>
                    {transform.label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(transformedText, transform.key)}
                    className="hover:bg-primary/10 transition-colors"
                  >
                    {copiedStates[transform.key] ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <Copy size={18} className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-base bg-muted/30 rounded-xl p-4 min-h-[80px] max-h-32 overflow-y-auto border border-border/50">
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
