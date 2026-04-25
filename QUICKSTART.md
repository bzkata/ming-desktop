# Ming - 快速开始指南

## 🎯 5 分钟快速上手

### 第一步：安装依赖

```bash
cd ming-desktop
npm install
```

### 第二步：运行应用

```bash
npm run dev
```

应用窗口会自动打开！

### 第三步：生成你的第一份日报

1. 点击左侧菜单的 **Dashboard**
2. 确认 **Time Range** 选择为 **Today**
3. 点击 **Generate** 按钮
4. 等待几秒钟，日报就会显示在下方

### 第四步：与 AI Agent 聊天

1. 点击左侧菜单的 **Agents**
2. 选择一个 Agent（如 "Code Assistant"）
3. 在输入框输入你的问题
4. 按回车发送消息

### 第五步：配置 LLM Provider

1. 点击左侧菜单的 **Settings**
2. 滚动到 **LLM Configuration** 部分
3. 点击 **Add Provider**
4. 填入你的 API 密钥
5. 保存设置

## 📊 日报生成详解

### 功能特点

✅ **自动扫描**：自动发现 `~/bzdev/bkdev` 和 `~/bzdev/exdev` 下的所有 Git 仓库

✅ **智能过滤**：只处理今天有改动的仓库，提升性能

✅ **全分支支持**：不会遗漏切换分支后的提交

✅ **详细统计**：显示提交数、代码变更量、涉及仓库等

### 配置你的仓库路径

如果你的项目路径不是默认的 `~/bzdev/bkdev` 和 `~/bzdev/exdev`：

1. 打开 **Settings** 页面
2. 找到 **Work Paths** 部分
3. 修改 **bkdev Directory** 和 **exdev Directory**
4. 点击 **Save Settings**

### 时间范围选项

- **Today**：今天的提交
- **Yesterday**：昨天的提交
- **This Week**：本周的提交

### 日报内容

生成的日报包含：

- 📋 **概览**：提交总数、涉及仓库数、工作时间估算
- 📝 **详细内容**：按仓库分组的提交记录
- 📊 **统计信息**：代码变更量、仓库列表等

## 🤖 使用 AI Agent

### 内置 Agent

#### 1. Code Assistant
帮助你编写、调试和审查代码。

**使用场景**：
- 代码审查
- Bug 调试
- 代码重构建议
- 最佳实践咨询

#### 2. Daily Reporter
帮助你生成和优化日报。

**使用场景**：
- 日报格式建议
- 工作内容总结
- 汇报语言优化

#### 3. Research Assistant
帮助你收集信息和创建文档。

**使用场景**：
- 技术调研
- 文档编写
- 知识整理

### 对话技巧

- **明确问题**：提供足够的上下文
- **分步提问**：复杂问题可以分步提问
- **引用代码**：可以粘贴代码片段让 Agent 分析
- **追问细节**：可以继续追问更详细的信息

## 🔌 插件系统

### 查看插件

1. 点击 **Plugins** 菜单
2. 查看所有已安装的插件
3. 可以搜索插件

### 启用/禁用插件

1. 在插件列表中找到插件
2. 点击右侧的开关图标
3. 插件状态会立即切换

### 内置插件

- **Daily Report Generator**：日报生成（已启用）
- **Code Analyzer**：代码分析（默认禁用）
- **Web Scraper**：网页抓取（默认禁用）

## ⚙️ 设置

### 外观设置

- **主题**：Light / Dark / Auto
- **语言**：简体中文 / English

### 通用设置

- **Auto Update**：自动检查更新

### 工作路径配置

配置你的项目目录，用于日报生成等功能。

### LLM 配置

添加 AI 模型提供商：

1. 点击 **Add Provider**
2. 选择 Provider 类型（OpenAI / Anthropic / Custom）
3. 输入 API Key 和 Base URL
4. 选择可用模型
5. 保存

支持的 Provider：
- **OpenAI**：GPT-4, GPT-3.5 Turbo
- **Anthropic**：Claude 3 Opus, Claude 3 Sonnet
- **Custom**：任何兼容 OpenAI API 的端点
- **Local**：本地部署的模型（Ollama 等）

## 💡 使用技巧

### 1. 快捷键

- `Cmd/Ctrl + I`：打开/关闭 DevTools
- `Cmd/Ctrl + R`：刷新应用

### 2. 批量操作

可以一次性处理多个仓库的日报，无需逐个配置。

### 3. 历史记录

Agent 的对话历史会自动保存，下次打开应用时可以继续之前的对话。

### 4. 配置备份

配置文件存储在：
- Mac: `~/Library/Application Support/ming-desktop/config.json`
- Windows: `%APPDATA%/ming-desktop/config.json`
- Linux: `~/.config/ming-desktop/config.json`

可以备份这个文件来保存你的设置。

## 🐛 常见问题

### Q: 日报生成失败？

**A:** 检查以下几点：
1. Python 3 是否已安装
2. Git 是否已安装
3. 仓库路径是否正确
4. 仓库是否有今天的提交

### Q: Agent 没有响应？

**A:** 检查：
1. LLM Provider 是否已配置
2. API Key 是否有效
3. 网络连接是否正常

### Q: 应用启动失败？

**A:** 尝试：
1. 删除 `node_modules` 重新安装
2. 清理缓存：`rm -rf ~/.ming-desktop`
3. 检查 Node.js 版本（需要 >= 18）

### Q: 如何查看日志？

**A:** 日志文件位置：
- Mac: `~/Library/Application Support/ming-desktop/logs/`
- Windows: `%APPDATA%/ming-desktop/logs/`
- Linux: `~/.config/ming-desktop/logs/`

## 🚀 下一步

- 阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 了解系统架构
- 阅读 [DEVELOPMENT.md](DEVELOPMENT.md) 了解开发流程
- 查看 [README.md](README.md) 了解完整功能列表

## 📚 更多资源

- [GitHub Repository](#)
- [Issues](#)
- [Discord Community](#)

---

有问题？欢迎在 GitHub 上提 Issue！
