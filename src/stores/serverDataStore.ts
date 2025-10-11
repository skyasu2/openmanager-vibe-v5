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
import { apiGet } from '@/lib/api-client';

// API 응답 타입 정의
interface MetricsCurrentApiResponse {
  success: boolean;
  timestamp: string;
  actualTimestamp: number;
  servers: EnhancedServerMetrics[];
  metadata?: {
    timeInfo?: {
      normalized: string;
      actual: number;
      cycle24h: number;
      slot10min: number;
      hour: number;
      minute: number;
      validUntil: number;
    };
    currentCycle?: {
      timeSlot: number;
      scenario: string;
      description: string;
      phase: string;
      intensity: number;
      progress: number;
      expectedResolution: Date | null;
      affectedServers: string[];
    };
  };
  message?: string;
}

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
        performance: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          lastSyncTime: null,
        },
      },
      ..._initialState,

      // 서버 데이터 가져오기 (강화된 디버깅)
      fetchServers: async () => {
        console.log('🎯 fetchServers 함수 시작 - 포트폴리오 시나리오 데이터 로드');
        
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 정적 시나리오 데이터 API 호출 시작');
          console.log('🔗 통합 메트릭 API 엔드포인트:', '/api/metrics/current');

          // API 클라이언트 사용 (강화된 디버깅과 함께)
          const result = await apiGet<MetricsCurrentApiResponse>('/api/metrics/current');

          console.log('📡 API 응답 수신 완료');
          console.log('📋 응답 타입:', typeof result);
          console.log('🔍 응답 구조:', Object.keys(result || {}));
          
          // 응답 구조 상세 분석
          if (result) {
            console.log('✨ API 응답 상세 분석:');
            console.log('  - success:', result.success);
            console.log('  - servers 존재:', !!result.servers);
            console.log('  - servers 타입:', Array.isArray(result.servers) ? 'array' : typeof result.servers);
            console.log('  - servers 길이:', result.servers?.length || 0);
            // 시나리오 정보는 AI 분석 순수성을 위해 로깅하지 않음
          }

          if (result && result.success && result.servers && Array.isArray(result.servers)) {
            console.log(
              '✅ 통합 메트릭 데이터 수신 성공:',
              result.servers.length,
              '개 서버'
            );
            console.log('🕐 데이터 타임스탬프:', new Date(result.timestamp));
            console.log('⏱️ 24시간 순환 위치:', Math.round(result.metadata?.timeInfo?.hour || 0) + '시');

            // 첫 번째 서버 데이터 샘플 로깅
            if (result.servers.length > 0) {
              const firstServer = result.servers[0]!;
              console.log('🔍 첫 번째 서버 데이터 샘플:', {
                id: firstServer.id,
                name: firstServer.name,
                status: firstServer.status,
                cpu: firstServer.cpu,
                memory: firstServer.memory,
                timeSlot: firstServer.metadata?.timeSlot,
                hasScenarios: !!(firstServer.metadata?.scenarios?.length),
              });
            }

            // 시간 컨텍스트 정보 추가
            const timeContext = result.metadata?.timeInfo;
            if (timeContext) {
              console.log('🔄 24시간 순환 정보:', {
                hour: timeContext.hour,
                slot: timeContext.slot10min,
                validUntil: new Date(timeContext.validUntil)
              });
            }

            set({
              servers: result.servers, // API 응답 구조: servers 필드 사용
              isLoading: false,
              lastUpdate: new Date(result.timestamp), // 정규화된 타임스탬프 사용
              error: null,
            });

            console.log('✅ 서버 데이터 Zustand 스토어 업데이트 완료');
            
          } else {
            console.error('❌ 통합 메트릭 API 응답 구조 문제:', {
              hasResult: !!result,
              hasSuccess: !!result?.success,
              successValue: result?.success,
              hasServers: !!result?.servers,
              serversType: typeof result?.servers,
              isServersArray: Array.isArray(result?.servers),
            });
            
            throw new Error(
              result?.message || 
              `API 응답 형식 오류: ${JSON.stringify(result).substring(0, 200)}`
            );
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error('❌ 서버 데이터 로드 최종 실패:');
          console.error('  - 오류 메시지:', error.message);
          console.error('  - 오류 스택:', error.stack);
          console.error('  - 오류 타입:', error.constructor.name);
          
          set({ 
            isLoading: false, 
            error: error.message,
            servers: [] // 실패 시 빈 배열로 초기화
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

        // 즉시 한 번 실행 - Vercel Edge Runtime 호환성 확보
        const currentState = get();
        currentState.fetchServers();

        // 주기적 갱신 설정 - Vercel Edge Runtime 호환성 확보
        const intervalId = setInterval(async () => {
          console.log('🔄 서버 데이터 자동 갱신 중...');
          const currentState = get();
          await currentState.fetchServers();
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
