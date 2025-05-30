/**
 * 🎯 서버 데이터 스토어 - 통합 메트릭 관리자 연동
 * 
 * Prometheus 기반 단일 데이터 소스 보장:
 * - UnifiedMetricsManager에서 데이터 가져오기
 * - 서버 모니터링 ↔ AI 에이전트 동일한 데이터 사용
 * - 중복 API 호출 제거
 * - TimerManager 기반 효율적 업데이트
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { unifiedMetricsManager } from '../services/UnifiedMetricsManager';
import { timerManager } from '../utils/TimerManager';
import type { EnhancedServerMetrics } from '../services/simulationEngine';

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

interface ServerDataState {
  // 데이터 상태
  servers: EnhancedServerMetrics[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // 통합 메트릭 관리자 상태
  unifiedManagerStatus: any;
  prometheusHubStatus: any;
  
  // 성능 메트릭
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    cacheHitRate: number;
    lastSyncTime: Date | null;
  };

  // 액션들
  fetchServers: () => Promise<void>;
  refreshData: () => Promise<void>;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  
  // 통합 시스템 제어
  startUnifiedSystem: () => Promise<void>;
  stopUnifiedSystem: () => void;
  getSystemStatus: () => any;
  
  // 개별 서버 조회
  getServerById: (id: string) => EnhancedServerMetrics | undefined;
  getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => EnhancedServerMetrics[];
  getServersByEnvironment: (environment: string) => EnhancedServerMetrics[];
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

export const useServerDataStore = create<ServerDataState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      servers: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
      unifiedManagerStatus: null,
      prometheusHubStatus: null,
      performance: {
        totalRequests: 0,
        avgResponseTime: 0,
        cacheHitRate: 95,
        lastSyncTime: null
      },

      /**
       * 📊 서버 데이터 가져오기 (통합 메트릭 관리자에서)
       */
      fetchServers: async () => {
        const startTime = Date.now();
        
        set({ isLoading: true, error: null });
        
        try {
          // 통합 메트릭 관리자가 실행되지 않았다면 시작
          const status = unifiedMetricsManager.getStatus();
          if (!status.isRunning) {
            console.log('📊 통합 메트릭 관리자 시작 중...');
            await unifiedMetricsManager.start();
          }
          
          // 서버 데이터 가져오기
          const servers = unifiedMetricsManager.getServers();
          const responseTime = Date.now() - startTime;
          
          set(state => ({
            servers,
            isLoading: false,
            lastUpdate: new Date(),
            unifiedManagerStatus: unifiedMetricsManager.getStatus(),
            performance: {
              ...state.performance,
              totalRequests: state.performance.totalRequests + 1,
              avgResponseTime: (state.performance.avgResponseTime + responseTime) / 2,
              lastSyncTime: new Date()
            }
          }));
          
          console.log(`📊 서버 데이터 로드 완료: ${servers.length}개 서버, ${responseTime}ms`);
          
        } catch (error) {
          console.error('❌ 서버 데이터 로드 실패:', error);
          
          set({
            servers: [],
            isLoading: false,
            error: error instanceof Error ? error.message : '서버 데이터 로드 실패',
            lastUpdate: new Date()
          });
        }
      },

      /**
       * 🔄 데이터 새로고침
       */
      refreshData: async () => {
        await get().fetchServers();
      },

      /**
       * ⏰ 실시간 업데이트 시작
       */
      startRealTimeUpdates: () => {
        console.log('⏰ 실시간 서버 데이터 업데이트 시작');
        
        // TimerManager를 사용한 효율적 업데이트
        timerManager.register({
          id: 'server-data-store-sync',
          callback: async () => {
            const startTime = Date.now();
            
            try {
              // 통합 메트릭 관리자에서 최신 데이터 가져오기
              const servers = unifiedMetricsManager.getServers();
              const responseTime = Date.now() - startTime;
              
              set(state => ({
                servers,
                lastUpdate: new Date(),
                unifiedManagerStatus: unifiedMetricsManager.getStatus(),
                performance: {
                  ...state.performance,
                  totalRequests: state.performance.totalRequests + 1,
                  avgResponseTime: (state.performance.avgResponseTime + responseTime) / 2,
                  lastSyncTime: new Date()
                }
              }));
              
              // 성능 모니터링 (30초마다)
              const currentState = get();
              if (currentState.performance.totalRequests % 6 === 0) {
                console.log('📈 서버 데이터 스토어 성능:', {
                  servers_count: servers.length,
                  total_requests: currentState.performance.totalRequests,
                  avg_response_time: Math.round(currentState.performance.avgResponseTime) + 'ms',
                  cache_hit_rate: currentState.performance.cacheHitRate + '%',
                  unified_manager_running: currentState.unifiedManagerStatus?.isRunning
                });
              }
              
            } catch (error) {
              console.error('❌ 실시간 데이터 동기화 실패:', error);
              
              set({
                error: '실시간 데이터 동기화 실패',
                lastUpdate: new Date()
              });
            }
          },
          interval: 5000, // 5초마다 (UI 업데이트용)
          priority: 'medium'
        });
      },

      /**
       * 🛑 실시간 업데이트 중지
       */
      stopRealTimeUpdates: () => {
        console.log('🛑 실시간 서버 데이터 업데이트 중지');
        timerManager.unregister('server-data-store-sync');
      },

      /**
       * 🚀 통합 시스템 시작
       */
      startUnifiedSystem: async () => {
        console.log('🚀 통합 메트릭 시스템 시작...');
        
        set({ isLoading: true, error: null });
        
        try {
          // 통합 메트릭 관리자 시작
          await unifiedMetricsManager.start();
          
          // 초기 데이터 로드
          await get().fetchServers();
          
          // 실시간 업데이트 시작
          get().startRealTimeUpdates();
          
          set({
            isLoading: false,
            unifiedManagerStatus: unifiedMetricsManager.getStatus()
          });
          
          console.log('✅ 통합 메트릭 시스템 시작 완료');
          
        } catch (error) {
          console.error('❌ 통합 메트릭 시스템 시작 실패:', error);
          
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '통합 시스템 시작 실패'
          });
        }
      },

      /**
       * 🛑 통합 시스템 중지
       */
      stopUnifiedSystem: () => {
        console.log('🛑 통합 메트릭 시스템 중지...');
        
        // 실시간 업데이트 중지
        get().stopRealTimeUpdates();
        
        // 통합 메트릭 관리자 중지
        unifiedMetricsManager.stop();
        
        set({
          unifiedManagerStatus: unifiedMetricsManager.getStatus(),
          servers: [],
          error: null
        });
        
        console.log('✅ 통합 메트릭 시스템 중지 완료');
      },

      /**
       * 📊 시스템 상태 조회
       */
      getSystemStatus: () => {
        const state = get();
        return {
          store_status: {
            servers_count: state.servers.length,
            is_loading: state.isLoading,
            last_update: state.lastUpdate,
            error: state.error,
            performance: state.performance
          },
          unified_manager: state.unifiedManagerStatus,
          prometheus_hub: state.prometheusHubStatus
        };
      },

      /**
       * 🔍 개별 서버 조회
       */
      getServerById: (id: string) => {
        return get().servers.find(server => server.id === id);
      },

      /**
       * 📋 상태별 서버 조회
       */
      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter(server => server.status === status);
      },

      /**
       * 🌍 환경별 서버 조회
       */
      getServersByEnvironment: (environment: string) => {
        return get().servers.filter(server => server.environment === environment);
      }
    }),
    {
      name: 'server-data-store',
      version: 2, // 버전 업그레이드 (기존 캐시 무효화)
    }
  )
);

// 🚀 자동 시작 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 페이지 로드 시 통합 시스템 자동 시작
  setTimeout(() => {
    console.log('🚀 개발 환경 - 통합 메트릭 시스템 자동 시작');
    useServerDataStore.getState().startUnifiedSystem();
  }, 1000);
  
  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    useServerDataStore.getState().stopUnifiedSystem();
  });
}

// 🎯 내보내기: 기존 코드 호환성 유지
export const serverDataStore = useServerDataStore; 