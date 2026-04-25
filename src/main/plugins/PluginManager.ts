import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Plugin, PluginExecutionResult, PluginConfig } from '../../shared/types';
import { Logger } from '../utils/Logger';
import { ExecutorService } from '../services/ExecutorService';
import { ConfigManager } from '../services/ConfigManager';

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDir: string;
  private loadedPlugins: Map<string, any> = new Map();

  constructor(
    private configManager: ConfigManager,
    private executorService?: ExecutorService
  ) {
    super();
    this.pluginDir = path.join(process.env.HOME || '', '.hermes-desktop', 'plugins');
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing Plugin Manager...');

    // 创建插件目录
    try {
      await fs.mkdir(this.pluginDir, { recursive: true });
    } catch (error) {
      Logger.error('Failed to create plugin directory:', error);
    }

    // 加载内置插件
    await this.loadBuiltInPlugins();

    // 加载用户插件
    await this.loadUserPlugins();

    Logger.info(`Loaded ${this.plugins.size} plugins`);
  }

  private async loadBuiltInPlugins(): Promise<void> {
    // 定义内置插件
    const builtInPlugins: Plugin[] = [
      {
        id: 'daily-report',
        name: 'Daily Report Generator',
        version: '1.0.0',
        description: 'Generate daily work reports from Git commit history',
        author: 'Hermes Team',
        icon: '📊',
        category: 'productivity',
        entry: 'daily-report/index.js',
        configSchema: {
          type: 'object',
          properties: {
            repoPaths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Git repository paths to scan'
            },
            timeRange: {
              type: 'string',
              enum: ['today', 'yesterday', 'week'],
              default: 'today'
            },
            includeAllBranches: {
              type: 'boolean',
              default: true
            }
          }
        },
        enabled: true
      },
      {
        id: 'code-analysis',
        name: 'Code Analyzer',
        version: '1.0.0',
        description: 'Analyze code quality and metrics',
        author: 'Hermes Team',
        icon: '🔍',
        category: 'development',
        entry: 'code-analysis/index.js',
        enabled: false
      },
      {
        id: 'web-scraper',
        name: 'Web Scraper',
        version: '1.0.0',
        description: 'Scrape and extract data from websites',
        author: 'Hermes Team',
        icon: '🌐',
        category: 'utilities',
        entry: 'web-scraper/index.js',
        enabled: false
      }
    ];

    for (const plugin of builtInPlugins) {
      this.plugins.set(plugin.id, plugin);
      Logger.info(`Built-in plugin loaded: ${plugin.name}`);
    }
  }

  private async loadUserPlugins(): Promise<void> {
    try {
      const entries = await fs.readdir(this.pluginDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginDir, entry.name);
          const manifestPath = path.join(pluginPath, 'plugin.json');

          try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const plugin: Plugin = JSON.parse(manifestContent);

            if (plugin.id && plugin.name && plugin.entry) {
              this.plugins.set(plugin.id, plugin);
              Logger.info(`User plugin loaded: ${plugin.name}`);
            }
          } catch (error) {
            Logger.error(`Failed to load plugin from ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      Logger.error('Failed to load user plugins:', error);
    }
  }

  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  async executePlugin(pluginId: string, params: any = {}): Promise<PluginExecutionResult> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return {
        success: false,
        error: `Plugin not found: ${pluginId}`
      };
    }

    if (!plugin.enabled) {
      return {
        success: false,
        error: `Plugin is disabled: ${pluginId}`
      };
    }

    try {
      Logger.info(`Executing plugin: ${plugin.name}`);

      // 特殊处理日报生成插件
      if (pluginId === 'daily-report') {
        return await this.executeDailyReport(params);
      }

      // 通用插件执行
      const result = await this.executeGenericPlugin(plugin, params);

      Logger.info(`Plugin executed successfully: ${plugin.name}`);
      return result;

    } catch (error) {
      Logger.error(`Plugin execution failed: ${plugin.name}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeDailyReport(params: any): Promise<PluginExecutionResult> {
    // 获取配置
    const config = await this.configManager.get('workPaths', {});
    const repoPaths = params.repoPaths || [
      path.join(process.env.HOME || '', 'bzdev', 'bkdev'),
      path.join(process.env.HOME || '', 'bzdev', 'exdev')
    ];

    // 构建Python脚本路径
    const scriptPath = path.join(__dirname, '../../scripts/generate_daily_report.py');

    // 执行脚本
    if (!this.executorService) {
      throw new Error('Executor service not available');
    }

    const result = await this.executorService.executeCommand(
      `python3 ${scriptPath}`,
      {
        cwd: path.join(process.env.HOME || ''),
        env: {
          REPO_PATHS: repoPaths.join(','),
          TIME_RANGE: params.timeRange || 'today',
          INCLUDE_ALL_BRANCHES: params.includeAllBranches !== false
        }
      }
    );

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr,
        logs: [result.stdout]
      };
    }

    // 读取生成的报告
    const reportPath = path.join(
      process.env.HOME || '',
      'daily-reports',
      `daily-report-${new Date().toISOString().split('T')[0]}.markdown`
    );

    let reportContent = '';
    try {
      reportContent = await fs.readFile(reportPath, 'utf-8');
    } catch (error) {
      reportContent = result.stdout;
    }

    return {
      success: true,
      data: {
        report: reportContent,
        reportPath
      },
      logs: [result.stdout]
    };
  }

  private async executeGenericPlugin(plugin: Plugin, params: any): Promise<PluginExecutionResult> {
    // 这里可以实现通用的插件执行逻辑
    // 例如：加载插件模块、执行插件函数等

    return {
      success: true,
      data: { message: `Plugin ${plugin.name} executed successfully` },
      logs: []
    };
  }

  async togglePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = !plugin.enabled;
      this.emit('plugin-toggled', { pluginId, enabled: plugin.enabled });
      Logger.info(`Plugin ${plugin.name} ${plugin.enabled ? 'enabled' : 'disabled'}`);
    }
  }

  async installPlugin(pluginPath: string): Promise<void> {
    // 实现插件安装逻辑
    Logger.info(`Installing plugin from: ${pluginPath}`);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    // 实现插件卸载逻辑
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      Logger.info(`Plugin uninstalled: ${plugin.name}`);
    }
  }
}
