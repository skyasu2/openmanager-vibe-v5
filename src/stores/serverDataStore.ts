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
import { calculateOptimalUpdateInterval } from '../config/serverConfig';
import type { EnhancedServerMetrics } from '../types/server';

// 사용하지 않는 인터페이스들 제거

export interface ServerDataState {
  // 데이터 상태
  servers: EnhancedServerMetrics[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // 통합 메트릭 관리자 상태
  unifiedManagerStatus: unknown;
  prometheusHubStatus: unknown;

  // 자동 갱신 관련
  autoRefreshIntervalId: NodeJS.Timeout | null;
  isAutoRefreshEnabled: boolean;

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

  // 자동 갱신 액션 (30-60초 주기)
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;

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
    updateServer?: (id: string, data: unknown) => void;
    refreshServers?: () => Promise<void>;
  };
}

export type ServerDataStore = ReturnType<typeof createServerDataStore>;

// Export hook for component usage will be handled in StoreProvider

export const createServerDataStore = (
  _initialState: Partial<ServerDataState> = {}
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
        autoRefreshIntervalId: null,
        isAutoRefreshEnabled: false,
        performance: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          lastSyncTime: null,
        },
      },
      ..._initialState,

      // 서버 데이터 가져오기 (올바른 API 엔드포인트 사용)
      fetchServers: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 최적화된 서버 데이터 가져오기 시작');

          // API 클라이언트 사용
          const { apiGet } = await import('@/lib/api-client');
          const result = await apiGet('/api/servers/all');

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
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error('❌ 최종 서버 데이터 로드 실패:', error.message);
          set({ isLoading: false, error: error.message });
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
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error(error.message);
        }
      },

      stopUnifiedSystem: async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/system/stop`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('통합 시스템 중지에 실패했습니다.');
          // 자동 갱신도 함께 중지
          get().stopAutoRefresh();
          set({ servers: [] });
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error(error.message);
        }
      },

      // 자동 갱신 시작 (30-60초 주기)
      startAutoRefresh: () => {
        const state = get();

        // 이미 자동 갱신 중이면 중복 실행 방지
        if (state.isAutoRefreshEnabled && state.autoRefreshIntervalId) {
          console.log('⚠️ 자동 갱신이 이미 실행 중입니다.');
          return;
        }

        // 동적 갱신 주기 계산 (30-35초)
        const refreshInterval = calculateOptimalUpdateInterval();
        console.log(
          `🔄 서버 자동 갱신 시작 (${refreshInterval / 1000}초 주기)`
        );

        // 즉시 한 번 실행
        get().fetchServers();

        // 주기적 갱신 설정
        const intervalId = setInterval(() => {
          console.log('🔄 서버 데이터 자동 갱신 중...');
          get().fetchServers();
        }, refreshInterval);

        set({
          autoRefreshIntervalId: intervalId,
          isAutoRefreshEnabled: true,
        });
      },

      // 자동 갱신 중지
      stopAutoRefresh: () => {
        const state = get();

        if (state.autoRefreshIntervalId) {
          clearInterval(state.autoRefreshIntervalId);
          console.log('⏹️ 서버 자동 갱신 중지됨');

          set({
            autoRefreshIntervalId: null,
            isAutoRefreshEnabled: false,
          });
        }
      },

      getSystemStatus: () => {
        const { servers, isLoading, error, lastUpdate } = get();
        return {
          totalServers: servers.length,
          healthyServers: servers.filter(s => s.status === 'healthy')
            .length,
          warningServers: servers.filter(s => s.status === 'warning')
            .length,
          criticalServers: servers.filter(s => s.status === 'critical')
            .length,
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
        return get().servers.filter(s => s.status === status);
      },

      getServersByEnvironment: (environment: string) => {
        return get().servers.filter(s => s.environment === environment);
      },
    }))
  );
};
