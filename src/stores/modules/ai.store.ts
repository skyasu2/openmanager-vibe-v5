import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import type { CircuitBreakerEvent } from '@/lib/ai/circuit-breaker';

/**
 * 🤖 AI Assistant Store Module
 * AI 어시스턴트 상태 관리 전용 스토어
 *
 * v2.0.0 (2025-12-17): Circuit Breaker 상태 관리 추가
 * - Circuit Breaker 이벤트 실시간 추적
 * - AI 서비스 상태 대시보드용 데이터 제공
 */

export type AIAssistantState =
  | 'disabled'
  | 'enabled'
  | 'processing'
  | 'idle'
  | 'learning';

// Circuit Breaker 상태 타입
export interface CircuitBreakerStatus {
  serviceName: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  lastFailTime: number;
  resetTimeRemaining?: number;
}

// AI 관리 대시보드 상태
export interface AIManagementState {
  // Circuit Breaker 상태
  circuitBreakers: Record<string, CircuitBreakerStatus>;
  recentEvents: CircuitBreakerEvent[];

  // 통계
  stats: {
    totalBreakers: number;
    openBreakers: number;
    totalFailures: number;
    recentFailovers: number;
    recentRateLimits: number;
  };

  // 마지막 업데이트
  lastUpdated: number | null;
}

export interface AIState {
  // 상태
  isEnabled: boolean;
  state: AIAssistantState;
  isProcessing: boolean;

  // 설정
  config: {
    autoLearn: boolean;
    responseDelay: number;
    maxConcurrentTasks: number;
    enabledFeatures: string[];
  };

  // 메트릭
  metrics: {
    totalQueries: number;
    successfulQueries: number;
    averageResponseTime: number;
    lastActivity: number | null;
  };

  // 학습 데이터
  learningData: {
    patterns: string[];
    improvements: string[];
    errorLog: string[];
  };

  // AI 관리 상태 (v2.0.0)
  management: AIManagementState;

  // 액션
  enable: () => void;
  disable: () => void;
  startProcessing: () => void;
  stopProcessing: () => void;
  updateMetrics: (
    query: string,
    responseTime: number,
    success: boolean
  ) => void;
  addPattern: (pattern: string) => void;
  addImprovement: (improvement: string) => void;
  logError: (error: string) => void;
  updateConfig: (config: Partial<AIState['config']>) => void;

  // AI 관리 액션 (v2.0.0)
  updateCircuitBreakerStatus: (
    status: Record<string, CircuitBreakerStatus>
  ) => void;
  addCircuitBreakerEvent: (event: CircuitBreakerEvent) => void;
  updateManagementStats: (stats: AIManagementState['stats']) => void;
  refreshManagementData: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 초기 상태
        isEnabled: false,
        state: 'disabled',
        isProcessing: false,

        config: {
          autoLearn: true,
          responseDelay: 1000,
          maxConcurrentTasks: 3,
          enabledFeatures: ['monitoring', 'prediction', 'optimization'],
        },

        metrics: {
          totalQueries: 0,
          successfulQueries: 0,
          averageResponseTime: 0,
          lastActivity: null,
        },

        learningData: {
          patterns: [],
          improvements: [],
          errorLog: [],
        },

        // AI 관리 상태 초기화 (v2.0.0)
        management: {
          circuitBreakers: {},
          recentEvents: [],
          stats: {
            totalBreakers: 0,
            openBreakers: 0,
            totalFailures: 0,
            recentFailovers: 0,
            recentRateLimits: 0,
          },
          lastUpdated: null,
        },

        // AI 활성화
        enable: () => {
          try {
            set({
              isEnabled: true,
              state: 'enabled',
            });

            console.log('🤖 [AI] AI 어시스턴트 활성화');

            // AI 활성화 이벤트
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('ai:enabled', {
                  detail: { timestamp: Date.now() },
                })
              );
            }
          } catch (error) {
            console.error('❌ [AI] 활성화 실패:', error);
          }
        },

        // AI 비활성화
        disable: () => {
          try {
            set({
              isEnabled: false,
              state: 'disabled',
              isProcessing: false,
            });

            console.log('🤖 [AI] AI 어시스턴트 비활성화');

            // AI 비활성화 이벤트
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('ai:disabled', {
                  detail: { timestamp: Date.now() },
                })
              );
            }
          } catch (error) {
            console.error('❌ [AI] 비활성화 실패:', error);
          }
        },

        // 처리 시작
        startProcessing: () => {
          const { isEnabled } = get();
          if (!isEnabled) return;

          set({
            isProcessing: true,
            state: 'processing',
          });

          console.log('⚡ [AI] 처리 시작');
        },

        // 처리 중지
        stopProcessing: () => {
          set({
            isProcessing: false,
            state: 'idle',
          });

          console.log('⏸️ [AI] 처리 중지');
        },

        // 메트릭 업데이트
        updateMetrics: (
          query: string,
          responseTime: number,
          success: boolean
        ) => {
          try {
            const { metrics } = get();

            const newTotalQueries = metrics.totalQueries + 1;
            const newSuccessfulQueries = success
              ? metrics.successfulQueries + 1
              : metrics.successfulQueries;

            // 평균 응답 시간 계산
            const newAverageResponseTime =
              (metrics.averageResponseTime * metrics.totalQueries +
                responseTime) /
              newTotalQueries;

            set({
              metrics: {
                totalQueries: newTotalQueries,
                successfulQueries: newSuccessfulQueries,
                averageResponseTime: newAverageResponseTime,
                lastActivity: Date.now(),
              },
            });

            console.log(
              `📊 [AI] 메트릭 업데이트 - Query: ${query}, Success: ${success}`
            );
          } catch (error) {
            console.error('❌ [AI] 메트릭 업데이트 실패:', error);
          }
        },

        // 패턴 추가
        addPattern: (pattern: string) => {
          try {
            const { learningData } = get();

            set({
              learningData: {
                ...learningData,
                patterns: [...learningData.patterns, pattern].slice(-50), // 최근 50개만 유지
              },
            });

            console.log(`🧠 [AI] 패턴 학습: ${pattern}`);
          } catch (error) {
            console.error('❌ [AI] 패턴 추가 실패:', error);
          }
        },

        // 개선사항 추가
        addImprovement: (improvement: string) => {
          try {
            const { learningData } = get();

            set({
              learningData: {
                ...learningData,
                improvements: [...learningData.improvements, improvement].slice(
                  -20
                ), // 최근 20개만 유지
              },
            });

            console.log(`📈 [AI] 개선사항 기록: ${improvement}`);
          } catch (error) {
            console.error('❌ [AI] 개선사항 추가 실패:', error);
          }
        },

        // 에러 로그
        logError: (error: string) => {
          try {
            const { learningData } = get();

            set({
              learningData: {
                ...learningData,
                errorLog: [
                  ...learningData.errorLog,
                  `${new Date().toISOString()}: ${error}`,
                ].slice(-30), // 최근 30개만 유지
              },
            });

            console.log(`❌ [AI] 에러 로그: ${error}`);
          } catch (error) {
            console.error('❌ [AI] 에러 로그 실패:', error);
          }
        },

        // 설정 업데이트
        updateConfig: (newConfig: Partial<AIState['config']>) => {
          try {
            const { config } = get();

            set({
              config: {
                ...config,
                ...newConfig,
              },
            });

            console.log('⚙️ [AI] 설정 업데이트:', newConfig);
          } catch (error) {
            console.error('❌ [AI] 설정 업데이트 실패:', error);
          }
        },

        // ===== AI 관리 액션 (v2.0.0) =====

        // Circuit Breaker 상태 업데이트
        updateCircuitBreakerStatus: (
          status: Record<string, CircuitBreakerStatus>
        ) => {
          try {
            const { management } = get();
            const breakerValues = Object.values(status);

            set({
              management: {
                ...management,
                circuitBreakers: status,
                stats: {
                  ...management.stats,
                  totalBreakers: breakerValues.length,
                  openBreakers: breakerValues.filter((b) => b.state === 'OPEN')
                    .length,
                  totalFailures: breakerValues.reduce(
                    (sum, b) => sum + b.failures,
                    0
                  ),
                },
                lastUpdated: Date.now(),
              },
            });
          } catch (error) {
            console.error('❌ [AI] Circuit Breaker 상태 업데이트 실패:', error);
          }
        },

        // Circuit Breaker 이벤트 추가
        addCircuitBreakerEvent: (event: CircuitBreakerEvent) => {
          try {
            const { management } = get();
            const oneHourAgo = Date.now() - 60 * 60 * 1000;

            // 최근 이벤트 추가 (최대 50개 유지)
            const newEvents = [...management.recentEvents, event].slice(-50);

            // 통계 업데이트
            const recentFailovers = newEvents.filter(
              (e) => e.type === 'failover' && e.timestamp > oneHourAgo
            ).length;
            const recentRateLimits = newEvents.filter(
              (e) => e.type === 'rate_limit' && e.timestamp > oneHourAgo
            ).length;

            set({
              management: {
                ...management,
                recentEvents: newEvents,
                stats: {
                  ...management.stats,
                  recentFailovers,
                  recentRateLimits,
                },
                lastUpdated: Date.now(),
              },
            });

            // 중요 이벤트 로깅
            if (
              event.type === 'circuit_open' ||
              event.type === 'failover' ||
              event.type === 'rate_limit'
            ) {
              console.warn(
                `⚠️ [AI] ${event.type} - ${event.service}:`,
                event.details
              );
            }
          } catch (error) {
            console.error('❌ [AI] Circuit Breaker 이벤트 추가 실패:', error);
          }
        },

        // 관리 통계 업데이트
        updateManagementStats: (stats: AIManagementState['stats']) => {
          try {
            const { management } = get();

            set({
              management: {
                ...management,
                stats,
                lastUpdated: Date.now(),
              },
            });
          } catch (error) {
            console.error('❌ [AI] 관리 통계 업데이트 실패:', error);
          }
        },

        // 관리 데이터 새로고침 (API 호출)
        refreshManagementData: async () => {
          try {
            const response = await fetch('/api/ai/status');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const { management } = get();

            set({
              management: {
                ...management,
                circuitBreakers: data.circuitBreakers ?? {},
                recentEvents: data.recentEvents ?? [],
                stats: data.stats ?? management.stats,
                lastUpdated: Date.now(),
              },
            });

            console.log('🔄 [AI] 관리 데이터 새로고침 완료');
          } catch (error) {
            console.error('❌ [AI] 관리 데이터 새로고침 실패:', error);
          }
        },
      }),
      {
        name: 'ai-store',
        storage: createJSONStorage(() => localStorage),
        // 메트릭과 학습 데이터는 persist
        partialize: (state) => ({
          isEnabled: state.isEnabled,
          config: state.config,
          metrics: state.metrics,
          learningData: state.learningData,
        }),
      }
    )
  )
);

// AI 상태 변화 감지
if (typeof window !== 'undefined') {
  useAIStore.subscribe(
    (state) => state.isEnabled,
    (isEnabled) => {
      console.log(`🤖 [AI] 상태 변화: ${isEnabled ? '활성화' : '비활성화'}`);
    }
  );
}
