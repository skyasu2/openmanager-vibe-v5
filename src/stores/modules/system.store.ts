import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';

/**
 * 🏗️ System Store Module
 * 시스템 상태 관리 전용 스토어
 *
 * 자동 종료는 useUnifiedAdminStore에서 중앙 관리
 */

export interface SystemState {
  // 상태
  isStarted: boolean;
  startTime: number | null;

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
  updateMetrics: () => void;
}

export const useSystemStore = create<SystemState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 초기 상태
        isStarted: false,
        startTime: null,
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

            set({
              isStarted: true,
              startTime: now,
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
            set({
              isStarted: false,
              startTime: null,
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
        partialize: (state) => ({
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
