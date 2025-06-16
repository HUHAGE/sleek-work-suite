import { useState } from 'react';
import { Copy, Check, FileText, Hash, Link, Sparkles, List, WrapText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
  vscDarkPlus,
  dracula,
  materialDark,
  materialLight,
  atomDark,
  solarizedlight as github
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'sql-formatter';
import formatXml from 'xml-formatter';

type JsonPreviewProps = {
  json: string;
  showLineNumbers: boolean;
  wrapLines: boolean;
  selectedTheme: typeof themes[0];
  collapsed: boolean;
};

const JsonPreview = ({ json, showLineNumbers, wrapLines, selectedTheme, collapsed }: JsonPreviewProps) => {
  const formatJson = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, collapsed ? 0 : 2);
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
    <div className="min-h-[500px] overflow-y-auto overflow-x-hidden border border-border/50 dark:border-border/30 shadow-inner rounded-lg bg-muted/30 dark:bg-muted/20">
      <SyntaxHighlighter
        language="json"
        style={selectedTheme.style}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        wrapLongLines={wrapLines}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          minHeight: '500px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        codeTagProps={{
          style: {
            background: 'transparent',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }
        }}
        lineProps={{
          style: {
            background: 'transparent',
            whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
          }
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {formatJson(json)}
      </SyntaxHighlighter>
    </div>
  );
};

// 添加主题配置
const themes = [
  { name: '深色主题', value: 'oneDark', style: oneDark },
  { name: '浅色主题', value: 'oneLight', style: oneLight },
  { name: 'VSCode深色', value: 'vscDarkPlus', style: vscDarkPlus },
  { name: 'Dracula', value: 'dracula', style: dracula },
  { name: 'Material深色', value: 'materialDark', style: materialDark },
  { name: 'Material浅色', value: 'materialLight', style: materialLight },
  { name: 'Atom深色', value: 'atomDark', style: atomDark },
  { name: 'GitHub', value: 'github', style: github },
];

type SqlPreviewProps = {
  sql: string;
  showLineNumbers: boolean;
  wrapLines: boolean;
  selectedTheme: typeof themes[0];
};

const SqlPreview = ({ sql, showLineNumbers, wrapLines, selectedTheme }: SqlPreviewProps) => {
  return (
    <div className="min-h-[500px] overflow-y-auto overflow-x-hidden border border-border/50 dark:border-border/30 shadow-inner rounded-lg bg-muted/30 dark:bg-muted/20">
      <SyntaxHighlighter
        language="sql"
        style={selectedTheme.style}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        wrapLongLines={wrapLines}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          minHeight: '500px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        codeTagProps={{
          style: {
            background: 'transparent',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }
        }}
        lineProps={{
          style: {
            background: 'transparent',
            whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
          }
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {sql}
      </SyntaxHighlighter>
    </div>
  );
};

type XmlPreviewProps = {
  xml: string;
  showLineNumbers: boolean;
  wrapLines: boolean;
  selectedTheme: typeof themes[0];
};

const XmlPreview = ({ xml, showLineNumbers, wrapLines, selectedTheme }: XmlPreviewProps) => {
  return (
    <div className="min-h-[500px] overflow-y-auto overflow-x-hidden border border-border/50 dark:border-border/30 shadow-inner rounded-lg bg-muted/30 dark:bg-muted/20">
      <SyntaxHighlighter
        language="xml"
        style={selectedTheme.style}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        wrapLongLines={wrapLines}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          minHeight: '500px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        codeTagProps={{
          style: {
            background: 'transparent',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }
        }}
        lineProps={{
          style: {
            background: 'transparent',
            whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
          }
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {xml}
      </SyntaxHighlighter>
    </div>
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

// 添加数字转人民币大写的函数
const numberToChineseCurrency = (num: string): string => {
  try {
    const numbers = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿', '万亿'];
    const decimalUnits = ['角', '分'];

    // 处理非法输入
    if (!/^-?\d+(\.\d{1,2})?$/.test(num)) {
      throw new Error('请输入合法的金额（最多支持两位小数）');
    }

    const [integerPart, decimalPart = ''] = Math.abs(Number(num)).toString().split('.');
    if (integerPart.length > 16) {
      throw new Error('金额超出范围（最大支持16位整数）');
    }

    // 处理整数部分
    const processInteger = (intStr: string): string => {
      if (intStr === '0') return '零';
      let result = '';
      const groups: string[] = [];
      
      // 按4位分组
      for (let i = intStr.length; i > 0; i -= 4) {
        groups.unshift(intStr.slice(Math.max(0, i - 4), i));
      }

      groups.forEach((group, groupIndex) => {
        let groupResult = '';
        let hasZero = false;
        
        for (let i = 0; i < group.length; i++) {
          const digit = parseInt(group[i]);
          if (digit === 0) {
            hasZero = true;
          } else {
            if (hasZero) {
              groupResult += '零';
              hasZero = false;
            }
            groupResult += numbers[digit] + units[group.length - 1 - i];
          }
        }
        
        if (groupResult) {
          result += groupResult + (groupIndex < groups.length - 1 ? bigUnits[groups.length - 1 - groupIndex] : '');
        }
      });

      return result;
    };

    // 处理小数部分
    const processDecimal = (decStr: string): string => {
      if (!decStr) return '';
      let result = '';
      for (let i = 0; i < Math.min(2, decStr.length); i++) {
        const digit = parseInt(decStr[i]);
        if (digit !== 0) {
          result += numbers[digit] + decimalUnits[i];
        }
      }
      return result;
    };

    const isNegative = Number(num) < 0;
    const intResult = processInteger(integerPart);
    const decResult = processDecimal(decimalPart);

    let result = '';
    if (intResult) {
      result += intResult + '圆';
      if (!decResult) result += '整';
    }
    if (decResult) result += decResult;

    return (isNegative ? '负' : '') + result;
  } catch (error) {
    return '转换失败：' + (error as Error).message;
  }
};

// 添加人民币大写转数字的函数
const chineseCurrencyToNumber = (str: string): string => {
  try {
    const numbers: { [key: string]: number } = {
      '零': 0, '壹': 1, '贰': 2, '叁': 3, '肆': 4,
      '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9
    };
    const units: { [key: string]: number } = {
      '拾': 10, '佰': 100, '仟': 1000,
      '万': 10000, '亿': 100000000
    };
    const decimalUnits: { [key: string]: number } = {
      '角': 0.1, '分': 0.01
    };

    str = str.replace(/^负/, '-');
    const hasNegative = str.startsWith('-');
    str = str.replace(/^-/, '');

    // 分离整数和小数部分
    const parts = str.split('圆');
    if (parts.length > 2) throw new Error('格式错误：有多个"圆"字');
    
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';
    decimalPart = decimalPart.replace('整', '');

    // 处理整数部分
    let result = 0;
    let section = 0;
    let number = 0;

    for (let i = 0; i < integerPart.length; i++) {
      const char = integerPart[i];
      if (numbers[char] !== undefined) {
        number = numbers[char];
      } else if (units[char] !== undefined) {
        if (units[char] >= 10000) {
          section = (section + number) * units[char];
          result += section;
          section = 0;
          number = 0;
        } else {
          number *= units[char];
          section += number;
          number = 0;
        }
      } else if (char !== '零') {
        throw new Error('包含非法字符：' + char);
      }
    }
    result += section + number;

    // 处理小数部分
    let decimal = 0;
    for (const unit in decimalUnits) {
      const index = decimalPart.indexOf(unit);
      if (index !== -1) {
        const num = decimalPart[index - 1];
        if (!numbers[num]) throw new Error('小数部分格式错误');
        decimal += numbers[num] * decimalUnits[unit];
      }
    }

    const finalResult = result + decimal;
    return (hasNegative ? '-' : '') + finalResult.toString();
  } catch (error) {
    return '转换失败：' + (error as Error).message;
  }
};

const TextTools = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState<'text' | 'json' | 'sql' | 'xml'>('text');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [collapsed, setCollapsed] = useState(false);
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

const sampleJson = `{
  "name": "示例JSON",
  "description": "这是一个JSON示例",
  "features": ["中文", "English", "Numbers"],
  "details": {
    "version": 1.0,
    "isDemo": true,
    "stats": {
      "items": 3,
      "type": "basic"
    }
  },
  "tags": ["示例", "测试", "demo"],
  "date": "2024-03-21"
}`;

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <header>
    <title>示例XML</title>
    <description>这是一个XML示例</description>
  </header>
  <content>
    <item id="1">
      <name>测试项目1</name>
      <value>100</value>
    </item>
    <item id="2">
      <name>Test Item 2</name>
      <value>200</value>
    </item>
  </content>
  <footer>
    <timestamp>2024-03-21</timestamp>
  </footer>
</root>`;

const sampleSql = `-- 创建用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO users (username, email) VALUES
  ('张三', 'zhangsan@example.com'),
  ('李四', 'lisi@example.com');

-- 查询示例
SELECT 
  u.username,
  u.email,
  DATE_FORMAT(u.created_at, '%Y-%m-%d') as join_date
FROM users u
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY u.created_at DESC;`;

  const insertSampleText = (type: 'basic' | 'json' | 'xml' | 'sql') => {
    let sample = '';
    switch (type) {
      case 'json':
        sample = sampleJson;
        break;
      case 'xml':
        sample = sampleXml;
        break;
      case 'sql':
        sample = sampleSql;
        break;
      default:
        sample = sampleText;
    }
    setText(sample);
    toast({
      title: "已插入示例文本",
      description: `${type === 'basic' ? '基础' : type.toUpperCase()}示例文本已成功填充到输入框`,
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

  const formatSql = (sql: string): string => {
    try {
      return format(sql, {
        language: 'sql' as const,
        keywordCase: 'upper' as const,
        tabWidth: 4,
        useTabs: false,
        linesBetweenQueries: 2,
      });
    } catch (error) {
      return '无法格式化SQL：' + (error as Error).message;
    }
  };

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
        { key: 'xml', label: 'XML格式化', icon: '<' },
        { key: 'sql', label: 'SQL格式化', icon: '≡' },
        { key: 'reverse', label: '反转', icon: '↔' },
        { key: 'rmb', label: '数字转大写', icon: '¥' },
        { key: 'rmbToNumber', label: '大写转数字', icon: '1' },
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
      case 'sql':
        try {
          transformed = formatSql(text);
          setResultType('sql');
        } catch (error) {
          transformed = 'SQL格式化失败：' + error.message;
          setResultType('text');
        }
        break;
      case 'xml':
        try {
          transformed = formatXml(text, {
            indentation: '  ',
            collapseContent: true,
            lineSeparator: '\n'
          });
          setResultType('xml');
        } catch (error) {
          transformed = 'XML格式化失败：' + (error as Error).message;
          setResultType('text');
        }
        break;
      case 'rmb':
        try {
          transformed = numberToChineseCurrency(text.trim());
          setResultType('text');
        } catch (error) {
          transformed = '转换失败：' + (error as Error).message;
          setResultType('text');
        }
        break;
      case 'rmbToNumber':
        try {
          transformed = chineseCurrencyToNumber(text.trim());
          setResultType('text');
        } catch (error) {
          transformed = '转换失败：' + (error as Error).message;
          setResultType('text');
        }
        break;
      default:
        transformed = text;
        setResultType('text');
    }
    setResult(transformed);
  };

  const renderStats = () => {
    if (resultType === 'json' && jsonStats) {
      return (
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
      );
    }

    // 对于SQL、XML和普通文本，显示相同的文本统计信息
    return (
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
    );
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <FileText size={18} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium">文本输入</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-primary/10 dark:hover:bg-primary/20 border-primary/20 hover:border-primary/40 transition-all relative group"
              >
                <Sparkles size={14} className="text-primary" />
                <span>示例文字</span>
                <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[55]">
                  <div className="bg-primary rounded-lg shadow-lg border border-primary/50 p-2 min-w-[120px]">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start font-normal text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => insertSampleText('basic')}
                      >
                        基础文本
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start font-normal text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => insertSampleText('json')}
                      >
                        JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start font-normal text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => insertSampleText('xml')}
                      >
                        XML
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start font-normal text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => insertSampleText('sql')}
                      >
                        SQL
                      </Button>
                    </div>
                  </div>
                  <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />
                </div>
              </Button>
            </div>
            <Textarea
              placeholder="在此输入您要处理的文本..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] bg-background/50 border-2 border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none text-base shadow-lg shadow-primary/5 transition-all duration-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
            />
          </div>

          {/* 统计信息 */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Hash size={18} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium">
                {resultType === 'json' ? 'JSON统计' : resultType === 'sql' ? 'SQL统计' : resultType === 'xml' ? 'XML统计' : '文本统计'}
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {renderStats()}
            </div>
          </div>
        </div>

        {/* 右侧区域：输出结果 */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Link size={18} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium">处理结果</h3>
            </div>
            <div className="flex items-center gap-2">
              {(resultType === 'sql' || resultType === 'json' || resultType === 'xml') && (
                <>
                  <div className="relative group">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-primary/10 dark:hover:bg-primary/20"
                      title="选择主题"
                    >
                      <span className="text-primary text-xs">Aa</span>
                    </Button>
                    <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                      <div className="bg-card rounded-lg shadow-lg border border-border/50 p-1.5 min-w-[140px]">
                        <div className="flex flex-col gap-0.5">
                          {themes.map((theme) => (
                            <Button
                              key={theme.value}
                              size="sm"
                              variant="ghost"
                              className="h-7 justify-start font-normal text-xs hover:bg-primary/10 dark:hover:bg-primary/20"
                              onClick={() => setSelectedTheme(theme)}
                            >
                              {theme.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7 hover:bg-primary/10 dark:hover:bg-primary/20",
                      showLineNumbers && "bg-primary/10 dark:bg-primary/20"
                    )}
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    title="显示行号"
                  >
                    <List size={14} className="text-primary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-7 w-7 hover:bg-primary/10 dark:hover:bg-primary/20",
                      wrapLines && "bg-primary/10 dark:bg-primary/20"
                    )}
                    onClick={() => setWrapLines(!wrapLines)}
                    title="自动换行"
                  >
                    <WrapText size={14} className="text-primary" />
                  </Button>
                  {resultType === 'json' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7 hover:bg-primary/10 dark:hover:bg-primary/20",
                        collapsed && "bg-primary/10 dark:bg-primary/20"
                      )}
                      onClick={() => setCollapsed(!collapsed)}
                      title={collapsed ? "展开" : "折叠"}
                    >
                      {collapsed ? (
                        <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Button>
                  )}
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(result, 'result')}
                className="h-7 w-7 hover:bg-primary/10 dark:hover:bg-primary/20"
                title="复制到剪贴板"
              >
                {copiedStates['result'] ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {resultType === 'json' ? (
            <JsonPreview 
              json={result}
              showLineNumbers={showLineNumbers}
              wrapLines={wrapLines}
              selectedTheme={selectedTheme}
              collapsed={collapsed}
            />
          ) : resultType === 'sql' ? (
            <SqlPreview 
              sql={result}
              showLineNumbers={showLineNumbers}
              wrapLines={wrapLines}
              selectedTheme={selectedTheme}
            />
          ) : resultType === 'xml' ? (
            <XmlPreview 
              xml={result}
              showLineNumbers={showLineNumbers}
              wrapLines={wrapLines}
              selectedTheme={selectedTheme}
            />
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
