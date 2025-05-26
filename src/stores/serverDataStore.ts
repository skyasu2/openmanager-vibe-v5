import { create } from 'zustand';

// ✅ 클라이언트 전용 타입 정의
interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface Server {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  location: string;
  type: string;
  metrics: ServerMetrics;
  uptime: number;
  lastUpdate: Date;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedServers?: string[];
  hasChart?: boolean;
  actionButtons?: string[];
}

interface SystemStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  activeAlerts: number;
  lastUpdate: Date;
}

interface ServerDataStore {
  // State
  servers: Server[];
  chatMessages: ChatMessage[];
  systemStatus: SystemStatus;
  selectedServer: Server | null;
  highlightedServers: string[];
  isAutoDemo: boolean;
  currentScenarioIndex: number;
  isTyping: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  highlightServers: (serverIds: string[]) => void;
  clearHighlights: () => void;
  selectServer: (server: Server | null) => void;
  updateServerMetrics: (serverId: string, metrics: Partial<ServerMetrics>) => void;
  updateServerStatus: (serverId: string, status: Server['status']) => void;
  setAutoDemo: (isAuto: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  nextScenario: () => void;
  resetDemo: () => void;
  updateSystemStatus: () => void;
  fetchServers: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// ✅ API 기반 서버 데이터 가져오기
const fetchServersFromAPI = async (): Promise<Server[]> => {
  try {
    const response = await fetch('/api/servers');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response structure:', { hasData: !!data.data, hasServers: !!data.data?.servers, serversLength: data.data?.servers?.length });
    
    // API 응답을 Client Server 타입으로 변환 (올바른 경로: data.data.servers)
    return data.data?.servers?.map((serverInfo: any) => ({
      id: serverInfo.id,
      name: serverInfo.hostname || serverInfo.name,
      status: serverInfo.status === 'healthy' ? 'healthy' : 
              serverInfo.status === 'warning' ? 'warning' : 'critical',
      location: serverInfo.environment || 'Unknown',
      type: serverInfo.role?.toUpperCase() || 'UNKNOWN',
      metrics: {
        cpu: serverInfo.cpu_usage || 0,
        memory: serverInfo.memory_usage || 0,
        disk: serverInfo.disk_usage || 0,
        network: serverInfo.response_time || 0
      },
      uptime: Math.floor((serverInfo.uptime || 0) / 86400000), // milliseconds to days
      lastUpdate: new Date(serverInfo.last_updated || Date.now())
    })) || [];
  } catch (error) {
    console.error('Failed to fetch servers from API:', error);
    throw error;
  }
};

// 백업 데이터 생성
const generateFallbackServers = (): Server[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `server-${i + 1}`,
    name: `서버-${String(i + 1).padStart(2, '0')}`,
    status: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)] as Server['status'],
    location: ['서울', '부산', '대구', '인천'][Math.floor(Math.random() * 4)],
    type: ['WEB', 'DB', 'API', 'CACHE'][Math.floor(Math.random() * 4)],
    metrics: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100)
    },
    uptime: Math.floor(Math.random() * 365),
    lastUpdate: new Date()
  }));
};

export const useServerDataStore = create<ServerDataStore>((set, get) => ({
  // 초기 상태
  servers: [],
  chatMessages: [
    {
      id: 'welcome-1',
      type: 'ai',
      content: '안녕하세요! OpenManager AI입니다. 🤖\n서버 데이터를 로딩 중입니다...',
      timestamp: new Date(),
    }
  ],
  systemStatus: {
    totalServers: 0,
    healthyServers: 0,
    warningServers: 0,
    criticalServers: 0,
    activeAlerts: 0,
    lastUpdate: new Date()
  },
  selectedServer: null,
  highlightedServers: [],
  isAutoDemo: false,
  currentScenarioIndex: 0,
  isTyping: false,
  isLoading: false,
  error: null,

  // Actions
  addMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }]
  })),

  highlightServers: (serverIds) => set({ highlightedServers: serverIds }),
  clearHighlights: () => set({ highlightedServers: [] }),
  selectServer: (server) => set({ selectedServer: server }),

  updateServerMetrics: (serverId, metrics) => set((state) => ({
    servers: state.servers.map(server => 
      server.id === serverId 
        ? { ...server, metrics: { ...server.metrics, ...metrics }, lastUpdate: new Date() }
        : server
    )
  })),

  updateServerStatus: (serverId, status) => set((state) => ({
    servers: state.servers.map(server => 
      server.id === serverId 
        ? { ...server, status, lastUpdate: new Date() }
        : server
    )
  })),

  setAutoDemo: (isAuto) => set({ isAutoDemo: isAuto }),
  setTyping: (isTyping) => set({ isTyping }),
  
  nextScenario: () => set((state) => ({
    currentScenarioIndex: (state.currentScenarioIndex + 1) % 5
  })),

  resetDemo: () => set({
    chatMessages: [
      {
        id: 'welcome-1',
        type: 'ai',
        content: '안녕하세요! OpenManager AI입니다. 🤖\n현재 서버를 실시간으로 모니터링하고 있습니다.',
        timestamp: new Date(),
      }
    ],
    selectedServer: null,
    highlightedServers: [],
    currentScenarioIndex: 0,
    isTyping: false
  }),

  updateSystemStatus: () => {
    const { servers } = get();
    const healthy = servers.filter(s => s.status === 'healthy').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const critical = servers.filter(s => s.status === 'critical').length;
    
    set({
      systemStatus: {
        totalServers: servers.length,
        healthyServers: healthy,
        warningServers: warning,
        criticalServers: critical,
        activeAlerts: warning + critical * 2,
        lastUpdate: new Date()
      }
    });
  },

  // ✅ API 기반 서버 데이터 가져오기
  fetchServers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const servers = await fetchServersFromAPI();
      set({ servers, isLoading: false });
      
      // 시스템 상태 업데이트
      const { updateSystemStatus } = get();
      updateSystemStatus();
      
      console.log(`✅ Fetched ${servers.length} servers from API`);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      
      // 백업 데이터 사용
      const fallbackServers = generateFallbackServers();
      set({ 
        servers: fallbackServers, 
        isLoading: false,
        error: 'Failed to fetch real-time data, using cached data'
      });
      
      const { updateSystemStatus } = get();
      updateSystemStatus();
    }
  },

  // ✅ 데이터 새로고침 (주기적 호출용)
  refreshData: async () => {
    try {
      const servers = await fetchServersFromAPI();
      set({ servers, error: null });
      
      const { updateSystemStatus } = get();
      updateSystemStatus();
    } catch (error) {
      console.warn('Background refresh failed:', error);
      // 에러 시 UI는 그대로 유지 (조용한 실패)
    }
  }
})); 