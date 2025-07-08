import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';

/**
 * 🏗️ System Store Module
 * 시스템 상태 관리 전용 스토어
 */

const SYSTEM_AUTO_SHUTDOWN_TIME = 30 * 60 * 1000; // 30분

export interface SystemState {
  // 상태
  isStarted: boolean;
  startTime: number | null;
  shutdownTimer: NodeJS.Timeout | null;

  // 메트릭
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };

  // 액션
  start: () => void;
  stop: () => void;
  getRemainingTime: () => number;
  updateMetrics: () => void;
}

export const useSystemStore = create<SystemState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 초기 상태
        isStarted: false,
        startTime: null,
        shutdownTimer: null,
        uptime: 0,
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },

        // 시스템 시작
        start: () => {
          try {
            const now = Date.now();

            // 기존 타이머 정리
            const currentTimer = get().shutdownTimer;
            if (currentTimer) {
              clearTimeout(currentTimer);
            }

            // 자동 종료 타이머 설정
            const shutdownTimer = setTimeout(() => {
              console.log('⏰ [System] 30분 경과 - 자동 시스템 종료');
              get().stop();
            }, SYSTEM_AUTO_SHUTDOWN_TIME);

            set({
              isStarted: true,
              startTime: now,
              shutdownTimer,
            });

            console.log('🚀 [System] 시스템 시작됨');

            // 시스템 이벤트 발송
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('system:started', {
                  detail: { timestamp: now },
                })
              );
            }

            // 메트릭 업데이트 시작
            get().updateMetrics();
          } catch (error) {
            console.error('❌ [System] 시작 실패:', error);
          }
        },

        // 시스템 정지
        stop: () => {
          try {
            const currentTimer = get().shutdownTimer;
            if (currentTimer) {
              clearTimeout(currentTimer);
            }

            set({
              isStarted: false,
              startTime: null,
              shutdownTimer: null,
              uptime: 0,
            });

            console.log('⏹️ [System] 시스템 정지됨');

            // 시스템 이벤트 발송
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('system:stopped', {
                  detail: { timestamp: Date.now() },
                })
              );
            }
          } catch (error) {
            console.error('❌ [System] 정지 실패:', error);
          }
        },

        // 남은 시간 계산
        getRemainingTime: () => {
          const { isStarted, startTime } = get();
          if (!isStarted || !startTime) return 0;

          const elapsed = Date.now() - startTime;
          return Math.max(0, SYSTEM_AUTO_SHUTDOWN_TIME - elapsed);
        },

        // 메트릭 업데이트
        updateMetrics: () => {
          try {
            const { isStarted, startTime } = get();

            if (isStarted && startTime) {
              const uptime = Date.now() - startTime;

              // 메모리 사용량 시뮬레이션
              const memoryUsed = 60 + Math.random() * 30; // 60-90%

              set({
                uptime,
                memory: {
                  used: memoryUsed,
                  total: 100,
                  percentage: memoryUsed,
                },
              });
            }
          } catch (error) {
            console.error('❌ [System] 메트릭 업데이트 실패:', error);
          }
        },
      }),
      {
        name: 'system-store',
        storage: createJSONStorage(() => localStorage),
        // shutdownTimer는 persist하지 않음
        partialize: state => ({
          isStarted: state.isStarted,
          startTime: state.startTime,
          uptime: state.uptime,
          memory: state.memory,
        }),
        // SSR 안전성을 위한 skipHydration 추가
        skipHydration: true,
      }
    )
  )
);

// 메트릭 자동 업데이트 - 🚨 응급: 30초 → 10분으로 대폭 증가
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useSystemStore.getState();
    if (store.isStarted) {
      store.updateMetrics();
    }
  }, 600000); // 🚨 응급: 10분마다 업데이트 (Edge Request 사용량 감소)
}
