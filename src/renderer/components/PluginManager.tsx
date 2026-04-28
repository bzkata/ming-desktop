import { useState, useEffect } from 'react';
import { Puzzle, Search, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  const getCategoryBadgeVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'productivity': 'default',
      'development': 'secondary',
      'utilities': 'outline',
      'ai': 'destructive',
    };
    return variants[category.toLowerCase()] || 'outline';
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Plugins</h1>
            <p className="text-muted-foreground">Manage and configure your plugins</p>
          </div>

          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Install Plugin
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{plugins.length}</div>
              <div className="text-sm text-muted-foreground">Total Plugins</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">
                {plugins.filter(p => p.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-muted-foreground">
                {plugins.filter(p => !p.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Disabled</div>
            </CardContent>
          </Card>
        </div>

        {/* Plugin List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading plugins...</div>
        ) : filteredPlugins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No plugins found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {plugin.icon ? (
                        <div className="text-3xl">{plugin.icon}</div>
                      ) : (
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Puzzle className="text-primary" size={24} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{plugin.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{plugin.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>v{plugin.version}</span>
                          <span>•</span>
                          <span>{plugin.author}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(plugin.id)}
                    >
                      {plugin.enabled ? (
                        <ToggleRight className="text-green-400" size={24} />
                      ) : (
                        <ToggleLeft className="text-muted-foreground" size={24} />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge variant={getCategoryBadgeVariant(plugin.category)}>
                      {plugin.category}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-primary/80">
                      Configure →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
