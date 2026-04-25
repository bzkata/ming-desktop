import { useState, useEffect } from 'react';
import { Puzzle, Search, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  category: string;
  enabled: boolean;
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const result = await window.electronAPI.plugins.list();
      setPlugins(result);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId);
    if (plugin) {
      // 这里需要实现切换插件状态的逻辑
      const updated = plugins.map(p =>
        p.id === pluginId ? { ...p, enabled: !p.enabled } : p
      );
      setPlugins(updated);
    }
  };

  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'productivity': 'bg-blue-500/20 text-blue-400',
      'development': 'bg-green-500/20 text-green-400',
      'utilities': 'bg-purple-500/20 text-purple-400',
      'ai': 'bg-orange-500/20 text-orange-400',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Plugins</h1>
            <p className="text-gray-400">Manage and configure your plugins</p>
          </div>

          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Install Plugin
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-400">{plugins.length}</div>
            <div className="text-sm text-gray-400">Total Plugins</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-400">
              {plugins.filter(p => p.enabled).length}
            </div>
            <div className="text-sm text-gray-400">Enabled</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-gray-400">
              {plugins.filter(p => !p.enabled).length}
            </div>
            <div className="text-sm text-gray-400">Disabled</div>
          </div>
        </div>

        {/* Plugin List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading plugins...</div>
        ) : filteredPlugins.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No plugins found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlugins.map((plugin) => (
              <div key={plugin.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {plugin.icon ? (
                      <div className="text-3xl">{plugin.icon}</div>
                    ) : (
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <Puzzle className="text-primary-400" size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{plugin.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{plugin.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>v{plugin.version}</span>
                        <span>•</span>
                        <span>{plugin.author}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(plugin.id)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    {plugin.enabled ? (
                      <ToggleRight className="text-green-400" size={24} />
                    ) : (
                      <ToggleLeft className="text-gray-400" size={24} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                  <span className={`badge ${getCategoryColor(plugin.category)}`}>
                    {plugin.category}
                  </span>
                  <button className="text-sm text-primary-400 hover:text-primary-300">
                    Configure →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
