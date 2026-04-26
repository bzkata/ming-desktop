import { EventEmitter } from 'events';
import { Agent, AgentConfig, ChatMessage } from '../../shared/types';
import { DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT } from '../../shared/dailyReportDefaults';
import { Logger } from '../utils/Logger';
import { LLMProviderManager } from '../llm/LLMProviderManager';
import { PluginManager } from '../plugins/PluginManager';
import { ConfigManager } from '../services/ConfigManager';

export class AgentManager extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private chatHistories: Map<string, ChatMessage[]> = new Map();

  constructor(
    private configManager: ConfigManager,
    private llmManager: LLMProviderManager,
    private pluginManager: PluginManager
  ) {
    super();
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing Agent Manager...');

    // 从配置中加载已创建的 agents
    // 这里可以从配置文件或数据库加载

    // 创建默认 Agent
    await this.createDefaultAgents();

    Logger.info(`Initialized ${this.agents.size} agents`);
  }

  private async createDefaultAgents(): Promise<void> {
    const dailyReporterPrompt =
      (this.configManager.get('dailyReporterSystemPrompt') as string | undefined)?.trim() ||
      DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT;

    const defaultAgents: AgentConfig[] = [
      {
        name: 'Code Assistant',
        description: 'Help with coding, debugging, and code reviews',
        model: 'gpt-4',
        systemPrompt: `You are a helpful coding assistant. You help users write, debug, and review code.
You have access to various tools including:
- Git operations
- File system operations
- Code analysis tools
- Documentation search

When appropriate, use these tools to help users more effectively.`,
        tools: ['git', 'file-system', 'code-analysis']
      },
      {
        name: 'Daily Reporter',
        description: 'Generate daily work reports from Git commits',
        model: 'gpt-4',
        systemPrompt: dailyReporterPrompt,
        tools: ['daily-report', 'git']
      },
      {
        name: 'Research Assistant',
        description: 'Help with research, documentation, and knowledge gathering',
        model: 'gpt-4',
        systemPrompt: `You are a research assistant. You help users gather information, research topics, and create documentation.
You have access to:
- Web search
- Documentation search
- Academic paper search (arXiv)
- Note-taking tools`,
        tools: ['web-search', 'arxiv', 'notes']
      }
    ];

    for (const config of defaultAgents) {
      await this.createAgent(config);
    }
  }

  async createAgent(config: AgentConfig): Promise<string> {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      ...config,
      description: config.description ?? '',
      tools: config.tools ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.agents.set(agent.id, agent);
    this.chatHistories.set(agent.id, []);

    this.emit('agent-created', agent);
    Logger.info(`Agent created: ${agent.name}`);

    return agent.id;
  }

  async chat(agentId: string, userMessage: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // 获取聊天历史
    let history = this.chatHistories.get(agentId) || [];

    // 添加用户消息
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    history.push(userMsg);

    const systemContent =
      agent.name === 'Daily Reporter'
        ? (this.configManager.get('dailyReporterSystemPrompt') as string | undefined)?.trim() ||
          agent.systemPrompt
        : agent.systemPrompt;

    // 准备发送给 LLM 的消息
    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...history.slice(-10) // 保留最近10条消息
    ];

    try {
      const providerId = this.llmManager.getDefaultProviderId();
      if (!providerId) {
        throw new Error('No LLM providers configured');
      }

      const response = await this.llmManager.chat(providerId, messages);

      // 添加助手回复
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      history.push(assistantMsg);

      // 更新聊天历史
      this.chatHistories.set(agentId, history);

      this.emit('agent-message', { agentId, message: assistantMsg });
      Logger.info(`Agent ${agent.name} responded`);

      return response;

    } catch (error) {
      Logger.error(`Agent ${agent.name} chat failed:`, error);
      throw error;
    }
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  async deleteAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.chatHistories.delete(agentId);
      this.emit('agent-deleted', agentId);
      Logger.info(`Agent deleted: ${agent.name}`);
    }
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
      this.agents.set(agentId, updated);
      this.emit('agent-updated', updated);
      Logger.info(`Agent updated: ${updated.name}`);
    }
  }

  getChatHistory(agentId: string): ChatMessage[] {
    return this.chatHistories.get(agentId) || [];
  }

  clearChatHistory(agentId: string): void {
    this.chatHistories.set(agentId, []);
    this.emit('chat-cleared', agentId);
    Logger.info(`Chat history cleared for agent: ${agentId}`);
  }
}
