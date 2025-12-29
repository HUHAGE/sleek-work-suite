# 数据库快速加解密工具 - UI 更新说明

## 更新内容

### 1. 切换控件样式优化
- **旧样式**：使用 Switch 滑块开关，左右布局
- **新样式**：使用 Tabs 标签页切换，类似 SQL 工具的顶部功能切换
- **优势**：
  - 更清晰的视觉层次
  - 更符合应用整体设计风格
  - 更好的用户体验

### 2. 输入框优化
- 添加 `resize-none` 类，禁用 Textarea 的缩放功能
- 保持固定的 6 行高度
- 避免用户误操作导致布局混乱

## 新界面布局

```
┌─────────────────────────────────────────┐
│  [解密模式]  [加密模式]  ← Tabs 切换    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  数据库快速加解密                        │
│  通过系统控制台自动加密/解密配置信息     │
│                                          │
│  密文输入/明文输入        [插入示例]     │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │  输入框（固定高度，不可缩放）       │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [解密/加密] 按钮                        │
│                                          │
│  解密结果/加密结果            [复制]     │
│  ┌────────────────────────────────────┐ │
│  │  结果显示区域                       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 代码变更

### 主要修改点

1. **导入变更**
```typescript
// 移除
import { Switch } from '@/components/ui/switch';
import { ArrowRightLeft } from 'lucide-react';

// 新增
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from 'lucide-react';
```

2. **状态管理**
```typescript
// 旧
const [isEncryptMode, setIsEncryptMode] = useState(false);

// 新
const [mode, setMode] = useState<'decrypt' | 'encrypt'>('decrypt');
```

3. **切换控件**
```typescript
// 旧 - Switch 滑块
<Switch
  checked={isEncryptMode}
  onCheckedChange={handleModeChange}
/>

// 新 - Tabs 标签页
<Tabs value={mode} onValueChange={handleModeChange}>
  <TabsList className="grid w-[400px] grid-cols-2">
    <TabsTrigger value="decrypt">解密模式</TabsTrigger>
    <TabsTrigger value="encrypt">加密模式</TabsTrigger>
  </TabsList>
</Tabs>
```

4. **输入框样式**
```typescript
// 添加 resize-none 类
<Textarea
  className="font-mono text-sm resize-none"
  rows={6}
/>
```

## 用户体验改进

1. **更直观的模式切换**
   - 标签页样式让当前模式一目了然
   - 点击区域更大，更容易操作

2. **一致的设计语言**
   - 与 SQL 工具保持一致的交互方式
   - 符合用户的使用习惯

3. **更稳定的布局**
   - 禁用输入框缩放，避免布局变形
   - 固定的界面元素位置，提升操作效率

## 兼容性

- 所有功能保持不变
- API 调用方式不变
- 数据格式不变
- 完全向后兼容
