// 데모 페이지 타입 정의

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface Server {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  location: string;
  type: string;
  metrics: ServerMetrics;
  uptime: number;
  lastUpdate: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedServers?: string[];
  hasChart?: boolean;
  actionButtons?: string[];
}

export interface SystemStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  activeAlerts: number;
  lastUpdate: Date;
}

export interface DemoScenario {
  id: string;
  delay: number;
  type: 'user' | 'ai';
  content: string;
  actions?: {
    highlightServers?: string[];
    showServerDetail?: string;
    updateMetrics?: { serverId: string; metrics: Partial<ServerMetrics> }[];
    showChart?: boolean;
  };
}

export interface DemoState {
  servers: Server[];
  chatMessages: ChatMessage[];
  systemStatus: SystemStatus;
  selectedServer: Server | null;
  highlightedServers: string[];
  isAutoDemo: boolean;
  currentScenarioIndex: number;
  isTyping: boolean;
} 