import { EventEmitter } from 'events';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMProviderConfig, ChatMessage } from '../../shared/types';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../services/ConfigManager';

export class LLMProviderManager extends EventEmitter {
  private providers: Map<string, LLMProvider> = new Map();
  private clients: Map<string, OpenAI | Anthropic> = new Map();

  constructor(private configManager: ConfigManager) {
    super();
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing LLM Provider Manager...');

    // 从配置中加载已配置的 providers
    const savedProviders = await this.configManager.get('llmProviders', []);
    for (const provider of savedProviders) {
      this.providers.set(provider.id, provider);
      if (provider.enabled) {
        await this.initializeProviderClient(provider);
      }
    }

    Logger.info(`Loaded ${this.providers.size} LLM providers`);
  }

  private async initializeProviderClient(provider: LLMProvider): Promise<void> {
    try {
      let client: OpenAI | Anthropic;

      if (provider.type === 'openai' || provider.type === 'custom') {
        client = new OpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || 'https://api.openai.com/v1'
        });
      } else if (provider.type === 'anthropic') {
        client = new Anthropic({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL
        });
      } else {
        throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      this.clients.set(provider.id, client);
      Logger.info(`Initialized client for provider: ${provider.name}`);
    } catch (error) {
      Logger.error(`Failed to initialize client for ${provider.name}:`, error);
    }
  }

  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  async addProvider(config: LLMProviderConfig): Promise<void> {
    const provider: LLMProvider = {
      id: `provider-${Date.now()}`,
      ...config,
      enabled: true,
      models: config.models || this.getDefaultModels(config.type)
    };

    this.providers.set(provider.id, provider);

    if (provider.enabled) {
      await this.initializeProviderClient(provider);
    }

    // 保存到配置
    const allProviders = Array.from(this.providers.values());
    await this.configManager.set('llmProviders', allProviders);

    this.emit('provider-added', provider);
    Logger.info(`LLM provider added: ${provider.name}`);
  }

  async removeProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      this.providers.delete(providerId);
      this.clients.delete(providerId);

      // 保存到配置
      const allProviders = Array.from(this.providers.values());
      await this.configManager.set('llmProviders', allProviders);

      this.emit('provider-removed', providerId);
      Logger.info(`LLM provider removed: ${provider.name}`);
    }
  }

  async updateProvider(providerId: string, updates: Partial<LLMProvider>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      const updated = { ...provider, ...updates };
      this.providers.set(providerId, updated);

      // 重新初始化客户端如果配置改变
      if (updates.apiKey || updates.baseURL || updates.type) {
        this.clients.delete(providerId);
        if (updated.enabled) {
          await this.initializeProviderClient(updated);
        }
      }

      // 保存到配置
      const allProviders = Array.from(this.providers.values());
      await this.configManager.set('llmProviders', allProviders);

      this.emit('provider-updated', updated);
      Logger.info(`LLM provider updated: ${updated.name}`);
    }
  }

  async chat(providerId: string, messages: ChatMessage[]): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const client = this.clients.get(providerId);
    if (!client) {
      throw new Error(`Provider client not initialized: ${providerId}`);
    }

    try {
      if (provider.type === 'openai' || provider.type === 'custom') {
        return await this.chatWithOpenAI(client as OpenAI, provider, messages);
      } else if (provider.type === 'anthropic') {
        return await this.chatWithAnthropic(client as Anthropic, provider, messages);
      } else {
        throw new Error(`Unsupported provider type: ${provider.type}`);
      }
    } catch (error) {
      Logger.error(`Chat failed with provider ${provider.name}:`, error);
      throw error;
    }
  }

  private async chatWithOpenAI(
    client: OpenAI,
    provider: LLMProvider,
    messages: ChatMessage[]
  ): Promise<string> {
    const response = await client.chat.completions.create({
      model: provider.models[0] || 'gpt-4',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7,
      max_tokens: 2048
    });

    return response.choices[0]?.message?.content || '';
  }

  private async chatWithAnthropic(
    client: Anthropic,
    provider: LLMProvider,
    messages: ChatMessage[]
  ): Promise<string> {
    const response = await client.messages.create({
      model: provider.models[0] || 'claude-3-opus-20240229',
      max_tokens: 2048,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
      system: messages.find(m => m.role === 'system')?.content || ''
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : '';
  }

  private getDefaultModels(type: LLMProvider['type']): string[] {
    switch (type) {
      case 'openai':
        return ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
      case 'local':
        return ['llama-2-7b', 'mistral-7b'];
      default:
        return [];
    }
  }
}
