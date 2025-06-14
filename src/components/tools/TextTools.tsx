import { useState } from 'react';
import { Copy, Check, FileText, Hash, Link, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const TextTools = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const sampleText = `这是一个示例文本，包含了中英文混合内容。
This is a sample text with mixed Chinese and English content.

它包含了：
- 中文字符
- English words
- 数字 123
- 标点符号！@#
- 空格和换行

你可以用它来测试各种文本处理功能。
You can use it to test various text processing features.`;

  const insertSampleText = () => {
    setText(sampleText);
    toast({
      title: "已插入示例文本",
      description: "示例文本已成功填充到输入框",
      variant: "success"
    });
  };

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
    let transformed = '';
    switch (type) {
      case 'uppercase':
        transformed = text.toUpperCase();
        break;
      case 'lowercase':
        transformed = text.toLowerCase();
        break;
      case 'capitalize':
        transformed = text.replace(/\b\w/g, l => l.toUpperCase());
        break;
      case 'reverse':
        transformed = text.split('').reverse().join('');
        break;
      case 'base64':
        transformed = btoa(encodeURIComponent(text));
        break;
      case 'url':
        transformed = encodeURIComponent(text);
        break;
      default:
        transformed = text;
    }
    setResult(transformed);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText size={24} className="text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">文本输入</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-primary/10 dark:hover:bg-primary/20 border-primary/20 hover:border-primary/40 transition-all"
            onClick={insertSampleText}
          >
            <Sparkles size={16} className="text-primary" />
            <span>示例文字</span>
          </Button>
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
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Hash size={24} className="text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">文本统计</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-primary mb-2">{stats.characters}</div>
            <div className="text-sm text-muted-foreground">总字符数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-500 mb-2">{stats.chineseChars}</div>
            <div className="text-sm text-muted-foreground">中文字数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-500 mb-2">{stats.englishWords}</div>
            <div className="text-sm text-muted-foreground">英文单词</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-yellow-500 mb-2">{stats.numbers}</div>
            <div className="text-sm text-muted-foreground">数字个数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-purple-500 mb-2">{stats.punctuation}</div>
            <div className="text-sm text-muted-foreground">标点符号</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-pink-500 mb-2">{stats.spaces}</div>
            <div className="text-sm text-muted-foreground">空格数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-indigo-500 mb-2">{stats.charactersNoSpaces}</div>
            <div className="text-sm text-muted-foreground">无空格字符</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-orange-500 mb-2">{stats.words}</div>
            <div className="text-sm text-muted-foreground">总单词数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-teal-500 mb-2">{stats.lines}</div>
            <div className="text-sm text-muted-foreground">行数</div>
          </div>
          <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-cyan-500 mb-2">{stats.paragraphs}</div>
            <div className="text-sm text-muted-foreground">段落数</div>
          </div>
        </div>
      </div>

      {/* 文本转换 */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Link size={24} className="text-primary" />
          </div>
          <h3 className="text-2xl font-semibold">文本转换</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          {transformations.map((transform) => (
            <Button
              key={transform.key}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-background/50 hover:bg-primary/5 dark:hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all group"
              onClick={() => transformText(transform.key)}
            >
              <div className="bg-primary/10 dark:bg-primary/20 w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <span className="text-primary text-lg group-hover:text-primary/90">{transform.icon}</span>
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{transform.label}</span>
            </Button>
          ))}
        </div>
        
        {/* 处理结果输出框 */}
        <div className="bg-background/80 dark:bg-background/40 rounded-xl p-4 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">处理结果</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(result, 'result')}
              className="hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              {copiedStates['result'] ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} className="text-muted-foreground" />
              )}
            </Button>
          </div>
          <div className="text-base bg-muted/30 dark:bg-muted/20 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto border border-border/50 dark:border-border/30 shadow-inner">
            {result || '处理结果将显示在这里...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTools;
