import { randomUUID } from 'crypto';
import { PromptTemplate, PromptTemplateConfig } from '../../shared/types';
import { getDatabase } from '../database/connection';
import { Logger } from '../utils/Logger';

function normalizeTrigger(value: string): string {
  return value.trim().replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase();
}

function rowToPrompt(row: any): PromptTemplate {
  return {
    id: row.id,
    name: row.name,
    trigger: row.trigger,
    description: row.description || '',
    content: row.content,
    enabled: !!row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PromptTemplateManager {
  initialize(): void {
    Logger.info('Initializing Prompt Template Manager...');
  }

  listPrompts(): PromptTemplate[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM prompt_templates
      ORDER BY updated_at DESC
    `).all() as any[];
    return rows.map(rowToPrompt);
  }

  createPrompt(config: PromptTemplateConfig): string {
    const db = getDatabase();
    const id = `prompt-${randomUUID().slice(0, 8)}`;
    const name = config.name.trim();
    const trigger = normalizeTrigger(config.trigger || config.name);
    const description = config.description?.trim() || '';
    const content = config.content.trim();

    db.prepare(`
      INSERT INTO prompt_templates (id, name, trigger, description, content, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, trigger, description, content, config.enabled === false ? 0 : 1);

    Logger.info(`Prompt template created: ${name}`);
    return id;
  }

  updatePrompt(promptId: string, updates: Partial<PromptTemplateConfig>): void {
    const current = getDatabase()
      .prepare('SELECT * FROM prompt_templates WHERE id = ?')
      .get(promptId) as any;

    if (!current) {
      throw new Error(`Prompt template not found: ${promptId}`);
    }

    const next = {
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      trigger: updates.trigger !== undefined ? normalizeTrigger(updates.trigger) : current.trigger,
      description: updates.description !== undefined ? updates.description.trim() : current.description || '',
      content: updates.content !== undefined ? updates.content.trim() : current.content,
      enabled: updates.enabled !== undefined ? (updates.enabled ? 1 : 0) : current.enabled,
    };

    getDatabase().prepare(`
      UPDATE prompt_templates
      SET name = ?, trigger = ?, description = ?, content = ?, enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(next.name, next.trigger, next.description, next.content, next.enabled, promptId);

    Logger.info(`Prompt template updated: ${next.name}`);
  }

  deletePrompt(promptId: string): void {
    getDatabase().prepare('DELETE FROM prompt_templates WHERE id = ?').run(promptId);
    Logger.info(`Prompt template deleted: ${promptId}`);
  }
}
