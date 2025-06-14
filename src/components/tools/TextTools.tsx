import { useState } from 'react';
import { Copy, Check, FileText, Hash, Link, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const JsonPreview = ({ json }: { json: string }) => {
  const formatJson = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return json;
    }
  };

  const highlightJson = (json: string) => {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let className = 'text-blue-500'; // 数字
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          className = 'text-purple-500'; // 键
        } else {
          className = 'text-green-500'; // 字符串
        }
      } else if (/true|false/.test(match)) {
        className = 'text-orange-500'; // 布尔值
      } else if (/null/.test(match)) {
        className = 'text-gray-500'; // null
      }
      return `<span class="${className}">${match}</span>`;
    });
  };

  return (
    <pre 
      className="text-sm font-mono whitespace-pre-wrap break-words bg-muted/30 dark:bg-muted/20 rounded-lg p-4 min-h-[500px] overflow-y-auto overflow-x-hidden border border-border/50 dark:border-border/30 shadow-inner"
      dangerouslySetInnerHTML={{ __html: highlightJson(formatJson(json)) }}
    />
  );
};

type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  chineseChars: number;
  englishWords: number;
  numbers: number;
  punctuation: number;
  spaces: number;
};

type JsonStats = {
  totalKeys: number;
  totalValues: number;
  stringValues: number;
  numberValues: number;
  booleanValues: number;
  nullValues: number;
  arrayValues: number;
  objectValues: number;
  maxDepth: number;
};

const TextTools = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState<'text' | 'json'>('text');
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

  const getJsonStats = (json: string): JsonStats | null => {
    try {
      const parsed = JSON.parse(json);
      const stats: JsonStats = {
        totalKeys: 0,
        totalValues: 0,
        stringValues: 0,
        numberValues: 0,
        booleanValues: 0,
        nullValues: 0,
        arrayValues: 0,
        objectValues: 0,
        maxDepth: 0,
      };

      const countJson = (obj: any, depth: number = 0) => {
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        
        if (Array.isArray(obj)) {
          stats.arrayValues++;
          obj.forEach(item => countJson(item, depth + 1));
        } else if (obj && typeof obj === 'object') {
          stats.objectValues++;
          Object.entries(obj).forEach(([key, value]) => {
            stats.totalKeys++;
            stats.totalValues++;
            
            if (typeof value === 'string') stats.stringValues++;
            else if (typeof value === 'number') stats.numberValues++;
            else if (typeof value === 'boolean') stats.booleanValues++;
            else if (value === null) stats.nullValues++;
            else countJson(value, depth + 1);
          });
        }
      };

      countJson(parsed);
      return stats;
    } catch {
      return null;
    }
  };

  const getWordCount = (): TextStats => {
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

  const textStats = getWordCount();
  const jsonStats = resultType === 'json' ? getJsonStats(text) : null;

  const buttonCategories = [
    {
      name: '大小写',
      icon: 'Aa',
      buttons: [
        { key: 'uppercase', label: '大写', icon: '↑' },
        { key: 'lowercase', label: '小写', icon: '↓' },
        { key: 'capitalize', label: '首字母大写', icon: 'Aa' },
      ]
    },
    {
      name: '编码',
      icon: '#',
      buttons: [
        { key: 'base64', label: 'Base64编码', icon: '#' },
        { key: 'base64decode', label: 'Base64解码', icon: '#' },
        { key: 'url', label: 'URL编码', icon: '@' },
        { key: 'urldecode', label: 'URL解码', icon: '@' },
        { key: 'unicode', label: 'Unicode编码', icon: 'U' },
        { key: 'unicodedecode', label: 'Unicode解码', icon: 'U' },
      ]
    },
    {
      name: '格式',
      icon: '{',
      buttons: [
        { key: 'json', label: 'JSON格式化', icon: '{' },
        { key: 'reverse', label: '反转', icon: '↔' },
      ]
    }
  ];

  const transformText = (type: string) => {
    let transformed = '';
    switch (type) {
      case 'uppercase':
        transformed = text.toUpperCase();
        setResultType('text');
        break;
      case 'lowercase':
        transformed = text.toLowerCase();
        setResultType('text');
        break;
      case 'capitalize':
        transformed = text.replace(/\b\w/g, l => l.toUpperCase());
        setResultType('text');
        break;
      case 'reverse':
        transformed = text.split('').reverse().join('');
        setResultType('text');
        break;
      case 'base64':
        try {
          transformed = btoa(encodeURIComponent(text));
          setResultType('text');
        } catch (error) {
          transformed = '编码失败：输入包含无效字符';
          setResultType('text');
        }
        break;
      case 'base64decode':
        try {
          transformed = decodeURIComponent(atob(text));
          setResultType('text');
        } catch (error) {
          transformed = '解码失败：输入不是有效的Base64编码';
          setResultType('text');
        }
        break;
      case 'url':
        try {
          transformed = encodeURIComponent(text);
          setResultType('text');
        } catch (error) {
          transformed = '编码失败：输入包含无效字符';
          setResultType('text');
        }
        break;
      case 'urldecode':
        try {
          transformed = decodeURIComponent(text);
          setResultType('text');
        } catch (error) {
          transformed = '解码失败：输入不是有效的URL编码';
          setResultType('text');
        }
        break;
      case 'unicode':
        try {
          transformed = text.split('').map(char => {
            const code = char.charCodeAt(0);
            return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
          }).join('');
          setResultType('text');
        } catch (error) {
          transformed = '编码失败：输入包含无效字符';
          setResultType('text');
        }
        break;
      case 'unicodedecode':
        try {
          transformed = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
          );
          setResultType('text');
        } catch (error) {
          transformed = '解码失败：输入不是有效的Unicode编码';
          setResultType('text');
        }
        break;
      case 'json':
        try {
          // 尝试解析JSON
          const parsed = JSON.parse(text);
          // 格式化输出，使用2个空格缩进
          transformed = JSON.stringify(parsed, null, 2);
          setResultType('json');
        } catch (error) {
          if (error instanceof SyntaxError) {
            transformed = 'JSON格式错误：' + error.message;
            setResultType('text');
          } else {
            transformed = 'JSON处理失败：' + error.message;
            setResultType('text');
          }
        }
        break;
      default:
        transformed = text;
        setResultType('text');
    }
    setResult(transformed);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 顶部操作按钮区域 */}
      <div className="flex gap-4 justify-center">
        {buttonCategories.map((category) => (
          <div key={category.name} className="relative group">
            <Button
              size="sm"
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary shadow-sm hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-6 h-6 flex items-center justify-center rounded-md">
                <span className="text-primary text-base">{category.icon}</span>
              </div>
              <span className="text-sm font-medium">{category.name}</span>
            </Button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-card rounded-lg shadow-lg border border-border/50 p-2 min-w-[200px]">
                <div className="flex flex-col gap-1">
                  {category.buttons.map((button) => (
                    <Button
                      key={button.key}
                      size="sm"
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all w-full justify-start"
                      onClick={() => transformText(button.key)}
                    >
                      <div className="bg-primary-foreground/10 w-6 h-6 flex items-center justify-center rounded-md">
                        <span className="text-primary-foreground text-base">{button.icon}</span>
                      </div>
                      <span className="text-sm font-medium">{button.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {/* 添加一个透明的区域来保持下拉菜单可见 */}
              <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* 左侧区域：输入和统计 */}
        <div className="space-y-4">
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
              className="min-h-[400px] bg-background/50 border-2 border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none text-base shadow-lg shadow-primary/5 transition-all duration-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
            />
          </div>

          {/* 统计信息 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Hash size={24} className="text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">{resultType === 'json' ? 'JSON统计' : '文本统计'}</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {resultType === 'json' && jsonStats ? (
                <>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-primary">{jsonStats.totalKeys}</div>
                    <div className="text-sm text-muted-foreground">总键数</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-blue-500">{jsonStats.totalValues}</div>
                    <div className="text-sm text-muted-foreground">总值数</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-green-500">{jsonStats.stringValues}</div>
                    <div className="text-sm text-muted-foreground">字符串</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-yellow-500">{jsonStats.numberValues}</div>
                    <div className="text-sm text-muted-foreground">数字</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-purple-500">{jsonStats.booleanValues}</div>
                    <div className="text-sm text-muted-foreground">布尔值</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-pink-500">{jsonStats.nullValues}</div>
                    <div className="text-sm text-muted-foreground">空值</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-indigo-500">{jsonStats.arrayValues}</div>
                    <div className="text-sm text-muted-foreground">数组</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-orange-500">{jsonStats.objectValues}</div>
                    <div className="text-sm text-muted-foreground">对象</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-teal-500">{jsonStats.maxDepth}</div>
                    <div className="text-sm text-muted-foreground">最大深度</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-primary">{textStats.characters}</div>
                    <div className="text-sm text-muted-foreground">总字符</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-blue-500">{textStats.chineseChars}</div>
                    <div className="text-sm text-muted-foreground">中文</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-green-500">{textStats.englishWords}</div>
                    <div className="text-sm text-muted-foreground">英文</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-yellow-500">{textStats.numbers}</div>
                    <div className="text-sm text-muted-foreground">数字</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-purple-500">{textStats.punctuation}</div>
                    <div className="text-sm text-muted-foreground">标点</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-pink-500">{textStats.spaces}</div>
                    <div className="text-sm text-muted-foreground">空格</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-indigo-500">{textStats.charactersNoSpaces}</div>
                    <div className="text-sm text-muted-foreground">无空格</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-orange-500">{textStats.words}</div>
                    <div className="text-sm text-muted-foreground">单词</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-teal-500">{textStats.lines}</div>
                    <div className="text-sm text-muted-foreground">行数</div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/40 rounded-lg p-3 text-center shadow-sm border border-border/30 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-cyan-500">{textStats.paragraphs}</div>
                    <div className="text-sm text-muted-foreground">段落</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 右侧区域：输出结果 */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Link size={24} className="text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">处理结果</h3>
            </div>
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
          {resultType === 'json' ? (
            <JsonPreview json={result} />
          ) : (
            <div className="text-base bg-muted/30 dark:bg-muted/20 rounded-lg p-4 min-h-[500px] overflow-y-auto overflow-x-hidden break-words border border-border/50 dark:border-border/30 shadow-inner">
              {result || '处理结果将显示在这里...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextTools;
