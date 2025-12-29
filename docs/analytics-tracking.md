# Umami 数据分析埋点文档

本文档记录了应用中已添加的 Umami 分析埋点，方便后续查看和分析各工具的使用情况。

## 埋点概览

### 1. 数据库加解密工具 (DbDecryptTool)

**工具标识**: `db_decrypt`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `tool_db_decrypt_decrypt_start` | 点击解密按钮 | 开始解密操作 |
| `tool_db_decrypt_decrypt_success` | 解密成功 | 解密操作成功完成 |
| `tool_db_decrypt_decrypt_failed` | 解密失败 | 解密操作失败 |
| `tool_db_decrypt_encrypt_start` | 点击加密按钮 | 开始加密操作 |
| `tool_db_decrypt_encrypt_success` | 加密成功 | 加密操作成功完成 |
| `tool_db_decrypt_encrypt_failed` | 加密失败 | 加密操作失败 |
| `button_click` (tool: db_decrypt, button: copy_result) | 点击复制结果 | 复制加解密结果 |
| `button_click` (tool: db_decrypt, button: insert_sample_encrypt/decrypt) | 插入示例 | 插入加密或解密示例 |
| `button_click` (tool: db_decrypt, button: switch_mode_encrypt/decrypt) | 切换模式 | 切换加密/解密模式 |

### 2. JAR 文件管理工具 (JarTools)

**工具标识**: `jar_tools`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `tool_jar_tools_scan_start` | 点击扫描按钮 | 开始扫描 JAR 文件 |
| `tool_jar_tools_scan_success` | 扫描成功 | 扫描成功，包含文件数量 |
| `tool_jar_tools_scan_failed` | 扫描失败 | 扫描操作失败 |
| `button_click` (tool: jar_tools, button: select_path) | 选择路径 | 打开文件夹选择对话框 |
| `button_click` (tool: jar_tools, button: open_path) | 打开路径 | 在文件管理器中打开路径 |
| `button_click` (tool: jar_tools, button: copy_single) | 复制单个文件 | 复制单个 JAR 文件 |
| `button_click` (tool: jar_tools, button: copy_batch) | 批量复制 | 批量复制选中的 JAR 文件 |

### 3. URL 解密工具 (UrlDecryptTool)

**工具标识**: `url_decrypt`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `tool_url_decrypt_decrypt_start` | 点击解密按钮 | 开始解密 URL |
| `tool_url_decrypt_decrypt_success` | 解密成功 | URL 解密成功 |
| `tool_url_decrypt_decrypt_failed` | 解密失败 | URL 解密失败 |
| `button_click` (tool: url_decrypt, button: copy_result) | 复制结果 | 复制解密后的 URL |

### 4. 文本工具 (TextTools)

**工具标识**: `text_tools`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `button_click` (tool: text_tools, button: uppercase) | 转大写 | 文本转大写 |
| `button_click` (tool: text_tools, button: lowercase) | 转小写 | 文本转小写 |
| `button_click` (tool: text_tools, button: capitalize) | 首字母大写 | 首字母大写 |
| `button_click` (tool: text_tools, button: reverse) | 反转 | 文本反转 |
| `button_click` (tool: text_tools, button: base64) | Base64编码 | Base64 编码 |
| `button_click` (tool: text_tools, button: base64decode) | Base64解码 | Base64 解码 |
| `button_click` (tool: text_tools, button: url) | URL编码 | URL 编码 |
| `button_click` (tool: text_tools, button: urldecode) | URL解码 | URL 解码 |
| `button_click` (tool: text_tools, button: unicode) | Unicode编码 | Unicode 编码 |
| `button_click` (tool: text_tools, button: unicodedecode) | Unicode解码 | Unicode 解码 |
| `button_click` (tool: text_tools, button: json) | JSON格式化 | JSON 格式化 |
| `button_click` (tool: text_tools, button: xml) | XML格式化 | XML 格式化 |
| `button_click` (tool: text_tools, button: sql) | SQL格式化 | SQL 格式化 |
| `button_click` (tool: text_tools, button: rmb) | 数字转大写 | 数字转人民币大写 |
| `button_click` (tool: text_tools, button: rmbToNumber) | 大写转数字 | 人民币大写转数字 |
| `button_click` (tool: text_tools, button: copy_result) | 复制结果 | 复制处理结果 |
| `button_click` (tool: text_tools, button: insert_sample_basic/json/xml/sql) | 插入示例 | 插入各类示例文本 |

### 5. HUHA 工具集 (HuhaTools)

**工具标识**: `huha_tools`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `tool_huha_tools_load_start` | 组件加载 | 开始加载 HUHA 工具集 |
| `tool_huha_tools_load_complete` | iframe 加载完成 | HUHA 工具集加载完成 |

### 6. 设置工具 (SettingsTools)

**工具标识**: `settings`

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `button_click` (tool: settings, button: toggle_sidebar_on/off) | 切换侧边栏 | 显示/隐藏侧边栏 |
| `button_click` (tool: settings, button: change_theme_light/dark/system) | 切换主题 | 切换浅色/深色/系统主题 |
| `button_click` (tool: settings, button: change_theme_color_*) | 切换主题色 | 切换主题颜色 |

### 7. 菜单管理 (MenuManagement)

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `menu_toggle` | 切换菜单显示 | 启用/禁用菜单项 |
| `menu_reorder` | 菜单排序 | 上移/下移菜单项 |

### 8. 菜单切换 (Index)

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `menu_switch` | 切换工具 | 切换到不同的工具页面 |

## 数据分析建议

### 关键指标

1. **工具受欢迎程度**
   - 通过 `menu_switch` 事件统计各工具的访问次数
   - 分析哪些工具最常被使用

2. **功能使用频率**
   - 统计各工具内具体功能的使用次数
   - 识别高频使用的功能和冷门功能

3. **成功率分析**
   - 对比 `*_start` 和 `*_success`/`*_failed` 事件
   - 计算各功能的成功率

4. **用户行为路径**
   - 分析用户在不同工具间的切换路径
   - 了解用户的使用习惯

### 优化方向

根据数据分析结果，可以：
- 优化高频使用功能的用户体验
- 改进或移除低使用率功能
- 提高失败率较高功能的稳定性
- 根据用户行为优化菜单布局

## 技术实现

埋点通过 `src/lib/analytics.ts` 中的工具函数实现：

```typescript
// 跟踪工具使用
trackToolUsage(toolName, action, extra?)

// 跟踪按钮点击
trackButtonClick(toolName, buttonName)

// 跟踪菜单切换
trackMenuSwitch(menuName)
```

所有事件都会自动发送到 Umami 分析平台进行统计和分析。
