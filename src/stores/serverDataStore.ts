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
  // 서버 데이터
  servers: Server[];
  chatMessages: ChatMessage[];
  systemStatus: SystemStatus;
  selectedServer: Server | null;
  highlightedServers: string[];
  
  // UI 상태
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

// ✅ 안전한 초기 서버 데이터 생성 (hydration 에러 방지)
const getInitialServers = (): Server[] => {
  // 서버 사이드에서는 빈 배열 반환
  if (typeof window === 'undefined') {
    return [];
  }
  
  // 클라이언트 사이드에서만 초기 데이터 생성
  return [
    {
      id: 'api-eu-043',
      name: 'api-eu-043',
      status: 'healthy',
      location: 'EU West',
      type: 'API',
      metrics: { cpu: 19, memory: 36.2, disk: 34.6, network: 12 },
      uptime: 15,
      lastUpdate: new Date()
    },
    {
      id: 'api-eu-045',
      name: 'api-eu-045',
      status: 'warning',
      location: 'EU West',
      type: 'API',
      metrics: { cpu: 48, memory: 29.2, disk: 15.6, network: 25 },
      uptime: 8,
      lastUpdate: new Date()
    },
    {
      id: 'api-jp-040',
      name: 'api-jp-040',
      status: 'critical',
      location: 'Asia Pacific',
      type: 'API',
      metrics: { cpu: 19, memory: 53.2, disk: 29.6, network: 45 },
      uptime: 3,
      lastUpdate: new Date()
    },
    {
      id: 'api-sg-042',
      name: 'api-sg-042',
      status: 'warning',
      location: 'Singapore',
      type: 'API',
      metrics: { cpu: 37, memory: 41.2, disk: 19.6, network: 18 },
      uptime: 8,
      lastUpdate: new Date()
    },
    {
      id: 'db-us-001',
      name: 'db-us-001',
      status: 'healthy',
      location: 'US East',
      type: 'DATABASE',
      metrics: { cpu: 23, memory: 45.8, disk: 67.2, network: 8 },
      uptime: 22,
      lastUpdate: new Date()
    }
  ];
};

// ✅ API 기반 서버 데이터 가져오기
const fetchServersFromAPI = async (): Promise<Server[]> => {
  try {
    const response = await fetch('/api/servers');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response structure:', { 
        hasData: !!data.data, 
        hasServers: !!data.data?.servers, 
        serversLength: data.data?.servers?.length,
        serversType: typeof data.data?.servers
      });
    }
    
    // 🚀 안전한 배열 처리: 배열이 아닌 경우 빈 배열로 처리
    const rawServers = data.data?.servers;
    if (!Array.isArray(rawServers)) {
      console.warn('⚠️ API에서 반환된 servers 데이터가 배열이 아닙니다:', typeof rawServers);
      return [];
    }
    
    // API 응답을 Client Server 타입으로 변환
    return rawServers.map((serverInfo: any) => ({
      id: serverInfo.id,
      name: serverInfo.hostname || serverInfo.name,
      status: serverInfo.status === 'healthy' ? 'healthy' : 
              serverInfo.status === 'warning' ? 'warning' : 'critical',
      location: serverInfo.environment || 'Unknown',
      type: serverInfo.role?.toUpperCase() || 'UNKNOWN',
      metrics: {
        cpu: serverInfo.cpu_usage || serverInfo.cpu || 0,
        memory: serverInfo.memory_usage || serverInfo.memory || 0,
        disk: serverInfo.disk_usage || serverInfo.disk || 0,
        network: serverInfo.response_time || 0
      },
      uptime: Math.floor((serverInfo.uptime || 0) / 86400000), // milliseconds to days
      lastUpdate: new Date(serverInfo.last_updated || Date.now())
    }));
  } catch (error) {
    console.error('Failed to fetch servers from API:', error);
    throw error;
  }
};

// ✅ 향상된 서버 데이터 생성 (백업용)
const generateEnhancedServers = (): Server[] => {
  const serverConfigs = [
    { id: 'api-eu-043', name: 'api-eu-043', location: 'EU West', type: 'API' },
    { id: 'api-eu-045', name: 'api-eu-045', location: 'EU West', type: 'API' },
    { id: 'api-jp-040', name: 'api-jp-040', location: 'Asia Pacific', type: 'API' },
    { id: 'api-sg-042', name: 'api-sg-042', location: 'Singapore', type: 'API' },
    { id: 'db-us-001', name: 'db-us-001', location: 'US East', type: 'DATABASE' },
    { id: 'cache-eu-001', name: 'cache-eu-001', location: 'EU Central', type: 'CACHE' },
    { id: 'web-us-002', name: 'web-us-002', location: 'US West', type: 'WEB' },
    { id: 'api-kr-001', name: 'api-kr-001', location: 'Korea', type: 'API' }
  ];

  return serverConfigs.map((config, index) => {
    const statuses: Server['status'][] = ['healthy', 'warning', 'critical'];
    const status = statuses[index % 3];
    
    return {
      id: config.id,
      name: config.name,
      status,
      location: config.location,
      type: config.type,
      metrics: {
        cpu: Math.floor(Math.random() * 80) + 10,
        memory: Math.floor(Math.random() * 70) + 20,
        disk: Math.floor(Math.random() * 60) + 30,
        network: Math.floor(Math.random() * 50) + 5
      },
      uptime: Math.floor(Math.random() * 30) + 1,
      lastUpdate: new Date()
    };
  });
};

// ✅ 안전한 초기 메시지 생성
const getInitialMessages = (): ChatMessage[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  return [
    {
      id: 'welcome-1',
      type: 'ai',
      content: '안녕하세요! OpenManager AI입니다. 🤖\n실시간 서버 모니터링을 시작합니다.',
      timestamp: new Date(),
    }
  ];
};

// ✅ 안전한 초기 시스템 상태
const getInitialSystemStatus = (): SystemStatus => {
  return {
    totalServers: 0,
    healthyServers: 0,
    warningServers: 0,
    criticalServers: 0,
    activeAlerts: 0,
    lastUpdate: new Date()
  };
};

export const useServerDataStore = create<ServerDataStore>((set, get) => ({
  // 초기 상태 - hydration 에러 방지
  servers: getInitialServers(),
  chatMessages: getInitialMessages(),
  systemStatus: getInitialSystemStatus(),
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
    chatMessages: getInitialMessages(),
    selectedServer: null,
    highlightedServers: [],
    currentScenarioIndex: 0,
    isTyping: false
  }),

  updateSystemStatus: () => {
    const { servers } = get();
    
    // 🚀 안전한 배열 처리: servers가 배열이 아닌 경우 기본값 설정
    if (!Array.isArray(servers)) {
      console.warn('⚠️ servers가 배열이 아닙니다:', typeof servers);
      set({
        systemStatus: {
          totalServers: 0,
          healthyServers: 0,
          warningServers: 0,
          criticalServers: 0,
          activeAlerts: 0,
          lastUpdate: new Date()
        }
      });
      return;
    }
    
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

  // ✅ API 기반 서버 데이터 가져오기 (안정성 강화)
  fetchServers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const servers = await fetchServersFromAPI();
      if (servers && servers.length > 0) {
        set({ servers, isLoading: false });
        console.log(`✅ Fetched ${servers.length} servers from API`);
      } else {
        throw new Error('Empty server data received');
      }
      
      // 시스템 상태 업데이트
      const { updateSystemStatus } = get();
      updateSystemStatus();
      
    } catch (error) {
      console.warn('API 호출 실패, 시뮬레이션 데이터 사용:', error);
      
      // 더 현실적인 백업 데이터 생성
      const enhancedServers = generateEnhancedServers();
      set({ 
        servers: enhancedServers, 
        isLoading: false,
        error: null // 에러 숨김 (사용자에게 불안감 주지 않음)
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