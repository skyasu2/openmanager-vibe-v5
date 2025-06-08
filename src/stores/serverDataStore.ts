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
import type { EnhancedServerMetrics } from '../types/server';

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
  getServersByStatus: (
    status: 'healthy' | 'warning' | 'critical'
  ) => EnhancedServerMetrics[];
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
      lastUpdate: new Date(),
    },
    {
      id: 'api-eu-045',
      name: 'api-eu-045',
      status: 'warning',
      location: 'EU West',
      type: 'API',
      metrics: { cpu: 48, memory: 29.2, disk: 15.6, network: 25 },
      uptime: 8,
      lastUpdate: new Date(),
    },
    {
      id: 'api-jp-040',
      name: 'api-jp-040',
      status: 'critical',
      location: 'Asia Pacific',
      type: 'API',
      metrics: { cpu: 19, memory: 53.2, disk: 29.6, network: 45 },
      uptime: 3,
      lastUpdate: new Date(),
    },
    {
      id: 'api-sg-042',
      name: 'api-sg-042',
      status: 'warning',
      location: 'Singapore',
      type: 'API',
      metrics: { cpu: 37, memory: 41.2, disk: 19.6, network: 18 },
      uptime: 8,
      lastUpdate: new Date(),
    },
    {
      id: 'db-us-001',
      name: 'db-us-001',
      status: 'healthy',
      location: 'US East',
      type: 'DATABASE',
      metrics: { cpu: 23, memory: 45.8, disk: 67.2, network: 8 },
      uptime: 22,
      lastUpdate: new Date(),
    },
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
        serversType: typeof data.data?.servers,
      });
    }

    // 🚀 안전한 배열 처리: 배열이 아닌 경우 빈 배열로 처리
    const rawServers = data.data?.servers;
    if (!Array.isArray(rawServers)) {
      console.warn(
        '⚠️ API에서 반환된 servers 데이터가 배열이 아닙니다:',
        typeof rawServers
      );
      return [];
    }

    // API 응답을 Client Server 타입으로 변환
    return rawServers.map((serverInfo: any) => ({
      id: serverInfo.id,
      name: serverInfo.hostname || serverInfo.name,
      status:
        serverInfo.status === 'healthy'
          ? 'healthy'
          : serverInfo.status === 'warning'
            ? 'warning'
            : 'critical',
      location: serverInfo.environment || 'Unknown',
      type: serverInfo.role?.toUpperCase() || 'UNKNOWN',
      metrics: {
        cpu: serverInfo.cpu_usage || serverInfo.cpu || 0,
        memory: serverInfo.memory_usage || serverInfo.memory || 0,
        disk: serverInfo.disk_usage || serverInfo.disk || 0,
        network: serverInfo.response_time || 0,
      },
      uptime: Math.floor((serverInfo.uptime || 0) / 86400000), // milliseconds to days
      lastUpdate: new Date(serverInfo.last_updated || Date.now()),
    }));
  } catch (error) {
    console.error('❌ API 서버 데이터 가져오기 실패:', error);
    return [];
  }
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
        cacheHitRate: 0,
        lastSyncTime: null,
      },

      // 서버 데이터 가져오기
      fetchServers: async () => {
        set({ isLoading: true, error: null });

        try {
          // 통합 메트릭 관리자에서 데이터 가져오기 시도
          const response = await fetch('/api/unified-metrics');
          if (response.ok) {
            const data = await response.json();
            set({
              servers: data.servers || [],
              lastUpdate: new Date(),
              isLoading: false,
              performance: {
                ...get().performance,
                totalRequests: get().performance.totalRequests + 1,
                lastSyncTime: new Date(),
              },
            });
          } else {
            throw new Error('통합 메트릭 API 호출 실패');
          }
        } catch (error) {
          console.warn('통합 메트릭 API 실패, 대체 API 사용:', error);

          try {
            const servers = await fetchServersFromAPI();
            set({
              servers: servers as any,
              lastUpdate: new Date(),
              isLoading: false,
              error: null,
            });
          } catch (fallbackError) {
            set({
              error: `서버 데이터 로드 실패: ${fallbackError}`,
              isLoading: false,
            });
          }
        }
      },

      // 데이터 새로고침
      refreshData: async () => {
        await get().fetchServers();
      },

      // 실시간 업데이트 시작
      startRealTimeUpdates: () => {
        // TimerManager를 통한 효율적인 업데이트
        const updateInterval = setInterval(() => {
          get().fetchServers();
        }, 5000); // 5초마다 업데이트

        // 정리를 위해 interval ID 저장
        (get() as any)._updateInterval = updateInterval;
      },

      // 실시간 업데이트 중지
      stopRealTimeUpdates: () => {
        const interval = (get() as any)._updateInterval;
        if (interval) {
          clearInterval(interval);
          delete (get() as any)._updateInterval;
        }
      },

      // 통합 시스템 시작
      startUnifiedSystem: async () => {
        try {
          const response = await fetch('/api/system/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const status = await response.json();
            set({ unifiedManagerStatus: status });

            // 시스템 시작 후 데이터 가져오기
            await get().fetchServers();
          }
        } catch (error) {
          console.error('통합 시스템 시작 실패:', error);
          set({ error: `시스템 시작 실패: ${error}` });
        }
      },

      // 통합 시스템 중지
      stopUnifiedSystem: () => {
        get().stopRealTimeUpdates();

        fetch('/api/system/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(error => {
          console.error('시스템 중지 실패:', error);
        });
      },

      // 시스템 상태 조회
      getSystemStatus: () => {
        const { servers, unifiedManagerStatus } = get();

        return {
          totalServers: servers.length,
          healthyServers: servers.filter(s => s.status === 'normal').length,
          warningServers: servers.filter(s => s.status === 'warning').length,
          criticalServers: servers.filter(s => s.status === 'critical').length,
          unifiedManagerStatus,
          lastUpdate: get().lastUpdate,
        };
      },

      // 개별 서버 조회
      getServerById: (id: string) => {
        return get().servers.find(server => server.id === id);
      },

      // 상태별 서버 조회
      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter(server => server.status === status);
      },

      // 환경별 서버 조회
      getServersByEnvironment: (environment: string) => {
        return get().servers.filter(
          server =>
            server.environment?.toLowerCase() === environment.toLowerCase()
        );
      },
    }),
    { name: 'server-data-store' }
  )
);
