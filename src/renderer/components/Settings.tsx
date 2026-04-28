import { useState, useEffect } from 'react';
import { Save, RotateCcw, Key, Settings as SettingsIcon, Palette, Globe, FileText, FolderOpen, Plus, X } from 'lucide-react';
import LLMConfiguration from './LLMConfiguration';
import {
  DEFAULT_DAILY_REPORT_TEMPLATE,
  DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT
} from '../../shared/dailyReportDefaults';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  const [language, setLanguage] = useState('zh-CN');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [workPaths, setWorkPaths] = useState<string[]>([]);
  const [dailyReportTemplate, setDailyReportTemplate] = useState(DEFAULT_DAILY_REPORT_TEMPLATE);
  const [dailyReporterSystemPrompt, setDailyReporterSystemPrompt] = useState(
    DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await window.electronAPI.config.getAll();
      setTheme(config.theme || 'dark');
      setLanguage(config.language || 'zh-CN');
      setAutoUpdate(config.autoUpdate !== false);
      if (Array.isArray(config.workPaths)) {
        setWorkPaths(config.workPaths);
      }
      if (config.dailyReportTemplate) {
        setDailyReportTemplate(config.dailyReportTemplate);
      }
      if (config.dailyReporterSystemPrompt) {
        setDailyReporterSystemPrompt(config.dailyReporterSystemPrompt);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electronAPI.config.set('theme', theme);
      await window.electronAPI.config.set('language', language);
      await window.electronAPI.config.set('autoUpdate', autoUpdate);
      await window.electronAPI.config.set('workPaths', workPaths);
      await window.electronAPI.config.set('dailyReportTemplate', dailyReportTemplate);
      await window.electronAPI.config.set('dailyReporterSystemPrompt', dailyReporterSystemPrompt);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await window.electronAPI.config.set('theme', 'dark');
        await window.electronAPI.config.set('language', 'zh-CN');
        await window.electronAPI.config.set('autoUpdate', true);
        await window.electronAPI.config.set('workPaths', []);
        await window.electronAPI.config.set('dailyReportTemplate', DEFAULT_DAILY_REPORT_TEMPLATE);
        await window.electronAPI.config.set(
          'dailyReporterSystemPrompt',
          DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT
        );
        await loadSettings();
      } catch (error) {
        console.error('Failed to reset settings:', error);
      }
    }
  };

  const handleAddPath = async () => {
    try {
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: '选择工作目录',
        properties: ['openDirectory', 'multiSelections'],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const newPaths = [...workPaths];
        for (const p of result.filePaths) {
          if (!newPaths.includes(p)) {
            newPaths.push(p);
          }
        }
        setWorkPaths(newPaths);
        await window.electronAPI.config.set('workPaths', newPaths);
      }
    } catch (error) {
      console.error('Failed to open dialog:', error);
    }
  };

  const handleRemovePath = async (index: number) => {
    const newPaths = workPaths.filter((_, i) => i !== index);
    setWorkPaths(newPaths);
    await window.electronAPI.config.set('workPaths', newPaths);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure your 銘</p>
        </div>

        {/* Appearance */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <Palette size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Customize the look and feel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--badge-success-bg)' }}>
              <Globe size={20} style={{ color: 'var(--badge-success-text)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>General</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>General application settings</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Auto Update</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Automatically check for updates</div>
            </div>
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: autoUpdate ? 'var(--accent)' : 'var(--bg-tertiary)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                style={{ left: autoUpdate ? '1.75rem' : '0.25rem' }}
              />
            </button>
          </div>
        </div>

        {/* Work Paths */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--badge-info-bg)' }}>
              <SettingsIcon size={20} style={{ color: 'var(--badge-info-text)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Work Paths</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select your project directories for daily reports</p>
            </div>
          </div>

          <div className="space-y-3">
            {workPaths.map((path, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
              >
                <FolderOpen size={16} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>{path}</span>
                <button
                  onClick={() => handleRemovePath(index)}
                  className="p-1 rounded transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--badge-error-text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {workPaths.length === 0 && (
              <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
                No paths configured. Click "Add Folder" to get started.
              </p>
            )}

            <button
              onClick={handleAddPath}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Folder
            </button>
          </div>
        </div>

        {/* Daily report prompts */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <FileText size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>日报提示词与模板</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                下方模板用于从 Git 生成 Markdown 日报；系统提示词用于「Daily Reporter」对话 Agent
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>日报 Markdown 模板</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                占位符：{'{date}'} {'{total_commits}'} {'{total_repos}'} {'{work_hours}'} {'{commit_details}'}{' '}
                {'{stats}'} {'{generated_at}'}
              </p>
              <textarea
                value={dailyReportTemplate}
                onChange={(e) => setDailyReportTemplate(e.target.value)}
                className="input font-mono text-sm min-h-[220px] w-full"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Daily Reporter 系统提示词</label>
              <textarea
                value={dailyReporterSystemPrompt}
                onChange={(e) => setDailyReporterSystemPrompt(e.target.value)}
                className="input font-mono text-sm min-h-[120px] w-full"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'var(--badge-warning-bg)' }}>
              <Key size={20} style={{ color: 'var(--badge-warning-text)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>LLM Configuration</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>API keys, models, and default provider for Agent chat</p>
            </div>
          </div>

          <LLMConfiguration />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
