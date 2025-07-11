/**
 * 🎯 서버 데이터 스토어 - 서버 모니터링 전처리기 연동
 *
 * 새로운 전처리기 기반 단일 데이터 소스 보장:
 * - ServerMonitoringProcessor에서 데이터 가져오기
 * - 서버 모니터링 ↔ AI 에이전트 분리된 전처리기 사용
 * - 중복 API 호출 제거
 * - 캐시 기반 효율적 업데이트
 */

import { createStore } from 'zustand';
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

export interface ServerDataState {
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

  // 추가 액션들
  actions?: {
    updateServer?: (id: string, data: any) => void;
    refreshServers?: () => Promise<void>;
  };
}

export type ServerDataStore = ReturnType<typeof createServerDataStore>;

// Export hook for component usage will be handled in StoreProvider

export const createServerDataStore = (
  initialState: Partial<ServerDataState> = {}
) => {
  return createStore<ServerDataState>()(
    devtools((set, get) => ({
      ...{
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
      },
      ...initialState,

      // 서버 데이터 가져오기 (올바른 API 엔드포인트 사용)
      fetchServers: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 최적화된 서버 데이터 가져오기 시작');
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/servers/all`);
          const result = await response.json();

          if (result.success && result.data) {
            console.log(
              '✅ 최적화된 서버 데이터 수신:',
              result.data.length,
              '개'
            );

            set({
              servers: result.data,
              isLoading: false,
              lastUpdate: new Date(),
              error: null,
            });
          } else {
            throw new Error(
              result.message || '서버에서 데이터를 가져오지 못했습니다'
            );
          }
        } catch (e: any) {
          console.error('❌ 최종 서버 데이터 로드 실패:', e.message);
          set({ isLoading: false, error: e.message });
        }
      },

      // 데이터 새로고침
      refreshData: async () => {
        console.log('🔄 데이터 새로고침 중...');
        await get().fetchServers();
      },

      // 실시간 업데이트 시작 (구현 필요)
      startRealTimeUpdates: () => {
        console.log('🔴 실시간 업데이트 시작 (미구현)');
        // 여기에 WebSocket 또는 SSE 로직 추가
      },

      stopRealTimeUpdates: () => {
        console.log('⚫ 실시간 업데이트 중지 (미구현)');
      },

      // 통합 시스템 제어
      startUnifiedSystem: async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/system/start`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('통합 시스템 시작에 실패했습니다.');
          await get().refreshData();
        } catch (e: any) {
          console.error(e.message);
        }
      },

      stopUnifiedSystem: async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/system/stop`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('통합 시스템 중지에 실패했습니다.');
          set({ servers: [] });
        } catch (e: any) {
          console.error(e.message);
        }
      },

      getSystemStatus: () => {
        const { servers, isLoading, error, lastUpdate } = get();
        return {
          totalServers: servers.length,
          healthyServers: servers.filter((s: any) => s.status === 'healthy').length,
          warningServers: servers.filter((s: any) => s.status === 'warning').length,
          criticalServers: servers.filter((s: any) => s.status === 'critical').length,
          isLoading,
          error,
          lastUpdate,
        };
      },

      // 개별 서버 조회 및 필터링
      getServerById: (id: string) => {
        return get().servers.find(s => s.id === id);
      },

      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter((s: any) => s.status === status);
      },

      getServersByEnvironment: (environment: string) => {
        return get().servers.filter((s: any) => s.environment === environment);
      },
    }))
  );
};
