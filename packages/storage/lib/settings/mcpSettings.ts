import { createStorage } from '../base/base';
import { StorageEnum } from '../base/enums';
import type { BaseStorage } from '../base/types';
import { MCPConnection, MCPTask, ConnectionStatus, TaskStatus, ServiceType } from '../types/mcp';

// MCP Settings Storage
interface MCPSettings {
  connections: MCPConnection[];
  tasks: MCPTask[];
  enabledServices: ServiceType[];
}

const defaultSettings: MCPSettings = {
  connections: [],
  tasks: [],
  enabledServices: [],
};

const storage = createStorage<MCPSettings>('mcp-settings', defaultSettings, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// MCP Settings Store
export const mcpSettingsStore = {
  ...storage,

  // Connection Management
  async getConnections(): Promise<MCPConnection[]> {
    const settings = await this.get();
    return settings.connections || [];
  },

  async addConnection(connection: Omit<MCPConnection, 'id' | 'connectedAt'>): Promise<MCPConnection> {
    const settings = await this.get();
    const newConnection: MCPConnection = {
      ...connection,
      id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      connectedAt: Date.now(),
    };
    settings.connections.push(newConnection);
    await this.set(settings);
    return newConnection;
  },

  async updateConnection(id: string, updates: Partial<MCPConnection>): Promise<void> {
    const settings = await this.get();
    const index = settings.connections.findIndex(c => c.id === id);
    if (index !== -1) {
      settings.connections[index] = { ...settings.connections[index], ...updates };
      await this.set(settings);
    }
  },

  async removeConnection(id: string): Promise<void> {
    const settings = await this.get();
    settings.connections = settings.connections.filter(c => c.id !== id);
    // Also remove all tasks associated with this connection
    settings.tasks = settings.tasks.filter(t => t.connectionId !== id);
    await this.set(settings);
  },

  async getConnectionByService(serviceType: ServiceType): Promise<MCPConnection | null> {
    const settings = await this.get();
    return settings.connections.find(c => c.serviceType === serviceType) || null;
  },

  // Task Management
  async getTasks(): Promise<MCPTask[]> {
    const settings = await this.get();
    return settings.tasks || [];
  },

  async addTask(task: Omit<MCPTask, 'id' | 'createdAt' | 'status'>): Promise<MCPTask> {
    const settings = await this.get();
    const newTask: MCPTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: TaskStatus.PENDING,
    };
    settings.tasks.push(newTask);
    await this.set(settings);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<MCPTask>): Promise<void> {
    const settings = await this.get();
    const index = settings.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      settings.tasks[index] = { ...settings.tasks[index], ...updates };
      await this.set(settings);
    }
  },

  async removeTask(id: string): Promise<void> {
    const settings = await this.get();
    settings.tasks = settings.tasks.filter(t => t.id !== id);
    await this.set(settings);
  },

  async getTasksByConnection(connectionId: string): Promise<MCPTask[]> {
    const settings = await this.get();
    return settings.tasks.filter(t => t.connectionId === connectionId);
  },

  async clearCompletedTasks(): Promise<void> {
    const settings = await this.get();
    settings.tasks = settings.tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    await this.set(settings);
  },

  // Enabled Services Management
  async getEnabledServices(): Promise<ServiceType[]> {
    const settings = await this.get();
    return settings.enabledServices || [];
  },

  async toggleService(serviceType: ServiceType): Promise<void> {
    const settings = await this.get();
    const index = settings.enabledServices.indexOf(serviceType);
    if (index === -1) {
      settings.enabledServices.push(serviceType);
    } else {
      settings.enabledServices.splice(index, 1);
    }
    await this.set(settings);
  },
};

export default mcpSettingsStore;
