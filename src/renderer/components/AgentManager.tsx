import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Bot, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: '',
  description: '',
  model: '',
  systemPrompt: '',
  tools: '',
};

export default function AgentManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const list = await window.electronAPI.llm.listProviders();
      setProviders(list || []);
    } catch {
      setProviders([]);
    }
  };

  // Collect all enabled models from enabled providers
  const availableModels = useMemo(() => {
    const models: { value: string; label: string }[] = [];
    for (const p of providers.filter((p: any) => p.enabled)) {
      const enabled = p.enabledModels?.length ? p.enabledModels : p.models || [];
      for (const m of enabled) {
        if (!models.some((x) => x.value === m)) {
          models.push({ value: m, label: `${m} (${p.name})` });
        }
      }
    }
    return models;
  }, [providers]);

  const loadAgents = async () => {
    try {
      const list = await window.electronAPI.agents.list();
      setAgents(list);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      tools: agent.tools.join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tools = form.tools
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingId) {
        await window.electronAPI.agents.update(editingId, {
          name: form.name,
          description: form.description,
          model: form.model,
          systemPrompt: form.systemPrompt,
          tools,
        });
      } else {
        await window.electronAPI.agents.create({
          name: form.name,
          description: form.description,
          model: form.model,
          systemPrompt: form.systemPrompt,
          tools,
        });
      }
      setDialogOpen(false);
      await loadAgents();
    } catch (error) {
      console.error('Failed to save agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agentId: string, agentName: string) => {
    if (!confirm(`确定要删除 Agent "${agentName}" 吗？`)) return;
    try {
      await window.electronAPI.agents.delete(agentId);
      await loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Agent 管理</h1>
            <p className="text-muted-foreground">创建和管理你的 Agent</p>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus size={18} />
            创建 Agent
          </Button>
        </div>

        {/* Agent Cards Grid */}
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bot size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">还没有 Agent，点击上方按钮创建一个</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Bot size={20} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                        {agent.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {agent.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu size={14} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {agent.model || 'Provider 默认'}
                      </span>
                    </div>

                    {agent.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {agent.tools.map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(agent)}
                        className="flex items-center gap-1.5"
                      >
                        <Pencil size={14} />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(agent.id, agent.name)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑 Agent' : '创建 Agent'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="mb-2 block">名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Agent 名称"
                />
              </div>

              <div>
                <Label className="mb-2 block">描述</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Agent 描述"
                />
              </div>

              <div>
                <Label className="mb-2 block">模型</Label>
                <Select
                  value={form.model || '__default__'}
                  onValueChange={(v) => setForm({ ...form, model: v === '__default__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="留空使用 Provider 默认" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Provider 默认</SelectItem>
                    {availableModels.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">System Prompt</Label>
                <Textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  className="min-h-[160px]"
                  placeholder="系统提示词"
                />
              </div>

              <div>
                <Label className="mb-2 block">工具</Label>
                <Input
                  value={form.tools}
                  onChange={(e) => setForm({ ...form, tools: e.target.value })}
                  placeholder="逗号分隔，例如：search, calculator, weather"
                />
                <p className="text-xs text-muted-foreground mt-1">多个工具名用英文逗号分隔</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? '保存中...' : editingId ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
