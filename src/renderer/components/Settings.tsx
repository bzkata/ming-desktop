import { useState, useEffect } from 'react';
import { Save, RotateCcw, Key, Settings as SettingsIcon, Palette, Globe } from 'lucide-react';
import LLMConfiguration from './LLMConfiguration';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  const [language, setLanguage] = useState('zh-CN');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [workPaths, setWorkPaths] = useState({
    bzdevBkdev: '~/bzdev/bkdev',
    bzdevExdev: '~/bzdev/exdev'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await window.electronAPI.config.getAll();
      setTheme(config.theme);
      setLanguage(config.language);
      setAutoUpdate(config.autoUpdate);
      if (config.workPaths) {
        setWorkPaths(config.workPaths);
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
      // 可以添加成功提示
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
        await window.electronAPI.config.set('workPaths', {
          bzdevBkdev: '~/bzdev/bkdev',
          bzdevExdev: '~/bzdev/exdev'
        });
        await loadSettings();
      } catch (error) {
        console.error('Failed to reset settings:', error);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Configure your Ming</p>
        </div>

        {/* Appearance */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Palette className="text-primary-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-gray-400">Customize the look and feel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
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
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Globe className="text-green-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">General</h2>
              <p className="text-sm text-gray-400">General application settings</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Update</div>
              <div className="text-sm text-gray-400">Automatically check for updates</div>
            </div>
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoUpdate ? 'bg-primary-600' : 'bg-dark-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  autoUpdate ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Work Paths */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <SettingsIcon className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Work Paths</h2>
              <p className="text-sm text-gray-400">Configure your project directories</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">bkdev Directory</label>
              <input
                type="text"
                value={workPaths.bzdevBkdev}
                onChange={(e) =>
                  setWorkPaths({ ...workPaths, bzdevBkdev: e.target.value })
                }
                className="input"
                placeholder="~/bzdev/bkdev"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">exdev Directory</label>
              <input
                type="text"
                value={workPaths.bzdevExdev}
                onChange={(e) =>
                  setWorkPaths({ ...workPaths, bzdevExdev: e.target.value })
                }
                className="input"
                placeholder="~/bzdev/exdev"
              />
            </div>
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Key className="text-orange-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">LLM Configuration</h2>
              <p className="text-sm text-gray-400">API keys, models, and default provider for Agent chat</p>
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
