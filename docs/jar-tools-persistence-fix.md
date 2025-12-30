# JAR工具路径持久化修复

## 问题描述
在之前的实现中，JAR工具的项目路径历史记录使用了zustand的localStorage持久化方案。在Electron应用中，localStorage的持久化可能不够可靠，导致重新打开工具后，添加的项目路径丢失。

## 解决方案
将JAR工具的路径历史记录改为使用Electron的文件系统存储，类似于工作启动器配置的实现方式。

## 修改内容

### 1. Electron主进程 (electron/main.ts)
- 新增 `JarToolsConfigManager` 类，用于管理JAR工具配置文件
- 配置文件路径：`{userData}/jar_tools_config.json`
- 添加IPC处理器：
  - `get-jar-tools-config`: 获取JAR工具配置
  - `save-jar-tools-config`: 保存JAR工具配置

### 2. Preload脚本 (electron/preload.ts)
- 在validChannels中添加新的IPC通道：
  - `get-jar-tools-config`
  - `save-jar-tools-config`

### 3. 类型定义 (src/types/electron.d.ts)
- 更新Window.electron.ipcRenderer.invoke类型定义，支持通用的invoke调用

### 4. JarTools组件 (src/components/tools/JarTools.tsx)
- 移除对 `useUserData` hook的依赖
- 使用本地state管理路径历史记录
- 添加 `loadConfig` 和 `saveConfig` 方法，通过IPC与Electron主进程通信
- 在组件挂载时自动加载配置
- 每次修改路径历史记录时自动保存到文件

## 数据结构
```json
{
  "pathHistory": [
    {
      "id": "uuid",
      "name": "项目名称",
      "path": "D:\\path\\to\\project"
    }
  ]
}
```

## 测试验证
1. 启动应用
2. 在JAR工具中添加项目路径
3. 关闭应用
4. 重新打开应用
5. 验证之前添加的路径是否仍然存在

## 优势
- 数据持久化更可靠，使用文件系统存储
- 与其他配置管理器（工作启动器、应用设置）保持一致的实现方式
- 配置文件独立存储，便于备份和迁移
