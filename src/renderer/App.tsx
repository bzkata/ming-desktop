import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PluginManager from './components/PluginManager';
import AgentChat from './components/AgentChat';
import Settings from './components/Settings';
import { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // 检查 electronAPI 是否可用
    if (!window.electronAPI) {
      console.error('Electron API not available');
    } else {
      setIsLoading(false);
    }
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
