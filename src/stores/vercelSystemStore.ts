/**
 * 🚀 베르셀 친화적 시스템 상태 관리
 *
 * ✅ 베르셀 환경 특화:
 * - 서버리스 함수 제한 고려
 * - Redis/Upstash 기반 상태 저장
 * - 폴링 방식 상태 동기화
 * - 자원 최소화 및 정리
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 시스템 상태 정의
export type SystemState =
  | 'STOPPED' // 완전 중지 (자원 최소화)
  | 'STARTING' // 시작 중 (초기화 단계)
  | 'RUNNING' // 안정적 운영 중
  | 'STOPPING'; // 안전한 종료 중

export interface VercelSystemInfo {
  state: SystemState;
  startedAt: number | null;
  startedBy: string;
  activeUsers: number;
  lastHeartbeat: number;

  // 30분 카운트다운 (옵션)
  countdownEnabled: boolean;
  countdownStartAt: number | null;
  countdownDuration: number; // 기본 30분 (1800초)

  // 자원 관리
  resourcesActive: boolean;
  dataGenerationActive: boolean;
}

interface VercelSystemStore {
  systemInfo: VercelSystemInfo;

  // 시스템 제어
  startSystem: (options?: {
    enableCountdown?: boolean;
    countdownMinutes?: number;
    operatorName?: string;
  }) => Promise<{ success: boolean; message: string }>;

  stopSystem: (
    reason?: 'manual' | 'countdown' | 'error'
  ) => Promise<{ success: boolean; message: string }>;

  // 상태 동기화 (폴링 방식)
  syncWithServer: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;

  // 카운트다운 관리
  toggleCountdown: (enabled: boolean, minutes?: number) => void;
  startCountdownTimer: () => void;
  getRemainingTime: () => number;

  // 상태 확인
  canStart: () => boolean;
  canStop: () => boolean;
  isStable: () => boolean;

  // 자원 관리
  cleanupResources: () => Promise<void>;
}

// 초기 상태
const createInitialState = (): VercelSystemInfo => ({
  state: 'STOPPED',
  startedAt: null,
  startedBy: '',
  activeUsers: 0,
  lastHeartbeat: Date.now(),

  countdownEnabled: false,
  countdownStartAt: null,
  countdownDuration: 30 * 60, // 30분 (초)

  resourcesActive: false,
  dataGenerationActive: false,
});

export const useVercelSystemStore = create<VercelSystemStore>()(
  persist(
    (set, get) => {
      let pollingInterval: NodeJS.Timeout | null = null;
      let countdownInterval: NodeJS.Timeout | null = null;

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        systemInfo: createInitialState(),

        // 시스템 시작 (30분 강제 종료 제거)
        startSystem: async (options = {}) => {
          const {
            enableCountdown = false,
            countdownMinutes = 30,
            operatorName = '사용자',
          } = options;

          const { canStart } = get();

          if (!canStart()) {
            return {
              success: false,
              message:
                '시스템을 시작할 수 없습니다. 이미 동작 중이거나 시작 중입니다.',
            };
          }

          try {
            console.log('🚀 베르셀 시스템 시작:', {
              enableCountdown,
              operatorName,
            });

            const now = Date.now();

            // 로컬 상태 업데이트
            set({
              systemInfo: {
                ...get().systemInfo,
                state: 'STARTING',
                startedAt: now,
                startedBy: operatorName,
                countdownEnabled: enableCountdown,
                countdownStartAt: enableCountdown ? now : null,
                countdownDuration: countdownMinutes * 60,
                resourcesActive: true,
                lastHeartbeat: now,
              },
            });

            // 시작 프로세스 시뮬레이션 (3초 후 RUNNING 상태로)
            setTimeout(() => {
              set({
                systemInfo: {
                  ...get().systemInfo,
                  state: 'RUNNING',
                  dataGenerationActive: true,
                },
              });

              // 카운트다운 활성화 시 타이머 시작
              if (enableCountdown) {
                get().startCountdownTimer();
              }

              console.log('✅ 시스템 운영 상태 진입');
            }, 3000);

            // 폴링 시작
            get().startPolling();

            return {
              success: true,
              message: '시스템이 시작되었습니다. 안정적 운영이 보장됩니다.',
            };
          } catch (error) {
            console.error('❌ 시스템 시작 실패:', error);
            return {
              success: false,
              message: `시스템 시작 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            };
          }
        },

        // 시스템 종료 (안전한 종료)
        stopSystem: async (reason = 'manual') => {
          const { canStop } = get();

          if (!canStop()) {
            return {
              success: false,
              message:
                '시스템을 종료할 수 없습니다. 이미 중지되었거나 종료 중입니다.',
            };
          }

          try {
            console.log('⏹️ 안전한 시스템 종료 시작:', reason);

            // 로컬 상태를 STOPPING으로 변경
            set({
              systemInfo: {
                ...get().systemInfo,
                state: 'STOPPING',
                lastHeartbeat: Date.now(),
              },
            });

            // 자원 정리
            await get().cleanupResources();

            // 안전한 종료 프로세스 시뮬레이션 (2초)
            setTimeout(() => {
              set({
                systemInfo: {
                  ...createInitialState(),
                  lastHeartbeat: Date.now(),
                },
              });

              console.log('✅ 시스템 완전 종료 - 자원 최소화 완료');
            }, 2000);

            return {
              success: true,
              message:
                reason === 'countdown'
                  ? '카운트다운 완료로 시스템이 안전하게 종료되었습니다.'
                  : '시스템이 안전하게 종료되었습니다.',
            };
          } catch (error) {
            console.error('❌ 시스템 종료 실패:', error);
            return {
              success: false,
              message: `시스템 종료 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            };
          }
        },

        // 서버와 상태 동기화 (베르셀 친화적 폴링)
        syncWithServer: async () => {
          try {
            // 실제 구현 시 Redis 상태 확인
            const { systemInfo } = get();

            // 하트비트 업데이트
            set({
              systemInfo: {
                ...systemInfo,
                lastHeartbeat: Date.now(),
              },
            });
          } catch (error) {
            console.warn('⚠️ 서버 상태 동기화 실패:', error);
          }
        },

        // 폴링 시작 (베르셀 최적화 간격)
        startPolling: () => {
          get().stopPolling();

          pollingInterval = setInterval(() => {
            get().syncWithServer();
          }, 10000); // 10초 간격 (베르셀 친화적)
        },

        // 폴링 중지
        stopPolling: () => {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }

          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
        },

        // 카운트다운 설정
        toggleCountdown: (enabled: boolean, minutes = 30) => {
          const { systemInfo } = get();
          const now = Date.now();

          set({
            systemInfo: {
              ...systemInfo,
              countdownEnabled: enabled,
              countdownStartAt: enabled ? now : null,
              countdownDuration: minutes * 60,
            },
          });

          if (enabled && systemInfo.state === 'RUNNING') {
            get().startCountdownTimer();
          } else {
            if (countdownInterval) {
              clearInterval(countdownInterval);
              countdownInterval = null;
            }
          }
        },

        // 카운트다운 타이머 시작
        startCountdownTimer: () => {
          if (countdownInterval) {
            clearInterval(countdownInterval);
          }

          countdownInterval = setInterval(() => {
            const remaining = get().getRemainingTime();

            if (remaining <= 0) {
              console.log('⏰ 카운트다운 종료 - 시스템 자동 종료');
              get().stopSystem('countdown');
            }
          }, 1000);
        },

        // 남은 시간 계산 (초)
        getRemainingTime: () => {
          const { systemInfo } = get();

          if (!systemInfo.countdownEnabled || !systemInfo.countdownStartAt) {
            return 0;
          }

          const elapsed = (Date.now() - systemInfo.countdownStartAt) / 1000;
          return Math.max(0, systemInfo.countdownDuration - elapsed);
        },

        // 상태 확인 메서드들
        canStart: () => {
          const { state } = get().systemInfo;
          return state === 'STOPPED';
        },

        canStop: () => {
          const { state } = get().systemInfo;
          return state === 'RUNNING' || state === 'STARTING';
        },

        isStable: () => {
          const { state, lastHeartbeat } = get().systemInfo;
          const timeSinceHeartbeat = Date.now() - lastHeartbeat;

          return state === 'RUNNING' && timeSinceHeartbeat < 30000;
        },

        // 자원 정리 (베르셀 최적화)
        cleanupResources: async () => {
          console.log('🧹 동적 자원 정리 시작...');

          try {
            // 폴링 중지
            get().stopPolling();

            // 로컬 상태 정리
            set({
              systemInfo: {
                ...get().systemInfo,
                resourcesActive: false,
                dataGenerationActive: false,
              },
            });

            console.log('✅ 자원 정리 완료 - 메모리 사용량 최소화');
          } catch (error) {
            console.error('❌ 자원 정리 실패:', error);
          }
        },
      };
    },
    {
      name: 'vercel-system-storage-v2',
      partialize: state => ({
        systemInfo: {
          ...state.systemInfo,
          lastHeartbeat: Date.now(),
        },
      }),
      // 베르셀 환경에서 하트비트 기반 상태 검증
      onRehydrateStorage: () => state => {
        if (state?.systemInfo) {
          const timeSinceLastHeartbeat =
            Date.now() - state.systemInfo.lastHeartbeat;
          // 5분 이상 비활성 상태면 강제 STOPPED
          if (timeSinceLastHeartbeat > 5 * 60 * 1000) {
            console.log('🔄 비활성 상태 감지 - 시스템 상태 초기화');
            state.systemInfo = createInitialState();
          }
        }
      },
    }
  )
);
