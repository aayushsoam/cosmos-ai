// MCP (Model Context Protocol) Type Definitions

export enum ServiceType {
  LINKEDIN = 'linkedin',
  GMAIL = 'gmail',
  WHATSAPP = 'whatsapp',
  SLACK = 'slack',
  NOTION = 'notion',
  TWITTER = 'twitter',
  CALENDAR = 'calendar',
  DRIVE = 'drive',
  TRELLO = 'trello',
  GITHUB = 'github',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface MCPConnection {
  id: string;
  serviceName: string;
  serviceType: ServiceType;
  status: ConnectionStatus;
  credentials?: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    [key: string]: string | undefined;
  };
  connectedAt: number;
  lastUsed?: number;
  metadata?: Record<string, unknown>;
  customUrl?: string;
}

export interface MCPTask {
  id: string;
  connectionId: string;
  serviceType: ServiceType;
  action: string;
  parameters: Record<string, unknown>;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

export interface ServiceTemplate {
  serviceType: ServiceType;
  name: string;
  icon: string;
  description: string;
  actions: Array<{
    id: string;
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: 'text' | 'email' | 'url' | 'number' | 'date' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    }>;
  }>;
}
