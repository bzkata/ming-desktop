import { LayoutDashboard, Puzzle, MessageSquare, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../App';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plugins', label: 'Plugins', icon: Puzzle },
    { id: 'agents', label: 'Agents', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const themeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark';
    setTheme(next);
  };

  return (
    <div
      className="w-64 flex flex-col drag-region"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-default)' }}
    >
      {/* Logo - draggable */}
      <div className="p-6 no-drag" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}
          >
            銘
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>銘</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Desktop Client</p>
          </div>
        </div>
      </div>

      {/* Navigation - no drag */}
      <nav className="flex-1 p-4 space-y-2 no-drag">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer with theme toggle */}
      <div className="p-4 no-drag" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>銘 v0.1.0</span>
          <button
            onClick={cycleTheme}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
