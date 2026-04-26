import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PluginManager from './components/PluginManager';
import AgentChat from './components/AgentChat';
import Settings from './components/Settings';

interface ElectronAPI {
  plugins: {
    list: () => Promise<any[]>;
    execute: (pluginId: string, params: any) => Promise<any>;
  };
  agents: {
    create: (config: any) => Promise<string>;
    chat: (agentId: string, message: string) => Promise<string>;
    list: () => Promise<any[]>;
  };
  llm: {
    listProviders: () => Promise<any[]>;
    chat: (providerId: string, messages: any[]) => Promise<string>;
    addProvider: (config: any) => Promise<any>;
    removeProvider: (providerId: string) => Promise<void>;
    updateProvider: (providerId: string, updates: any) => Promise<void>;
  };
  executor: {
    executeCommand: (command: string, options?: any) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
    executeScript: (script: string, args?: any) => Promise<any>;
  };
  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!window.electronAPI) {
        setLoadError('Electron API 初始化失败，请重启应用');
        setIsLoading(false);
      }
    }, 3000);

    // 检查 electronAPI 是否可用
    if (!window.electronAPI) {
      console.error('Electron API not available');
      setLoadError('Electron API 不可用');
      setIsLoading(false);
    } else {
      setLoadError(null);
      setIsLoading(false);
    }

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-950">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-gray-400">Loading Ming...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-950">
        <div className="text-center">
          <div className="text-red-400 mb-2">启动失败</div>
          <div className="text-gray-400 text-sm">{loadError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-950">
      {/* 侧边栏 */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'plugins' && <PluginManager />}
        {activeTab === 'agents' && <AgentChat />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default App;
