# Ming

🚀 一个强大的 Electron 桌面应用，集成了 AI Agent、插件系统和开发工具。

## ✨ 特性

- **🤖 AI Agent 系统**：内置多个智能 Agent，支持对话式交互
- **🔌 插件系统**：可扩展的插件架构，轻松添加新功能
- **📊 日报生成**：自动从 Git 提交记录生成工作日报
- **🎨 现代化 UI**：基于 React + TailwindCSS 的美观界面
- **⚡ 高性能**：使用 Vite 构建，快速响应
- **🔧 可配置**：灵活的配置系统，支持自定义

## 🏗️ 架构

```
Ming
├── 主进程 (Main Process)
│   ├── 插件管理器 (PluginManager)
│   ├── Agent 管理器 (AgentManager)
│   ├── LLM Provider 管理器 (LLMProviderManager)
│   ├── 执行服务 (ExecutorService)
│   └── 配置管理器 (ConfigManager)
├── 渲染进程 (Renderer Process)
│   ├── Dashboard - 仪表板和日报生成
│   ├── Plugin Manager - 插件管理
│   ├── Agent Chat - Agent 聊天
│   └── Settings - 设置
└── 插件 (Plugins)
    └── Daily Report Generator
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9
- Python 3.x (用于日报生成脚本)

### 安装依赖

```bash
cd ming-desktop
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📦 核心功能

### 1. 日报生成

自动从 Git 仓库生成工作日报：

- ✅ 自动扫描多个 Git 仓库
- ✅ 快速过滤今天有改动的仓库
- ✅ 支持所有分支（不会遗漏切换分支的提交）
- ✅ 按作者过滤
- ✅ 详细的提交统计

配置路径：
- `~/bzdev/bkdev`
- `~/bzdev/exdev`

### 2. AI Agent

内置多个智能 Agent：

- **Code Assistant**：代码助手，帮助编写、调试和审查代码
- **Daily Reporter**：日报生成助手
- **Research Assistant**：研究助手，帮助收集信息和创建文档

### 3. 插件系统

可扩展的插件架构：

- 内置插件：日报生成、代码分析、网页抓取
- 支持自定义插件
- 插件启用/禁用
- 插件配置管理

### 4. LLM Provider

支持多个 AI 模型提供商：

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- 自定义端点
- 本地模型

## 🔧 配置

配置文件位置：`~/Library/Application Support/ming-desktop/config.json`

### 工作路径配置

```json
{
  "workPaths": {
    "bzdevBkdev": "~/bzdev/bkdev",
    "bzdevExdev": "~/bzdev/exdev"
  }
}
```

### LLM Provider 配置

在应用的 Settings 页面添加 LLM Provider。

## 📁 项目结构

```
ming-desktop/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── main.ts        # 主进程入口
│   │   ├── preload.ts     # 预加载脚本
│   │   ├── plugins/       # 插件系统
│   │   ├── agent/         # Agent 管理
│   │   ├── llm/           # LLM Provider
│   │   ├── services/      # 核心服务
│   │   └── utils/         # 工具函数
│   ├── renderer/          # 渲染进程代码
│   │   ├── components/    # React 组件
│   │   ├── App.tsx        # 主应用
│   │   └── main.tsx       # 入口文件
│   └── shared/            # 共享类型定义
├── scripts/               # Python 脚本
│   └── generate_daily_report.py
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 未来计划

- [ ] 更多内置插件
- [ ] Agent 工作流编排
- [ ] 任务队列系统
- [ ] Webhook 集成
- [ ] 数据持久化（SQLite）
- [ ] 插件市场
- [ ] 团队协作功能
- [ ] 移动端适配

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- Electron
- React
- Vite
- TailwindCSS
- Lucide Icons
