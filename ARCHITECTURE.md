# Ming - 架构文档

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  Dashboard   │ Plugin Mgr   │  Agent Chat  │   Settings   │ │
│  │  日报生成    │  插件管理    │  AI 对话     │   设置配置   │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓ IPC
┌─────────────────────────────────────────────────────────────────┐
│                       Electron 主进程                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  IPC 通信层 (preload)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌────────────┬────────────┬────────────┬────────────┐        │
│  │   插件     │   Agent    │   LLM      │   配置     │        │
│  │  管理器    │  管理器    │  Provider  │  管理器    │        │
│  │            │            │  管理器    │            │        │
│  └────────────┴────────────┴────────────┴────────────┘        │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    执行服务层                              │   │
│  │  • 命令执行    • 脚本运行    • 进程管理                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       系统资源层                                │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ 文件系统 │ 终端执行 │  网络    │  存储    │                 │
│  │          │          │          │          │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 核心模块说明

### 1. 插件系统 (PluginManager)

**职责**：
- 发现和加载插件
- 执行插件逻辑
- 管理插件生命周期

**核心方法**：
- `loadBuiltInPlugins()` - 加载内置插件
- `loadUserPlugins()` - 加载用户插件
- `executePlugin()` - 执行插件
- `togglePlugin()` - 切换插件状态

**插件接口**：
```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  entry: string;          // 入口文件
  configSchema?: any;     // 配置 schema
  enabled: boolean;
}
```

**插件通信**：
```
UI → PluginManager.executePlugin() → 插件逻辑 → 返回结果 → UI
```

### 2. Agent 系统 (AgentManager)

**职责**：
- 创建和管理 AI Agent
- 处理 Agent 对话
- 维护聊天历史

**核心方法**：
- `createAgent()` - 创建 Agent
- `chat()` - 与 Agent 对话
- `listAgents()` - 列出所有 Agent
- `getChatHistory()` - 获取聊天历史

**Agent 结构**：
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;          // 使用的 LLM 模型
  systemPrompt: string;   // 系统提示词
  tools: string[];        // 可用工具
  createdAt: string;
  updatedAt: string;
}
```

**对话流程**：
```
用户输入 → AgentManager.chat() → LLMProviderManager.chat() → LLM API → 返回 → 保存历史 → 显示
```

### 3. LLM Provider 管理器 (LLMProviderManager)

**职责**：
- 管理多个 LLM Provider
- 统一对话接口
- 处理不同 API 格式

**支持的 Provider**：
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- 自定义端点
- 本地模型

**核心方法**：
- `addProvider()` - 添加 Provider
- `removeProvider()` - 移除 Provider
- `chat()` - 发送对话请求
- `listProviders()` - 列出所有 Provider

**配置示例**：
```typescript
{
  id: "provider-1",
  name: "OpenAI GPT-4",
  type: "openai",
  apiKey: "sk-xxx",
  baseURL: "https://api.openai.com/v1",
  models: ["gpt-4", "gpt-3.5-turbo"],
  enabled: true
}
```

### 4. 执行服务 (ExecutorService)

**职责**：
- 执行 shell 命令
- 运行脚本
- 管理后台进程

**核心方法**：
- `executeCommand()` - 执行命令
- `executeScript()` - 执行脚本
- `executeCommandInBackground()` - 后台执行
- `stopProcess()` - 停止进程

**使用场景**：
- Git 操作
- Python 脚本执行
- 文件系统操作
- 系统命令

### 5. 配置管理器 (ConfigManager)

**职责**：
- 管理应用配置
- 持久化存储
- 提供配置访问接口

**存储方式**：
- 使用 `electron-store` 进行本地存储
- 位置：`~/Library/Application Support/ming-desktop/config.json`

**核心方法**：
- `get()` - 获取配置项
- `set()` - 设置配置项
- `getAll()` - 获取所有配置
- `reset()` - 重置为默认

## 日报生成插件架构

```
Dashboard (UI)
    ↓
PluginManager.executePlugin('daily-report', params)
    ↓
executeDailyReport()
    ↓
ExecutorService.executeCommand('python3 generate_daily_report.py')
    ↓
Python 脚本执行
    ├─ 扫描 Git 仓库
    ├─ 过滤有改动的仓库
    ├─ 获取提交记录
    ├─ 生成报告
    └─ 保存到文件
    ↓
返回结果到 UI
    ↓
显示报告
```

## 数据流

### 插件执行流程
```
1. 用户在 UI 点击"Generate Report"
2. UI 调用 window.electronAPI.plugins.execute('daily-report', params)
3. Preload 脚本通过 IPC 发送请求到主进程
4. Main Process 收到 IPC 消息
5. PluginManager.executePlugin() 处理请求
6. 如果是日报插件，调用 executeDailyReport()
7. ExecutorService 执行 Python 脚本
8. 脚本生成报告并返回结果
9. 结果通过 IPC 返回到 UI
10. UI 显示报告
```

### Agent 对话流程
```
1. 用户在 Agent Chat 输入消息
2. UI 调用 window.electronAPI.agents.chat(agentId, message)
3. 通过 IPC 发送到主进程
4. AgentManager.chat() 处理请求
5. 构建消息历史（包括系统提示词）
6. 调用 LLMProviderManager.chat()
7. LLMProviderManager 调用对应的 LLM API
8. API 返回响应
9. 保存到聊天历史
10. 通过 IPC 返回到 UI
11. UI 显示响应
```

## 扩展指南

### 添加新插件

1. 在 `PluginManager.ts` 中定义插件：
```typescript
{
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Plugin description',
  category: 'utilities',
  entry: 'my-plugin/index.js',
  enabled: true
}
```

2. 实现插件逻辑
3. 在 UI 中添加插件界面

### 添加新 Agent

1. 在 `AgentManager.ts` 中定义默认 Agent
2. 配置 systemPrompt 和 tools
3. Agent 自动出现在 Agent Chat 中

### 添加新 LLM Provider

1. 在 UI Settings 中添加 Provider
2. `LLMProviderManager` 会自动初始化
3. Agent 可以选择使用哪个 Provider

## 性能优化

### 1. 快速过滤
- 日报生成时先检查仓库是否有提交
- 只处理有改动的仓库
- 减少不必要的 git 操作

### 2. 懒加载
- 插件按需加载
- Agent 对话历史按需加载
- 配置文件异步读取

### 3. 缓存
- Git 仓库列表缓存
- 插件列表缓存
- LLM 响应缓存（可选）

## 安全考虑

### 1. IPC 通信
- 使用 `contextIsolation: true`
- 通过 `preload` 暴露最小 API
- 不在渲染进程直接访问 Node.js API

### 2. 命令执行
- 限制可执行的命令范围
- 验证用户输入
- 设置超时时间

### 3. API 密钥
- 使用 `electron-store` 加密存储
- 不在日志中显示
- 支持用户自定义密钥

## 未来扩展

### 1. 插件市场
- 在线插件商店
- 插件评分和评论
- 一键安装

### 2. 工作流编排
- 可视化工作流编辑器
- 多 Agent 协作
- 任务队列

### 3. 数据持久化
- SQLite 数据库
- 历史记录查询
- 数据导出

### 4. 团队协作
- 多用户支持
- 权限管理
- 共享配置
