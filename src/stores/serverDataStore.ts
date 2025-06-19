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

// 🔄 중복 제거: common.ts의 타입들 사용
import type { ServerStatus } from '../types/common';

// ✅ 클라이언트 전용 타입 정의 (UI 표시용)
interface ClientServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ClientServer {
  id: string;
  name: string;
  status: ServerStatus;
  location: string;
  type: string;
  metrics: ClientServerMetrics;
  // 🩺 건강 점수 및 추세 (선택)
  health: {
    score: number;
    trend: number[];
  };
  // 🚨 알림 요약 (선택)
  alertsSummary: {
    total: number;
    critical: number;
    warning: number;
  };
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
const getInitialServers = (): ClientServer[] => {
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
      health: { score: 90, trend: Array(30).fill(90) },
      alertsSummary: { total: 0, critical: 0, warning: 0 },
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
      health: { score: 60, trend: Array(30).fill(60) },
      alertsSummary: { total: 2, critical: 0, warning: 2 },
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
      health: { score: 30, trend: Array(30).fill(30) },
      alertsSummary: { total: 5, critical: 3, warning: 2 },
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
      health: { score: 55, trend: Array(30).fill(55) },
      alertsSummary: { total: 1, critical: 0, warning: 1 },
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
      health: { score: 85, trend: Array(30).fill(85) },
      alertsSummary: { total: 0, critical: 0, warning: 0 },
    },
  ];
};

// ✅ API 기반 서버 데이터 가져오기
const fetchServersFromAPI = async (): Promise<ClientServer[]> => {
  try {
    const response = await fetch('/api/servers');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response structure:', {
        hasData: !!data,
        hasServers: !!data.servers,
        serversLength: data.servers?.length,
        serversType: typeof data.servers,
        hasStats: !!data.stats, // 🔧 통계 데이터 확인
      });
    }

    // 🚀 안전한 배열 처리: 배열이 아닌 경우 빈 배열로 처리
    const rawServers = data.servers;
    if (!Array.isArray(rawServers)) {
      console.warn(
        '⚠️ API에서 반환된 servers 데이터가 배열이 아닙니다:',
        typeof rawServers
      );
      return [];
    }

    // 🔧 API 통계 데이터 글로벌 저장 (다른 컴포넌트에서 사용 가능)
    if (data.stats && typeof window !== 'undefined') {
      (window as any).__serverStats = data.stats;
      console.log('📊 글로벌 서버 통계 업데이트:', data.stats);
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
      health: {
        score: Math.max(
          0,
          100 -
            (serverInfo.cpu_usage || serverInfo.cpu || 0) * 0.3 -
            (serverInfo.memory_usage || serverInfo.memory || 0) * 0.3 -
            (serverInfo.disk_usage || serverInfo.disk || 0) * 0.4
        ),
        trend: [],
      },
      alertsSummary: {
        total: serverInfo.alerts?.length || 0,
        critical: (serverInfo.alerts || []).filter(
          (a: any) => a.severity === 'critical'
        ).length,
        warning: (serverInfo.alerts || []).filter(
          (a: any) => a.severity === 'warning'
        ).length,
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
        // 기존 타이머가 있으면 정리
        const existingInterval = (get() as any)._updateInterval;
        if (existingInterval) {
          clearInterval(existingInterval);
          console.log('🔄 기존 폴링 타이머 정리됨');
        }

        // ✅ 폴링 주기 최적화: 5초 → 30초 (6배 성능 향상, 안정성 확보)
        const updateInterval = setInterval(() => {
          console.log('🔄 서버 데이터 자동 업데이트 (30초 주기)');
          get().fetchServers();
        }, 30000); // 30초마다 업데이트

        // 정리를 위해 interval ID 저장
        (get() as any)._updateInterval = updateInterval;
        console.log('✅ 실시간 업데이트 시작 (30초 주기)');
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
          healthyServers: servers.filter(s => s.status === 'healthy').length,
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
