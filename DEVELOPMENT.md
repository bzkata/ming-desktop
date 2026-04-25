# Ming - 开发指南

## 开发环境设置

### 1. 克隆项目
```bash
git clone <repository-url>
cd ming-desktop
```

### 2. 安装依赖
```bash
npm install
```

### 3. 运行开发模式
```bash
npm run dev
```

这将启动：
- Electron 主进程
- Vite 开发服务器（渲染进程）
- 自动热重载

## 项目结构详解

```
ming-desktop/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.ts             # 主进程入口
│   │   ├── preload.ts          # 预加载脚本（IPC 桥接）
│   │   ├── plugins/            # 插件系统
│   │   │   └── PluginManager.ts
│   │   ├── agent/              # Agent 管理
│   │   │   └── AgentManager.ts
│   │   ├── llm/                # LLM Provider
│   │   │   └── LLMProviderManager.ts
│   │   ├── services/           # 核心服务
│   │   │   ├── ExecutorService.ts
│   │   │   └── ConfigManager.ts
│   │   └── utils/              # 工具函数
│   │       └── Logger.ts
│   ├── renderer/               # 渲染进程（React）
│   │   ├── components/         # React 组件
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PluginManager.tsx
│   │   │   ├── AgentChat.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── App.tsx             # 主应用组件
│   │   ├── main.tsx            # 渲染进程入口
│   │   └── index.css           # 全局样式
│   └── shared/                 # 共享代码
│       ├── ipc-channels.ts     # IPC 通道定义
│       └── types.ts            # TypeScript 类型定义
├── scripts/                    # Python 脚本
│   └── generate_daily_report.py
├── package.json
├── tsconfig.json              # TypeScript 配置
├── tsconfig.main.json         # 主进程 TypeScript 配置
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # TailwindCSS 配置
└── postcss.config.js          # PostCSS 配置
```

## 开发工作流

### 1. 修改主进程代码

```bash
# 主进程代码修改后需要重新编译
npm run build:main
```

或者使用热重载（推荐）：
```bash
npm run dev
```

### 2. 修改渲染进程代码

```bash
# Vite 会自动热重载
npm run dev
```

### 3. 添加新功能

#### 添加新 IPC 通道

1. 在 `src/shared/ipc-channels.ts` 中定义通道名称：
```typescript
export enum IPCChannels {
  MY_NEW_CHANNEL = 'my:new-channel',
}
```

2. 在 `src/main/main.ts` 中注册处理器：
```typescript
ipcMain.handle(IPCChannels.MY_NEW_CHANNEL, async (param) => {
  // 处理逻辑
  return result;
});
```

3. 在 `src/main/preload.ts` 中暴露 API：
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  myNewMethod: (param) => ipcRenderer.invoke(IPCChannels.MY_NEW_CHANNEL, param),
});
```

4. 在渲染进程中使用：
```typescript
const result = await window.electronAPI.myNewMethod(param);
```

#### 添加新组件

1. 在 `src/renderer/components/` 中创建新组件
2. 在 `App.tsx` 中引入并使用
3. 添加导航到 `Sidebar.tsx`

### 4. 调试

#### 主进程调试
- 开发模式下会自动打开 DevTools
- 使用 `Logger` 类输出日志
- 日志文件位置：`~/Library/Application Support/ming-desktop/logs/`

#### 渲染进程调试
- 按 `Cmd+Option+I` (Mac) 或 `Ctrl+Shift+I` (Windows/Linux) 打开 DevTools
- React DevTools 可以在 Chrome 扩展商店安装

#### Python 脚本调试
```bash
# 直接运行脚本查看输出
python3 scripts/generate_daily_report.py
```

## 代码规范

### TypeScript
- 使用严格模式 (`strict: true`)
- 所有函数和变量必须有类型注解
- 使用 `interface` 定义对象类型
- 使用 `enum` 定义常量集合

### React
- 使用函数组件 + Hooks
- 组件名使用 PascalCase
- 文件名使用 PascalCase
- Props 使用 TypeScript 接口定义

### 样式
- 使用 TailwindCSS
- 避免内联样式
- 复杂样式在 `index.css` 中定义

### 命名约定
- 文件名：PascalCase (组件) / camelCase (工具)
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- 类：PascalCase
- 接口：PascalCase

## 测试

### 运行测试
```bash
npm test
```

### 添加测试
```typescript
// example.test.ts
import { describe, it, expect } from 'vitest';

describe('MyModule', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## 构建和发布

### 开发构建
```bash
npm run build
```

### 生产构建
```bash
npm run build:main
npm run build:renderer
```

### 打包应用
```bash
npm run build  # 先构建
# 然后使用 electron-builder
npx electron-builder
```

### 配置打包选项
在 `package.json` 的 `build` 字段中配置：
```json
{
  "build": {
    "appId": "com.ming.desktop",
    "productName": "Ming",
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg"]
    },
    "win": {
      "target": ["nsis"]
    }
  }
}
```

## 常见问题

### Q: 修改主进程代码后没有生效？
A: 主进程代码需要重新编译：
```bash
npm run build:main
```

### Q: 渲染进程热重载不工作？
A: 确保 Vite 开发服务器正在运行：
```bash
npm run dev
```

### Q: IPC 通信失败？
A: 检查：
1. 通道名称是否一致
2. preload 脚本是否正确加载
3. 主进程是否正确注册了处理器

### Q: Python 脚本执行失败？
A: 检查：
1. Python 3 是否安装
2. 脚本路径是否正确
3. 脚本权限是否正确

### Q: 构建失败？
A: 检查：
1. Node.js 版本是否 >= 18
2. 依赖是否完整安装
3. TypeScript 错误是否已修复

## 性能优化建议

### 1. 减少主进程阻塞
- 避免在主进程执行长时间运行的同步操作
- 使用 `worker_threads` 或子进程处理耗时任务

### 2. 优化渲染进程
- 使用 React.memo 避免不必要的重渲染
- 使用 useCallback 和 useMemo 优化
- 虚拟化长列表（react-window）

### 3. 优化 IPC 通信
- 批量发送消息，减少通信次数
- 使用 Transferable Objects 传递大数据
- 避免频繁的短消息

### 4. 优化启动时间
- 延迟加载非关键模块
- 使用代码分割（Vite 自动处理）
- 预加载常用数据

## 贡献指南

### 提交代码
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码审查
- 确保 TypeScript 没有错误
- 通过所有测试
- 代码符合规范
- 添加必要的注释

## 资源链接

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev)
- [Vite 文档](https://vitejs.dev)
- [TailwindCSS 文档](https://tailwindcss.com)
- [TypeScript 文档](https://www.typescriptlang.org)

## 联系方式

- GitHub Issues
- Email: your-email@example.com

---

祝开发愉快！🚀
