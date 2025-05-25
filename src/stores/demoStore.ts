import { create } from 'zustand';

// 타입 정의 (ServerDataCollector와 호환)
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

interface DemoStore {
  // State
  servers: Server[];
  chatMessages: ChatMessage[];
  systemStatus: SystemStatus;
  selectedServer: Server | null;
  highlightedServers: string[];
  isAutoDemo: boolean;
  currentScenarioIndex: number;
  isTyping: boolean;

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
  syncWithCollector: () => void;
}

// 서버 데이터 가져오기 (API 기반)
const getServersFromAPI = async (): Promise<Server[]> => {
  try {
    // 클라이언트 사이드에서는 API 호출로 데이터 가져오기
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/servers');
      if (response.ok) {
        const result = await response.json();
        
        // API 응답 구조 확인
        console.log('📡 API Response:', result);
        
        if (result.success && result.data) {
          // API 데이터를 Demo Store 형식으로 변환
          const servers: Server[] = result.data.map((serverData: any) => ({
            id: serverData.id,
            name: serverData.hostname || serverData.id,
            status: serverData.status === 'online' ? 'healthy' : 
                   serverData.status === 'warning' ? 'warning' : 'critical',
            location: serverData.location || 'Unknown',
            type: serverData.instanceType || 'Server',
            metrics: {
              cpu: serverData.metrics?.cpu || Math.floor(Math.random() * 60) + 10,
              memory: serverData.metrics?.memory || Math.floor(Math.random() * 50) + 30,
              disk: serverData.metrics?.disk || Math.floor(Math.random() * 40) + 40,
              network: serverData.metrics?.network || Math.floor(Math.random() * 30) + 10
            },
            uptime: Math.floor(Math.random() * 365) + 1,
            lastUpdate: new Date(serverData.lastUpdate || Date.now())
          }));
          
          console.log(`✅ Converted ${servers.length} servers from API`);
          return servers;
        }
      } else {
        console.warn('❌ API Response not OK:', response.status, response.statusText);
      }
    }
    
    console.log('🔄 Using fallback server data');
    return generateFallbackServers();
  } catch (error) {
    console.warn('❌ Failed to get servers from API, using fallback data:', error);
    return generateFallbackServers();
  }
};

// 백업용 서버 데이터 생성 (데이터 수집기 실패 시)
const generateFallbackServers = (): Server[] => {
  const serverTypes = ['API', 'Database', 'Web', 'Cache'];
  const locations = ['US-East', 'US-West', 'EU-Central', 'AP-Tokyo', 'AP-Seoul'];
  const servers: Server[] = [];

  for (let i = 1; i <= 19; i++) {
    const serverNum = String(i).padStart(3, '0');
    const type = serverTypes[Math.floor(Math.random() * serverTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // 일부 서버는 의도적으로 문제 상태로 설정
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let cpu = Math.floor(Math.random() * 60) + 10; // 10-70%
    let memory = Math.floor(Math.random() * 50) + 30; // 30-80%
    
    if (i === 1) { // 첫 번째 서버는 높은 CPU 사용률
      status = 'critical';
      cpu = 89;
      memory = 76;
    } else if (i <= 4) { // 몇 개는 경고 상태
      status = 'warning';
      cpu = Math.floor(Math.random() * 20) + 70; // 70-90%
    }

    servers.push({
      id: `fallback-server-${serverNum}`,
      name: `${type.toLowerCase()}-${location.toLowerCase().replace('-', '')}-${serverNum}`,
      status,
      location,
      type,
      metrics: {
        cpu,
        memory,
        disk: Math.floor(Math.random() * 40) + 40, // 40-80%
        network: Math.floor(Math.random() * 30) + 10 // 10-40%
      },
      uptime: Math.floor(Math.random() * 365) + 1,
      lastUpdate: new Date()
    });
  }

  return servers;
};

export const useDemoStore = create<DemoStore>((set, get) => ({
  // Initial state
  servers: generateFallbackServers(), // 초기에는 fallback 데이터 사용
  chatMessages: [
    {
      id: 'welcome-1',
      type: 'ai',
      content: '안녕하세요! OpenManager AI입니다. 🤖\n현재 19개 서버를 실시간으로 모니터링하고 있습니다.',
      timestamp: new Date(),
    }
  ],
  systemStatus: {
    totalServers: 19,
    healthyServers: 15,
    warningServers: 3,
    criticalServers: 1,
    activeAlerts: 4,
    lastUpdate: new Date()
  },
  selectedServer: null,
  highlightedServers: [],
  isAutoDemo: false,
  currentScenarioIndex: 0,
  isTyping: false,

  // Actions
  addMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: `msg-${Date.now()}`,
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
    currentScenarioIndex: state.currentScenarioIndex + 1
  })),

  resetDemo: () => set({
    chatMessages: [
      {
        id: 'welcome-1',
        type: 'ai',
        content: '안녕하세요! OpenManager AI입니다. 🤖\n현재 19개 서버를 실시간으로 모니터링하고 있습니다.',
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

  // 실시간 서버 데이터 동기화
  syncWithCollector: async () => {
    try {
      const updatedServers = await getServersFromAPI();
      set({ servers: updatedServers });
      
      // 시스템 상태도 업데이트
      const { updateSystemStatus } = get();
      updateSystemStatus();
      
      console.log(`🔄 Synced ${updatedServers.length} servers from API`);
    } catch (error) {
      console.error('Failed to sync with API:', error);
    }
  }
})); 