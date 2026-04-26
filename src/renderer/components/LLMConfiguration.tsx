import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { LLMProvider, LLMProviderConfig } from '../../shared/types';

const PROVIDER_TYPES: { value: LLMProvider['type']; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom', label: 'OpenAI-compatible' },
];

function maskApiKey(key?: string): string {
  if (!key) return '—';
  if (key.length <= 4) return '••••';
  return `••••${key.slice(-4)}`;
}

const emptyAddForm: LLMProviderConfig = {
  name: '',
  type: 'openai',
  apiKey: '',
  baseURL: '',
  models: [],
};

const emptyEdit: { baseURL: string; modelsStr: string; apiKey: string } = {
  baseURL: '',
  modelsStr: '',
  apiKey: '',
};

export default function LLMConfiguration() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultProviderId, setDefaultProviderId] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<LLMProviderConfig>(emptyAddForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, def] = await Promise.all([
        window.electronAPI.llm.listProviders(),
        window.electronAPI.config.get('defaultLLMProvider') as Promise<string | undefined>,
      ]);
      setProviders(list);
      const enabled = list.find(p => p.enabled);
      setDefaultProviderId(
        def && list.some(p => p.id === def && p.enabled)
          ? def
          : (enabled?.id ?? '')
      );
    } catch (e) {
      console.error(e);
      setError('Failed to load LLM providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.apiKey?.trim()) {
      setError('Name and API key are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const models = addForm.models?.length
        ? addForm.models
        : undefined;
      const config: LLMProviderConfig = {
        name: addForm.name.trim(),
        type: addForm.type,
        apiKey: addForm.apiKey.trim(),
        baseURL: addForm.baseURL?.trim() || undefined,
        models,
      };
      await window.electronAPI.llm.addProvider(config);
      setShowAdd(false);
      setAddForm(emptyAddForm);
      await loadProviders();
    } catch (e) {
      console.error(e);
      setError('Failed to add provider');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove provider "${name}"?`)) return;
    setError(null);
    try {
      await window.electronAPI.llm.removeProvider(id);
      await loadProviders();
      const def = (await window.electronAPI.config.get('defaultLLMProvider')) as string | undefined;
      setDefaultProviderId(def ?? '');
    } catch (e) {
      console.error(e);
      setError('Failed to remove provider');
    }
  };

  const handleToggle = async (p: LLMProvider) => {
    setError(null);
    try {
      await window.electronAPI.llm.updateProvider(p.id, { enabled: !p.enabled });
      await loadProviders();
    } catch (e) {
      console.error(e);
      setError('Failed to update provider');
    }
  };

  const openEdit = (p: LLMProvider) => {
    setEditingId(p.id);
    setEditForm({
      baseURL: p.baseURL ?? '',
      modelsStr: p.models?.join(', ') ?? '',
      apiKey: '',
    });
    setError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const modelList = editForm.modelsStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const updates: Partial<LLMProvider> = {
        baseURL: editForm.baseURL.trim() || undefined,
      };
      if (modelList.length) {
        updates.models = modelList;
      }
      if (editForm.apiKey.trim()) {
        updates.apiKey = editForm.apiKey.trim();
      }
      await window.electronAPI.llm.updateProvider(editingId, updates);
      setEditingId(null);
      await loadProviders();
    } catch (e) {
      console.error(e);
      setError('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDefaultChange = async (id: string) => {
    setDefaultProviderId(id);
    setError(null);
    try {
      if (id) {
        await window.electronAPI.config.set('defaultLLMProvider', id);
      } else {
        await window.electronAPI.config.set('defaultLLMProvider', undefined);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to set default provider');
    }
  };

  return (
    <div>
      {error && (
        <p className="text-sm text-red-400 mb-3" role="alert">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-300 shrink-0">Default for Agent chat</label>
        <select
          className="input max-w-md"
          value={defaultProviderId}
          onChange={e => handleDefaultChange(e.target.value)}
          disabled={loading || !providers.some(p => p.enabled)}
        >
          {!providers.some(p => p.enabled) && <option value="">—</option>}
          {providers
            .filter(p => p.enabled)
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
        </select>
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setAddForm(emptyAddForm);
            setError(null);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add provider
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border border-dashed border-dark-700 rounded-lg">
          <Key size={40} className="mx-auto mb-3 opacity-50" />
          <p>No LLM providers yet. Add an API key to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {providers.map(p => (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-dark-800/80 border border-dark-700"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-100">{p.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {p.type} · {maskApiKey(p.apiKey)}
                  {p.baseURL && (
                    <span className="block truncate mt-1" title={p.baseURL}>
                      {p.baseURL}
                    </span>
                  )}
                </div>
                {p.models?.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">Models: {p.models.join(', ')}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 mr-1">Enabled</span>
                <button
                  type="button"
                  onClick={() => handleToggle(p)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    p.enabled ? 'bg-primary-600' : 'bg-dark-600'
                  }`}
                  aria-pressed={p.enabled}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      p.enabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-dark-700 text-gray-400"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id, p.name)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/90"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto border border-dark-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add provider</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-1 rounded hover:bg-dark-800 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  className="input"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. OpenAI Production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <select
                  className="input"
                  value={addForm.type}
                  onChange={e =>
                    setAddForm({ ...addForm, type: e.target.value as LLMProvider['type'] })
                  }
                >
                  {PROVIDER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">API key</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="off"
                  value={addForm.apiKey ?? ''}
                  onChange={e => setAddForm({ ...addForm, apiKey: e.target.value })}
                  placeholder="sk-…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Base URL (optional)</label>
                <input
                  className="input"
                  value={addForm.baseURL ?? ''}
                  onChange={e => setAddForm({ ...addForm, baseURL: e.target.value })}
                  placeholder={
                    addForm.type === 'anthropic'
                      ? 'https://api.anthropic.com'
                      : 'https://api.openai.com/v1'
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Models (optional)</label>
                <input
                  className="input"
                  value={addForm.models?.join(', ') ?? ''}
                  onChange={e =>
                    setAddForm({
                      ...addForm,
                      models: e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="First model is used for chat, e.g. gpt-4, gpt-3.5-turbo"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto border border-dark-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit provider</h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-1 rounded hover:bg-dark-800 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Base URL</label>
                <input
                  className="input"
                  value={editForm.baseURL}
                  onChange={e => setEditForm({ ...editForm, baseURL: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Models (comma-separated)</label>
                <input
                  className="input"
                  value={editForm.modelsStr}
                  onChange={e => setEditForm({ ...editForm, modelsStr: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">The first model is used for API calls.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New API key (optional)</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="off"
                  value={editForm.apiKey}
                  onChange={e => setEditForm({ ...editForm, apiKey: e.target.value })}
                  placeholder="Leave blank to keep current key"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
