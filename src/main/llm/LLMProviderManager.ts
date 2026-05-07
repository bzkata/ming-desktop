import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMProviderConfig, ChatMessage } from '../../shared/types';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../services/ConfigManager';
import { getDatabase } from '../database/connection';

export class LLMProviderManager extends EventEmitter {
  private providers: Map<string, LLMProvider> = new Map();
  private clients: Map<string, OpenAI | Anthropic> = new Map();

  constructor(private configManager: ConfigManager) {
    super();
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing LLM Provider Manager...');

    // Load from SQLite
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM llm_providers').all() as any[];

    for (const row of rows) {
      const provider: LLMProvider = {
        id: row.id,
        name: row.name,
        type: row.type,
        apiKey: row.api_key,
        baseURL: row.base_url,
        models: JSON.parse(row.models || '[]'),
        enabledModels: JSON.parse(row.enabled_models || '[]'),
        enabled: !!row.enabled
      };
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

      if (provider.type === 'openai' || provider.type === 'custom' || provider.type === 'qwen' || provider.type === 'deepseek') {
        const defaultBaseURL = provider.type === 'qwen'
          ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          : provider.type === 'deepseek'
            ? 'https://api.deepseek.com/v1'
            : 'https://api.openai.com/v1';
        client = new OpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL || defaultBaseURL
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

  getDefaultProviderId(): string | null {
    const configured = this.configManager.get('defaultLLMProvider') as string | undefined;
    if (configured && this.providers.has(configured) && this.providers.get(configured)!.enabled) {
      return configured;
    }
    const first = Array.from(this.providers.values()).find(p => p.enabled);
    return first?.id ?? null;
  }

  async addProvider(config: LLMProviderConfig): Promise<LLMProvider> {
    const defaultModels = config.models?.length
      ? config.models
      : this.getDefaultModels(config.type);
    const provider: LLMProvider = {
      id: `provider-${randomUUID().slice(0, 8)}`,
      ...config,
      enabled: true,
      models: defaultModels,
      enabledModels: defaultModels, // all default models enabled by default
    };

    this.providers.set(provider.id, provider);

    if (provider.enabled) {
      await this.initializeProviderClient(provider);
    }

    // Save to SQLite
    const db = getDatabase();
    db.prepare(`
      INSERT INTO llm_providers (id, name, type, api_key, base_url, models, enabled, enabled_models)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(provider.id, provider.name, provider.type, provider.apiKey || null, provider.baseURL || null, JSON.stringify(provider.models), 1, JSON.stringify(provider.enabledModels));

    this.emit('provider-added', provider);
    Logger.info(`LLM provider added: ${provider.name}`);
    return provider;
  }

  async removeProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      this.providers.delete(providerId);
      this.clients.delete(providerId);

      const currentDefault = this.configManager.get('defaultLLMProvider') as string | undefined;
      if (currentDefault === providerId) {
        this.configManager.delete('defaultLLMProvider');
      }

      // Remove from SQLite
      const db = getDatabase();
      db.prepare('DELETE FROM llm_providers WHERE id = ?').run(providerId);

      this.emit('provider-removed', providerId);
      Logger.info(`LLM provider removed: ${provider.name}`);
    }
  }

  async updateProvider(providerId: string, updates: Partial<LLMProvider>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (provider) {
      const updated = { ...provider, ...updates };
      this.providers.set(providerId, updated);

      // Reinitialize client if relevant config changed
      if (
        updates.apiKey !== undefined ||
        updates.baseURL !== undefined ||
        updates.type !== undefined ||
        updates.enabled !== undefined
      ) {
        this.clients.delete(providerId);
        if (updated.enabled) {
          await this.initializeProviderClient(updated);
        }
      }

      // Save to SQLite
      const db = getDatabase();
      db.prepare(`
        UPDATE llm_providers
        SET name = ?, type = ?, api_key = ?, base_url = ?, models = ?, enabled = ?, enabled_models = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(updated.name, updated.type, updated.apiKey || null, updated.baseURL || null, JSON.stringify(updated.models), updated.enabled ? 1 : 0, JSON.stringify(updated.enabledModels), providerId);

      this.emit('provider-updated', updated);
      Logger.info(`LLM provider updated: ${updated.name}`);
    }
  }

  async chat(providerId: string, messages: ChatMessage[], model?: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const client = this.clients.get(providerId);
    if (!client) {
      throw new Error(`Provider client not initialized: ${providerId}`);
    }

    try {
      if (provider.type === 'openai' || provider.type === 'custom' || provider.type === 'qwen' || provider.type === 'deepseek') {
        return await this.chatWithOpenAI(client as OpenAI, provider, messages, model);
      } else if (provider.type === 'anthropic') {
        return await this.chatWithAnthropic(client as Anthropic, provider, messages, model);
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
    messages: ChatMessage[],
    model?: string
  ): Promise<string> {
    const response = await client.chat.completions.create({
      model: model || provider.models[0] || 'gpt-4',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7,
      max_tokens: 2048
    });

    const msg = response.choices[0]?.message;
    const content = msg?.content || '';
    // Some providers (DeepSeek, Qwen) return reasoning in a separate field
    const reasoning = (msg as any)?.reasoning_content;
    if (reasoning) {
      return `<think>${reasoning}</think>\n${content}`;
    }
    return content;
  }

  private async chatWithAnthropic(
    client: Anthropic,
    provider: LLMProvider,
    messages: ChatMessage[],
    model?: string
  ): Promise<string> {
    const response = await client.messages.create({
      model: model || provider.models[0] || 'claude-3-opus-20240229',
      max_tokens: 2048,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
      system: messages.find(m => m.role === 'system')?.content || ''
    });

    // Check for thinking blocks (Anthropic extended thinking)
    const parts = response.content as Array<{ type: string; text?: string; thinking?: string }>;
    const thinkingText = parts.filter(b => b.type === 'thinking').map(b => b.thinking || b.text || '').join('\n');
    const textParts = parts.filter(b => b.type === 'text').map(b => b.text || '');
    const mainText = textParts.join('\n');
    if (thinkingText) {
      return `<think>${thinkingText}</think>\n${mainText}`;
    }
    return mainText;
  }

  private getDefaultModels(type: LLMProvider['type']): string[] {
    switch (type) {
      case 'openai':
        return ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
      case 'custom':
        return ['gpt-4', 'gpt-3.5-turbo'];
      case 'qwen':
        return ['qwen-turbo', 'qwen-plus', 'qwen-max'];
      case 'deepseek':
        return ['deepseek-chat', 'deepseek-coder'];
      case 'local':
        return ['llama-2-7b', 'mistral-7b'];
      default:
        return ['gpt-4'];
    }
  }

  async fetchModels(providerId: string): Promise<string[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const client = this.clients.get(providerId);
    if (!client) {
      throw new Error(`Provider client not initialized: ${providerId}`);
    }

    try {
      if (provider.type === 'anthropic') {
        // Anthropic has no public models endpoint; return defaults
        return this.getDefaultModels('anthropic');
      }

      // OpenAI-compatible: call /models endpoint
      const openaiClient = client as OpenAI;
      const response = await openaiClient.models.list();
      const modelIds = response.data
        .map(m => m.id)
        .sort();

      // Update stored models
      provider.models = modelIds;
      const db = getDatabase();
      db.prepare('UPDATE llm_providers SET models = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(JSON.stringify(modelIds), providerId);

      Logger.info(`Fetched ${modelIds.length} models for provider ${provider.name}`);
      return modelIds;
    } catch (error) {
      Logger.error(`Failed to fetch models for ${provider.name}:`, error);
      throw error;
    }
  }
}
