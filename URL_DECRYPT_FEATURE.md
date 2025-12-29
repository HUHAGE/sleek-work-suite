# URL解密功能说明

## 功能概述
新增了一个URL解密工具，可以通过系统控制台调用 `Util.decryptUrlParams()` 方法来解密URL参数。

## 使用方法

1. 在左侧菜单中点击"URL解密"菜单项
2. 在"加密的URL"输入框中输入需要解密的URL
3. 在"利用的系统地址"输入框中输入目标系统的地址（例如：http://localhost:8080）
4. 点击"解密"按钮
5. 系统会在后台打开目标系统地址，并在控制台中调用 `Util.decryptUrlParams()` 方法
6. 解密结果会显示在"解密后的URL"区域

## 技术实现

### 前端组件
- 新增 `src/components/tools/UrlDecryptTool.tsx` 组件
- 使用 shadcn/ui 组件库构建界面
- 集成 toast 提示功能

### 后端处理
- 在 `electron/main.ts` 中添加 `decrypt-url` IPC 处理器
- 创建隐藏的浏览器窗口加载目标系统
- 在控制台中执行 JavaScript 代码调用解密方法
- 返回解密结果

### 类型定义
- 在 `src/types/electron.d.ts` 中添加 `decryptUrl` 方法的类型定义
- 在 `electron/preload.ts` 中暴露 `decryptUrl` API

## 注意事项

1. 目标系统必须包含 `Util.decryptUrlParams()` 方法
2. 系统地址必须以 `http://` 或 `https://` 开头
3. 解密过程会在后台创建一个隐藏窗口，完成后自动关闭
4. 如果目标系统需要登录，可能需要先手动登录

## 文件修改清单

- ✅ 新增：`src/components/tools/UrlDecryptTool.tsx`
- ✅ 修改：`src/pages/Index.tsx` - 添加菜单项和导入
- ✅ 修改：`electron/main.ts` - 添加 decrypt-url 处理器
- ✅ 修改：`electron/preload.ts` - 添加 decryptUrl API
- ✅ 修改：`src/types/electron.d.ts` - 添加类型定义
