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
      variant: "success"
    });
  };

  const getWordCount = () => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const numbers = text.match(/\d+/g) || [];
    const punctuation = text.match(/[^\w\s\u4e00-\u9fa5]/g) || [];
    const spaces = text.match(/\s/g) || [];
    
    return {
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      lines: text.trim() ? text.split('\n').length : 0,
      paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length,
      chineseChars: chineseChars.length,
      englishWords: englishWords.length,
      numbers: numbers.length,
      punctuation: punctuation.length,
      spaces: spaces.length,
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
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-primary/30 dark:hover:border-primary/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-primary dark:text-primary/90 mb-2 tracking-tight">{stats.characters}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">总字符数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-blue-500/30 dark:hover:border-blue-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-2 tracking-tight">{stats.chineseChars}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">中文字数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-green-500/30 dark:hover:border-green-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-green-500 dark:text-green-400 mb-2 tracking-tight">{stats.englishWords}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">英文单词</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-yellow-500/30 dark:hover:border-yellow-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-yellow-500 dark:text-yellow-400 mb-2 tracking-tight">{stats.numbers}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">数字个数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-purple-500/30 dark:hover:border-purple-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-purple-500 dark:text-purple-400 mb-2 tracking-tight">{stats.punctuation}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">标点符号</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-pink-500/30 dark:hover:border-pink-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-pink-500 dark:text-pink-400 mb-2 tracking-tight">{stats.spaces}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">空格数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-indigo-500 dark:text-indigo-400 mb-2 tracking-tight">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">无空格字符</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-orange-500/30 dark:hover:border-orange-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-orange-500 dark:text-orange-400 mb-2 tracking-tight">{stats.words}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">总单词数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-teal-500/30 dark:hover:border-teal-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-teal-500 dark:text-teal-400 mb-2 tracking-tight">{stats.lines}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">行数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-5 text-center shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-cyan-500/30 dark:hover:border-cyan-500/50 hover:scale-[1.02] backdrop-blur-sm">
            <div className="text-4xl font-bold text-cyan-500 dark:text-cyan-400 mb-2 tracking-tight">{stats.paragraphs}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/90 font-medium tracking-wide">段落数</div>
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
              <div key={transform.key} className="bg-background/80 dark:bg-background/40 rounded-xl p-6 shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 border border-border/30 dark:border-border/20 hover:border-primary/30 dark:hover:border-primary/50 hover:scale-[1.02] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold flex items-center gap-3 text-lg">
                    <div className="bg-primary/10 dark:bg-primary/20 w-10 h-10 flex items-center justify-center rounded-xl shadow-sm">
                      <span className="text-primary dark:text-primary/90 text-xl">{transform.icon}</span>
                    </div>
                    {transform.label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(transformedText, transform.key)}
                    className="hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors rounded-lg"
                  >
                    {copiedStates[transform.key] ? (
                      <Check size={18} className="text-green-500 dark:text-green-400" />
                    ) : (
                      <Copy size={18} className="text-muted-foreground dark:text-muted-foreground/90" />
                    )}
                  </Button>
                </div>
                <div className="text-base bg-muted/30 dark:bg-muted/20 rounded-xl p-4 min-h-[80px] max-h-32 overflow-y-auto border border-border/50 dark:border-border/30 shadow-inner">
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
