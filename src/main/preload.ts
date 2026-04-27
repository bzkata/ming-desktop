import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannels } from '../shared/ipc-channels';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 插件 API
  plugins: {
    list: () => ipcRenderer.invoke(IPCChannels.PLUGIN_LIST),
    execute: (pluginId: string, params: any) =>
      ipcRenderer.invoke(IPCChannels.PLUGIN_EXECUTE, pluginId, params),
  },

  // Agent API
  agents: {
    create: (config: any) => ipcRenderer.invoke(IPCChannels.AGENT_CREATE, config),
    chat: (agentId: string, message: string) =>
      ipcRenderer.invoke(IPCChannels.AGENT_CHAT, agentId, message),
    list: () => ipcRenderer.invoke(IPCChannels.AGENT_LIST),
  },

  // LLM API
  llm: {
    listProviders: () => ipcRenderer.invoke(IPCChannels.LLM_LIST_PROVIDERS),
    chat: (providerId: string, messages: any[]) =>
      ipcRenderer.invoke(IPCChannels.LLM_CHAT, providerId, messages),
    addProvider: (config: any) => ipcRenderer.invoke(IPCChannels.LLM_ADD_PROVIDER, config),
    removeProvider: (providerId: string) =>
      ipcRenderer.invoke(IPCChannels.LLM_REMOVE_PROVIDER, providerId),
    updateProvider: (providerId: string, updates: any) =>
      ipcRenderer.invoke(IPCChannels.LLM_UPDATE_PROVIDER, providerId, updates),
  },

  // 执行 API
  executor: {
    executeCommand: (command: string, options?: any) =>
      ipcRenderer.invoke(IPCChannels.EXECUTE_COMMAND, command, options),
    executeScript: (script: string, args?: any) =>
      ipcRenderer.invoke(IPCChannels.EXECUTE_SCRIPT, script, args),
  },

  // 配置 API
  config: {
    get: (key: string) => ipcRenderer.invoke(IPCChannels.CONFIG_GET, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IPCChannels.CONFIG_SET, key, value),
    getAll: () => ipcRenderer.invoke(IPCChannels.CONFIG_GET_ALL),
  },

  // 对话框 API
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke(IPCChannels.DIALOG_SHOW_OPEN_DIALOG, options),
  },
});

// 类型定义
export interface ElectronAPI {
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
}
