import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  };
  git: {
    scanRepos: () => Promise<{ name: string; path: string }[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Theme context
type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const applyTheme = useCallback((t: Theme) => {
    const resolved = t === 'auto' ? getSystemTheme() : t;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    window.electronAPI?.config.set('theme', t);
  }, [applyTheme]);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await window.electronAPI?.config.get('theme');
      const t = saved || 'dark';
      setThemeState(t);
      applyTheme(t);
    };
    loadTheme();

    // Listen for system theme changes when auto
    const handler = () => {
      if (theme === 'auto') applyTheme('auto');
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handler);
    };
  }, [applyTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
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
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center">
            <div className="text-4xl mb-4">銘</div>
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (loadError) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-center">
            <div style={{ color: 'var(--badge-error-text)' }} className="mb-2">启动失败</div>
            <div style={{ color: 'var(--text-muted)' }} className="text-sm">{loadError}</div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content with drag bar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* macOS drag bar */}
          <div className="drag-region flex-shrink-0" style={{ height: '32px', background: 'var(--bg-secondary)' }} />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'plugins' && <PluginManager />}
            {activeTab === 'agents' && <AgentChat />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
