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

// 🎯 Single Source of Truth: UnifiedServerDataSource 사용

import { mapServerToEnhanced } from '../utils/serverUtils';

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

  // 🚀 API 요청 중복 방지 플래그
  isFetching: boolean;

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
  getSystemStatus: () => unknown;

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
        isFetching: false, // 🚀 API 요청 중복 방지 플래그 초기값
        performance: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          lastSyncTime: null,
        },
      },
      ..._initialState,

      // 서버 데이터 가져오기 (API 사용)
      fetchServers: async () => {
        // 🚀 API 요청 중복 방지: 이미 요청 중이면 스킵
        const state = get();
        if (state.isFetching) {
          console.log('⏭️ fetchServers 스킵 - 이미 요청 중');
          return;
        }

        console.log('🎯 fetchServers 함수 시작 - API 사용');

        set({ isLoading: true, error: null, isFetching: true });

        try {
          console.log('🚀 /api/servers-unified 에서 데이터 로드 시작');

          // 🎯 Client-side Fetching via Unified API (인증 불필요, GuestMode 지원)
          const response = await fetch('/api/servers-unified?limit=50');

          if (!response.ok) {
            throw new Error(
              `API Error: ${response.status} ${response.statusText}`
            );
          }

          const result = await response.json();

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to fetch data');
          }

          // servers-unified는 data 배열에 직접 서버 반환
          const rawServers = result.data;

          console.log('📡 API 데이터 수신 완료');
          console.log(`✅ 성공적으로 로드된 서버: ${rawServers.length}개`);

          // Server[] → EnhancedServerMetrics[] 변환
          const enhancedServers = rawServers.map(mapServerToEnhanced);

          if (enhancedServers.length > 0) {
            console.log(
              '✅ 서버 데이터 로드 성공:',
              enhancedServers.length,
              '개 서버'
            );

            // 첫 번째 서버 데이터 샘플 로깅
            const firstServer = enhancedServers[0];
            if (firstServer) {
              console.log('🔍 첫 번째 서버 데이터 샘플:', {
                id: firstServer.id,
                status: firstServer.status,
                cpu: firstServer.cpu,
                memory: firstServer.memory,
              });
            }

            set({
              servers: enhancedServers,
              isLoading: false,
              lastUpdate: new Date(),
              error: null,
              isFetching: false, // 🚀 요청 완료 플래그 리셋
            });

            console.log('✅ 서버 데이터 Zustand 스토어 업데이트 완료');
          } else {
            throw new Error('로드된 서버 데이터가 없습니다.');
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error('❌ 서버 데이터 로드 최종 실패:');
          console.error('  - 오류 메시지:', error.message);

          set({
            isLoading: false,
            error: error.message,
            servers: [],
            isFetching: false, // 🚀 에러 시에도 플래그 리셋
          });
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

      stopUnifiedSystem: () => {
        void (async () => {
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
            const response = await fetch(`${appUrl}/api/system/stop`, {
              method: 'POST',
            });
            if (!response.ok)
              throw new Error('통합 시스템 중지에 실패했습니다.');
            // 자동 갱신도 함께 중지
            get().stopAutoRefresh();
            set({ servers: [] });
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            console.error(error.message);
          }
        })();
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

        // 즉시 한 번 실행 - Vercel Edge Runtime 호환성 확보
        const currentState = get();
        void currentState.fetchServers();

        // 주기적 갱신 설정 - Vercel Edge Runtime 호환성 확보
        const intervalId = setInterval(() => {
          void (async () => {
            console.log('🔄 서버 데이터 자동 갱신 중...');
            const currentState = get();
            await currentState.fetchServers();
          })();
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
          healthyServers: servers.filter((s) => s.status === 'online').length, // 🔧 수정: 'healthy' → 'online' (타입 통합)
          warningServers: servers.filter((s) => s.status === 'warning').length,
          criticalServers: servers.filter((s) => s.status === 'critical')
            .length,
          isLoading,
          error,
          lastUpdate,
        };
      },

      // 개별 서버 조회 및 필터링
      getServerById: (id: string) => {
        return get().servers.find((s) => s.id === id);
      },

      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter((s) => s.status === status);
      },

      getServersByEnvironment: (environment: string) => {
        return get().servers.filter((s) => s.environment === environment);
      },
    }))
  );
};
