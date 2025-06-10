# HUHA工作提效小助手

## 项目简介
HUHA工作提效小助手是一款基于 Electron + Vue3 开发的桌面应用程序，旨在提高日常工作效率。通过集成多种实用工具和功能，帮助用户更高效地完成工作任务。

## 技术栈
- 框架：
  - Electron - 跨平台桌面应用开发框架
  - Vue 3 - 前端框架
  - TypeScript - 开发语言
  - Vite - 构建工具
- UI组件：
  - Element Plus - Vue 3 的组件库
  - TailwindCSS - 原子化 CSS 框架
- 状态管理：
  - Pinia - Vue 3 的状态管理方案
- 开发工具：
  - ESLint - 代码检查工具
  - Prettier - 代码格式化工具

## 功能特性
- 🚀 高性能：基于 Electron 和 Vue 3 构建，确保流畅的用户体验
- 🎨 美观的 UI：使用 Element Plus 和 TailwindCSS 打造现代化界面
- 🔒 安全可靠：本地数据存储，保护用户隐私
- 🛠 丰富的工具集：集成多种实用功能
- 🌈 主题定制：支持明暗主题切换

## 开发指南

### 环境要求
- Node.js 16+
- npm 7+

### 安装依赖
```shell
npm install
```

### 开发模式运行
```shell
npm run electron:dev
```

### 打包应用
```shell
npm run electron:build
```

## 项目结构
```
src/
├── main/          # Electron 主进程
├── renderer/      # Vue 3 渲染进程
├── components/    # 公共组件
├── stores/        # Pinia 状态管理
├── styles/        # 全局样式
└── utils/         # 工具函数
```

## 贡献指南
1. Fork 本仓库
2. 创建您的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交您的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启一个 Pull Request

## 许可证
MIT License - 详见 LICENSE 文件
