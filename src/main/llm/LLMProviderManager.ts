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

  getDefaultProviderId(): string | null {
    const configured = this.configManager.get('defaultLLMProvider') as string | undefined;
    if (configured && this.providers.has(configured) && this.providers.get(configured)!.enabled) {
      return configured;
    }
    const first = Array.from(this.providers.values()).find(p => p.enabled);
    return first?.id ?? null;
  }

  async addProvider(config: LLMProviderConfig): Promise<LLMProvider> {
    const provider: LLMProvider = {
      id: `provider-${randomUUID().slice(0, 8)}`,
      ...config,
      enabled: true,
      models: config.models?.length
        ? config.models
        : this.getDefaultModels(config.type)
    };

    this.providers.set(provider.id, provider);

    if (provider.enabled) {
      await this.initializeProviderClient(provider);
    }

    // Save to SQLite
    const db = getDatabase();
    db.prepare(`
      INSERT INTO llm_providers (id, name, type, api_key, base_url, models, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(provider.id, provider.name, provider.type, provider.apiKey || null, provider.baseURL || null, JSON.stringify(provider.models), 1);

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
        SET name = ?, type = ?, api_key = ?, base_url = ?, models = ?, enabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(updated.name, updated.type, updated.apiKey || null, updated.baseURL || null, JSON.stringify(updated.models), updated.enabled ? 1 : 0, providerId);

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
      case 'custom':
        return ['gpt-4', 'gpt-3.5-turbo'];
      case 'local':
        return ['llama-2-7b', 'mistral-7b'];
      default:
        return ['gpt-4'];
    }
  }
}
