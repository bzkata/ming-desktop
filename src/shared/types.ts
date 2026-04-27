// 插件相关类型
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  category: string;
  entry: string;
  configSchema?: any;
  enabled: boolean;
}

export interface PluginConfig {
  pluginId: string;
  config: Record<string, any>;
}

export interface PluginExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

// Agent 相关类型
export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  tools?: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// LLM Provider 相关类型
export interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  apiKey?: string;
  baseURL?: string;
  models: string[];
  enabled: boolean;
}

export interface LLMProviderConfig {
  name: string;
  type: LLMProvider['type'];
  apiKey?: string;
  baseURL?: string;
  models?: string[];
}

// 配置相关类型
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoUpdate: boolean;
  defaultLLMProvider?: string;
  workPaths: string[];
  /** 日报 Markdown 模板，占位符：{date} {total_commits} {total_repos} {work_hours} {commit_details} {stats} {generated_at} */
  dailyReportTemplate?: string;
  /** Daily Reporter Agent 的系统提示词 */
  dailyReporterSystemPrompt?: string;
  plugins: Record<string, PluginConfig>;
  agents: Agent[];
  llmProviders: LLMProvider[];
}

// 执行结果类型
export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

// 日报相关类型
export interface DailyReportConfig {
  repoPaths: string[];
  timeRange: 'today' | 'yesterday' | 'week';
  includeAllBranches: boolean;
  filterByAuthor?: string;
  outputDir: string;
  outputFormat: 'markdown' | 'txt' | 'json';
}

export interface DailyReport {
  date: string;
  totalCommits: number;
  totalRepos: number;
  workHours: number;
  details: string;
  stats: string;
  generatedAt: string;
}
