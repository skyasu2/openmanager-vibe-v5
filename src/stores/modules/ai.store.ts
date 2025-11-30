import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';

/**
 * 🤖 AI Assistant Store Module
 * AI 어시스턴트 상태 관리 전용 스토어
 */

export type AIAssistantState =
  | 'disabled'
  | 'enabled'
  | 'processing'
  | 'idle'
  | 'learning';

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
