/**
 * 🎯 서버 데이터 스토어 - 서버 모니터링 전처리기 연동
 *
 * 새로운 전처리기 기반 단일 데이터 소스 보장:
 * - ServerMonitoringProcessor에서 데이터 가져오기
 * - 서버 모니터링 ↔ AI 에이전트 분리된 전처리기 사용
 * - 중복 API 호출 제거
 * - 캐시 기반 효율적 업데이트
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ServerStatus } from '../types/common';
import type { EnhancedServerMetrics } from '../types/server';

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
  return [
    {
      id: 'server-1',
      name: 'Web Server 01',
      status: 'healthy',
      location: 'Seoul',
      type: 'web',
      metrics: { cpu: 45, memory: 60, disk: 30, network: 80 },
      uptime: 99.9,
      lastUpdate: new Date(),
      health: { score: 85, trend: Array(30).fill(85) },
      alertsSummary: { total: 0, critical: 0, warning: 0 },
    },
  ];
};

// ✅ 서버 모니터링 전처리기 기반 데이터 가져오기
const fetchServersFromProcessor = async (): Promise<
  EnhancedServerMetrics[]
> => {
  try {
    // 🎯 대시보드와 동일한 API 엔드포인트 사용 (일관성 보장)
    console.log('🎯 대시보드 API 호출로 데이터 일관성 보장...');

    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    console.log(
      '✅ 대시보드 API 응답:',
      result.data?.servers?.length || 0,
      '개 서버'
    );

    if (!result.data || !result.data.servers) {
      throw new Error('API 응답 데이터가 유효하지 않습니다');
    }

    // 🎯 대시보드 API 서버 데이터 → EnhancedServerMetrics[] 변환
    const servers = result.data.servers;
    return servers.map(
      (server: any): EnhancedServerMetrics => ({
        id: server.id,
        name: server.hostname || server.id,
        hostname: server.hostname || server.id,
        environment: server.environment as any,
        role: server.role as any,
        status: normalizeStatus(server.status),
        cpu_usage: server.cpu_usage || server.node_cpu_usage_percent || 0,
        memory_usage:
          server.memory_usage || server.node_memory_usage_percent || 0,
        disk_usage: server.disk_usage || server.node_disk_usage_percent || 0,
        network_in: server.node_network_receive_rate_mbps || 0,
        network_out: server.node_network_transmit_rate_mbps || 0,
        response_time:
          server.response_time ||
          server.http_request_duration_seconds * 1000 ||
          0,
        uptime: server.uptime || server.node_uptime_seconds / 3600 || 0,
        last_updated: server.last_updated || new Date().toISOString(),
        alerts: [], // 대시보드 API에서는 별도 처리

        // 🎯 EnhancedServerMetrics 확장 필드들
        network_usage:
          (server.node_network_receive_rate_mbps || 0) +
          (server.node_network_transmit_rate_mbps || 0),
        timestamp: server.last_updated || new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('❌ 대시보드 API 서버 데이터 가져오기 실패:', error);
    throw error;
  }
};

// 🔧 상태 정규화 함수
const normalizeStatus = (status: string): ServerStatus => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'online':
      return 'healthy';
    case 'warning':
      return 'warning';
    case 'error':
    case 'offline':
      return 'critical';
    case 'healthy':
      return 'healthy';
    case 'critical':
      return 'critical';
    case 'maintenance':
      return 'maintenance';
    default:
      return 'healthy';
  }
};

// 폴백 함수 정의
const fetchServersFromAPI = async () => {
  const response = await fetch('/api/servers/all');
  if (!response.ok) {
    throw new Error(`서버 데이터 조회 실패: ${response.status}`);
  }
  return response.json();
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

      // 서버 데이터 가져오기 (올바른 API 엔드포인트 사용)
      fetchServers: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 최적화된 서버 데이터 가져오기 시작');

          const response = await fetch('/api/servers/all');
          const result = await response.json();

          if (result.success && result.data) {
            console.log(
              '✅ 최적화된 서버 데이터 수신:',
              result.data.length,
              '개'
            );

            // 🎯 이미 최적화된 변환이 완료된 데이터이므로 추가 변환 불필요
            set({
              servers: result.data, // 직접 사용
              isLoading: false,
              lastUpdate: new Date(),
              error: null,
            });
          } else {
            throw new Error(result.error || 'Failed to fetch servers');
          }
        } catch (error) {
          console.error('❌ 서버 데이터 가져오기 실패:', error);
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      // 데이터 새로고침
      refreshData: async () => {
        await get().fetchServers();
      },

      // 실시간 업데이트 시작 - 통합 스토어로 대체됨
      startRealTimeUpdates: () => {
        console.log('⚠️ 개별 폴링이 통합 실시간 스토어로 대체되었습니다. globalRealtimeStore를 사용하세요.');

        // 기존 타이머가 있으면 정리
        const existingInterval = (get() as any)._updateInterval;
        if (existingInterval) {
          clearInterval(existingInterval);
          console.log('🔄 기존 폴링 타이머 정리됨');
          delete (get() as any)._updateInterval;
        }
      },

      // 실시간 업데이트 중지 - 통합 스토어로 대체됨
      stopRealTimeUpdates: () => {
        console.log('⚠️ 개별 폴링이 통합 실시간 스토어로 대체되었습니다.');

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
          criticalServers: servers.filter(
            s =>
              s.status === 'critical' ||
              s.status === 'offline' ||
              s.status === 'maintenance'
          ).length,
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
        return get().servers.filter(server => {
          // 상태 매핑 처리
          const serverStatus = server.status;
          switch (status) {
            case 'healthy':
              return serverStatus === 'healthy';
            case 'warning':
              return serverStatus === 'warning';
            case 'critical':
              return (
                serverStatus === 'critical' ||
                serverStatus === 'offline' ||
                serverStatus === 'maintenance'
              );
            default:
              return false;
          }
        });
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
