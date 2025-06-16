import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUserData } from '@/lib/store/userDataManager';
import { Copy, Check, Database, ArrowRight, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// SQL In填充组件
const SqlInFill = () => {
  const [sql, setSql] = useState('');
  const [params, setParams] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleFill = () => {
    try {
      let paramList: string[] = [];
      
      // 处理参数输入
      if (params.includes('=')) {
        // key=value格式
        const paramMap = new Map();
        params.split(',').forEach(pair => {
          const [key, value] = pair.trim().split('=');
          paramMap.set(key.trim(), value.trim());
        });
        paramList = Array.from(paramMap.values());
      } else if (params.includes(',')) {
        // 逗号分隔
        paramList = params.split(',').map(p => p.trim());
      } else {
        // 多行输入
        paramList = params.split('\n').filter(line => line.trim());
      }

      // 检查SQL语句是否包含VALUES关键字
      let resultSql = sql;
      if (!sql.toUpperCase().includes('VALUES')) {
        // 如果不包含VALUES，添加VALUES关键字
        resultSql = `${sql.trim()} VALUES (${paramList.map(() => '?').join(', ')})`;
      }

      // 替换SQL中的问号
      paramList.forEach(param => {
        resultSql = resultSql.replace('?', `'${param}'`);
      });

      setResult(resultSql);
      toast({
        title: "填充成功",
        description: "SQL参数已成功填充",
      });
    } catch (error) {
      toast({
        title: "填充失败",
        description: error instanceof Error ? error.message : "参数填充过程中发生错误",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "复制成功",
        description: "SQL已复制到剪贴板",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">参数化SQL</CardTitle>
            </div>
            <Button onClick={handleFill} size="sm" className="h-8 gap-1.5 text-sm">
              <ArrowRight className="h-3.5 w-3.5" />
              填充
            </Button>
          </div>
          <CardDescription className="text-sm mt-1">
            输入带有?占位符的SQL语句，可以不带VALUES部分
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4">
          <div>
            <Textarea
              placeholder="INSERT INTO table_name (column1, column2) VALUES (?, ?)"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="min-h-[180px] font-mono text-sm"
            />
          </div>
          <Separator />
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">参数值</h3>
            <Textarea
              placeholder="每行一个参数值&#13;&#10;或使用逗号分隔&#13;&#10;或使用key=value格式"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="min-h-[180px] font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">处理结果</CardTitle>
            </div>
            {result && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-sm"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "已复制" : "复制"}
              </Button>
            )}
          </div>
          <CardDescription className="text-sm mt-1">
            生成的SQL语句将在这里显示
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea
            value={result}
            readOnly
            placeholder="填充后的SQL将在这里显示..."
            className="min-h-[420px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
};

// 插入语句解析组件
const InsertParser = () => {
  const [sql, setSql] = useState('');
  const [parseResult, setParseResult] = useState<Array<{
    index: number;
    field: string;
    value: string;
    length: number;
  }>>([]);
  const [syntaxValid, setSyntaxValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleParse = () => {
    try {
      // 移除多余的空格，但保留换行
      const normalizedSql = sql.replace(/[ \t]+/g, ' ').trim();

      // 1. 提取表名和列部分
      const tableAndColumnsMatch = normalizedSql.match(/INSERT\s+INTO\s+(\w+)\s*\(([\s\S]*?)\)/i);
      if (!tableAndColumnsMatch) {
        throw new Error('无效的INSERT语句格式：无法识别表名和列名');
      }

      const tableName = tableAndColumnsMatch[1];
      const columnsStr = tableAndColumnsMatch[2];
      const fields = columnsStr.split(',').map(f => f.trim());

      // 2. 提取VALUES部分
      const valuesMatch = normalizedSql.match(/VALUES\s*\(([\s\S]*)\)/i);
      if (!valuesMatch) {
        throw new Error('无效的INSERT语句格式：无法识别VALUES部分');
      }

      // 3. 解析值部分
      const valuesStr = valuesMatch[1];
      const values: string[] = [];
      let currentValue = '';
      let inQuote = false;
      let quoteChar = '';
      let escaped = false;

      for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        if (escaped) {
          currentValue += char;
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          currentValue += char;
          continue;
        }

        if (char === "'" || char === '"') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
          currentValue += char;
          continue;
        }

        if (char === ',' && !inQuote) {
          values.push(currentValue.trim());
          currentValue = '';
          continue;
        }

        currentValue += char;
      }

      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      // 4. 验证字段数量和值的数量是否匹配
      if (fields.length !== values.length) {
        throw new Error(`字段数量(${fields.length})与值的数量(${values.length})不匹配`);
      }

      // 5. 生成解析结果
      const result = fields.map((field, index) => {
        const value = values[index];
        // 移除值两端的引号（如果存在）
        const cleanValue = value.replace(/^(['"])(.*)\1$/, '$2');
        return {
          index: index + 1,
          field,
          value: cleanValue,
          length: cleanValue.length
        };
      });

      setParseResult(result);
      setSyntaxValid(true);
      
      toast({
        title: "解析成功",
        description: "SQL语句解析完成",
      });
    } catch (error) {
      console.error('SQL解析错误:', error);
      setSyntaxValid(false);
      toast({
        title: "解析失败",
        description: error instanceof Error ? error.message : "SQL解析过程中发生错误",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">INSERT语句</CardTitle>
            </div>
            <Button onClick={handleParse} size="sm" className="h-8 gap-1.5 text-sm">
              <ArrowRight className="h-3.5 w-3.5" />
              解析
            </Button>
          </div>
          <CardDescription className="text-sm mt-1">
            输入需要解析的INSERT语句，支持复杂值的解析
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea
            placeholder="INSERT INTO table_name (column1, column2) VALUES ('value1', 'value2')"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="min-h-[160px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-1.5">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">解析结果</CardTitle>
          </div>
          <CardDescription className="text-sm mt-1">
            解析后的字段和值将在这里显示
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {syntaxValid !== null && (
            <div className={cn(
              "p-2 rounded text-sm",
              syntaxValid 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            )}>
              <div className="flex items-center gap-2">
                {syntaxValid ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>语法检查通过</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>语法检查不通过</span>
                  </>
                )}
              </div>
            </div>
          )}
          {parseResult.length > 0 && (
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 min-w-[6rem] max-w-[6rem]">序号</TableHead>
                    <TableHead className="w-48">字段名</TableHead>
                    <TableHead>插入值</TableHead>
                    <TableHead className="w-32 text-right whitespace-nowrap">值长度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.map((item) => (
                    <TableRow key={item.index}>
                      <TableCell className="w-24 min-w-[6rem] max-w-[6rem] text-center">{item.index}</TableCell>
                      <TableCell className="w-48 truncate">{item.field}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="font-mono truncate" title={item.value}>
                          {item.value}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 text-right whitespace-nowrap">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {item.length}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// 截断检测组件
const TruncateDetector: React.FC = () => {
  const [createTableSql, setCreateTableSql] = useState('');
  const [insertSql, setInsertSql] = useState('');
  const [detectionResult, setDetectionResult] = useState<Array<{
    field: string;
    definedLength: number;
    actualLength: number;
    isTruncated: boolean;
    fieldType: string;
  }>>([]);
  const { toast } = useToast();

  // 解析建表SQL字段定义
  const parseCreateTable = (sql: string): { fieldDefs: Map<string, number>; fieldTypes: Map<string, string> } => {
    const fieldDefs = new Map<string, number>();
    const fieldTypes = new Map<string, string>();

    try {
      // 移除注释
      const sqlWithoutComments = sql
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      // 提取表定义部分
      const tableNameMatch = sqlWithoutComments.match(/CREATE\s+TABLE\s+([.\w_]+)\s*\(/i);
      if (!tableNameMatch) {
        throw new Error('无法解析表名');
      }

      // 获取字段定义部分
      const sqlContent = sqlWithoutComments.substring(sqlWithoutComments.indexOf('(') + 1, sqlWithoutComments.lastIndexOf(')'));
      
      // 按字段分割（排除括号内的逗号）
      const columnDefs = sqlContent
        .split(/,(?![^(]*\))/)
        .map(def => def.trim())
        .filter(def => def && !def.startsWith('PRIMARY KEY') && !def.startsWith('FOREIGN KEY') && !def.startsWith('CONSTRAINT'));

      for (const def of columnDefs) {
        // 更精确的字段定义解析
        const fieldMatch = def.match(/^(\w+)\s+([^(]+(?:\([^)]+\))?(?:\s+COLLATE\s+[^(]+)?)/i);
        if (!fieldMatch) continue;

        const name = fieldMatch[1];
        const typeInfo = fieldMatch[2].trim().toUpperCase();

        let type = typeInfo;
        let length = 0;

        // 解析类型中的长度信息
        const lengthMatch = typeInfo.match(/(\w+)\s*\((\d+)\)/);
        if (lengthMatch) {
          type = lengthMatch[1];
          length = parseInt(lengthMatch[2]);
          // 如果是N开头的类型，实际长度需要乘以2
          if (type.startsWith('N')) {
            length *= 2;
          }
        } else {
          // 处理特殊类型的默认长度
          switch (type) {
            case 'TEXT':
            case 'NTEXT':
              length = 1073741823; // SQL Server ntext 最大长度
              break;
            case 'NVARCHAR':
            case 'VARCHAR':
              if (type.includes('MAX')) {
                length = 1073741823; // SQL Server varchar(max)/nvarchar(max) 最大长度
              }
              break;
            default:
              length = 0;
          }
        }

        fieldDefs.set(name.toLowerCase(), length);
        fieldTypes.set(name.toLowerCase(), type);
      }

      return { fieldDefs, fieldTypes };
    } catch (error) {
      console.error('解析CREATE TABLE语句时出错:', error);
      throw error;
    }
  };

  const handleDetect = () => {
    try {
      // 解析CREATE TABLE语句
      const { fieldDefs, fieldTypes } = parseCreateTable(createTableSql);

      if (fieldDefs.size === 0) {
        throw new Error('未能识别到任何有效的字段定义');
      }

      // 解析INSERT语句和参数
      const insertMatch = insertSql.match(/INSERT\s+INTO\s+(?:[\w\[\]\.`"]+\.)*[\w\[\]\.`"]+\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*)\)/i);
      if (!insertMatch) {
        throw new Error('无效的INSERT语句格式');
      }

      // 解析INSERT语句中的字段名，并清理标识符
      const insertFields = insertMatch[1]
        .split(',')
        .map(f => f.trim().replace(/^[\[\`"']|[\]\`"']$/g, ''))
        .filter(f => f);

      // 解析VALUES部分，处理复杂值
      const valuesStr = insertMatch[2].trim();
      const values: string[] = [];
      let currentValue = '';
      let inQuote = false;
      let quoteChar = '';
      let escaped = false;
      
      for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        
        if (escaped) {
          currentValue += char;
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          currentValue += char;
          continue;
        }
        
        if (char === "'" || char === '"') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
          currentValue += char;
          continue;
        }
        
        if (char === ',' && !inQuote) {
          values.push(currentValue.trim());
          currentValue = '';
          continue;
        }
        
        currentValue += char;
      }
      
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      // 检查字段数量是否匹配
      if (insertFields.length !== values.length) {
        throw new Error(`字段数量(${insertFields.length})与值的数量(${values.length})不匹配`);
      }

      // 检查截断
      const result = insertFields.map((field, index) => {
        const definedLength = fieldDefs.get(field) || 0;
        const fieldType = fieldTypes.get(field) || '未知类型';
        const value = values[index];
        // 移除值两端的引号
        const cleanValue = value.replace(/^(['"])(.*)\1$/, '$2');
        // 计算实际长度
        let actualLength = cleanValue.length;
        // 如果是 nvarchar/nchar/ntext 类型，实际长度需要乘以2
        if (fieldType.startsWith('N')) {
          actualLength *= 2;
        }

        return {
          field,
          definedLength,
          actualLength,
          isTruncated: definedLength > 0 && actualLength > definedLength,
          fieldType
        };
      });

      setDetectionResult(result);
      toast({
        title: "检测完成",
        description: "字段长度检测已完成",
      });
    } catch (error) {
      console.error('检测错误:', error);
      toast({
        title: "检测失败",
        description: error instanceof Error ? error.message : "检测过程中发生错误",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-1.5">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">SQL语句输入</CardTitle>
          </div>
          <CardDescription className="text-sm mt-1">
            输入需要检测的建表语句和插入语句，支持复杂的表结构定义和值的解析
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium">建表语句</h3>
                <span className="text-xs text-muted-foreground">(CREATE TABLE)</span>
              </div>
              <Textarea
                placeholder="CREATE TABLE table_name (
  [id] int,
  [name] nvarchar(50),
  [content] text
)"
                value={createTableSql}
                onChange={(e) => setCreateTableSql(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium">插入语句</h3>
                <span className="text-xs text-muted-foreground">(INSERT INTO)</span>
              </div>
              <Textarea
                placeholder="INSERT INTO table_name (id, name, content) VALUES (1, 'test name', 'test content')"
                value={insertSql}
                onChange={(e) => setInsertSql(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 pb-4">
          <Button onClick={handleDetect} className="w-full gap-2">
            <Database className="h-4 w-4" />
            开始检测
          </Button>
        </CardFooter>
      </Card>

      {detectionResult.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">检测结果</CardTitle>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-medium">
                总字段数: {detectionResult.length}
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                正常: {detectionResult.filter(item => !item.isTruncated).length}
              </span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm inline-flex items-center gap-1">
                <X className="h-3.5 w-3.5" />
                截断: {detectionResult.filter(item => item.isTruncated).length}
              </span>
            </div>
            <CardDescription className="text-sm mt-2">
              字段长度检测结果，红色背景表示可能发生截断
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-48">字段名</TableHead>
                    <TableHead className="w-32">字段类型</TableHead>
                    <TableHead className="w-32 text-right">定义长度</TableHead>
                    <TableHead className="w-32 text-right">实际长度</TableHead>
                    <TableHead className="w-24 text-center">是否截断</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detectionResult.map((item, index) => (
                    <TableRow 
                      key={index} 
                      className={cn(
                        item.isTruncated ? "bg-red-50 hover:bg-red-100" : "hover:bg-muted/50",
                        "transition-colors"
                      )}
                    >
                      <TableCell className="font-medium">{item.field}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">
                          {item.fieldType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.definedLength > 0 ? (
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">
                            {item.definedLength}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">无限制</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">
                          {item.actualLength}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isTruncated ? (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-sm inline-flex items-center gap-1">
                            <X className="h-3.5 w-3.5" />
                            会截断
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            正常
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 主组件
const SqlTools = () => {
  return (
    <div className="p-4">
      <Tabs defaultValue="sql-in" className="w-full">
        <TabsList className="w-full h-12 bg-primary/5 p-1">
          <TabsTrigger 
            value="sql-in" 
            className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>SQL In填充</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="insert-parser"
            className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>插入语句解析</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="truncate-detector"
            className="h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>截断检测</span>
            </div>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="sql-in">
            <SqlInFill />
          </TabsContent>
          <TabsContent value="insert-parser">
            <InsertParser />
          </TabsContent>
          <TabsContent value="truncate-detector">
            <TruncateDetector />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SqlTools; 