/**
 * System Control Store v2.0
 * 
 * 🔋 개선된 시스템 전체 제어 및 절전 관리
 * - 불필요한 자동 종료 방지
 * - 사용자 의도 기반 제어
 * - 안정적인 상태 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { systemLogger } from '../lib/logger';

export type SystemState = 'inactive' | 'active' | 'stopping' | 'paused';
export type AIAgentState = 'disabled' | 'enabled' | 'processing' | 'idle';

interface SystemStatus {
  state: SystemState;
  remainingTime: number;
  sessionStartTime: number | null;
  sessionDuration: number;
  isExtended: boolean;
  extendedTime: number;
  totalSessions: number;
  totalActiveTime: number;
  isPaused: boolean;
  pauseReason?: string;
  lastActivity: number;
  userInitiated: boolean; // 사용자가 직접 시작했는지 여부
}

interface AIAgentStatus {
  state: AIAgentState;
  isEnabled: boolean;
  lastActivated: number | null;
  totalQueries: number;
  mcpStatus: 'connected' | 'disconnected' | 'error';
}

export interface SystemStore extends SystemStatus {
  // AI Agent
  aiAgent: AIAgentStatus;
  
  // System Actions
  startSystem: (durationInSeconds: number, userInitiated?: boolean) => Promise<void>;
  stopSystem: (reason?: string) => void;
  pauseSystem: (reason: string) => void;
  resumeSystem: () => void;
  extendSession: (additionalMinutes: number) => Promise<void>;
  aiTriggeredActivation: (reason: string) => void;
  updateActivity: () => void; // 사용자 활동 업데이트
  
  // AI Agent Actions
  enableAIAgent: () => Promise<void>;
  disableAIAgent: () => Promise<void>;
  toggleAIAgent: () => Promise<void>;
  updateAIAgentQuery: () => void;
  
  // Getters
  getFormattedTime: () => string;
  getSessionInfo: () => {
    remainingMinutes: number;
    totalSessions: number;
    averageSessionTime: number;
    isUserSession: boolean;
  };
  
  // System Control
  canStartDataCollection: () => boolean;
  canShowDashboard: () => boolean;
  canRunSimulation: () => boolean;
  shouldAutoStop: () => boolean; // 자동 중지 여부 판단
  
  // Internal methods
  _updateRemainingTime: () => void;
  _handleSessionEnd: () => Promise<void>;
  _checkInactivity: () => void;
}

export const useSystemStore = create<SystemStore>()(
  persist(
    (set, get) => {
      let timer: NodeJS.Timeout | null = null;
      let inactivityTimer: NodeJS.Timeout | null = null;

      const clearTimers = () => {
        try {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
          }
          
          // 추가 안전장치: 모든 타이머 정리
          const timers = [timer, inactivityTimer];
          timers.forEach(t => {
            if (t) {
              try {
                clearInterval(t);
                clearTimeout(t);
              } catch (e) {
                console.warn('⚠️ [SystemStore] 타이머 정리 중 경고:', e);
              }
            }
          });
          
          console.log('🧹 [SystemStore] 모든 타이머 정리 완료');
        } catch (error) {
          console.error('❌ [SystemStore] 타이머 정리 실패:', error);
        }
      };

      const startWarningTimers = (remainingTime: number, userInitiated: boolean) => {
        // 사용자가 직접 시작한 세션에만 경고 표시
        if (!userInitiated) return;

        // 5분 전 경고
        if (remainingTime > 300) {
          setTimeout(() => {
            const current = get();
            if (current.state === 'active' && current.remainingTime <= 300 && current.userInitiated) {
              systemLogger.warn('⏰ 5분 후 세션이 종료됩니다');
            }
          }, (remainingTime - 300) * 1000);
        }

        // 1분 전 경고
        if (remainingTime > 60) {
          setTimeout(() => {
            const current = get();
            if (current.state === 'active' && current.remainingTime <= 60 && current.userInitiated) {
              systemLogger.warn('⏰ 1분 후 세션이 종료됩니다');
            }
          }, (remainingTime - 60) * 1000);
        }
      };

      const startInactivityTimer = () => {
        // 비활성 타이머 (30분 비활성 시 일시정지)
        inactivityTimer = setTimeout(() => {
          const current = get();
          if (current.state === 'active' && !current.userInitiated) {
            systemLogger.system('😴 30분 비활성으로 인한 시스템 일시정지');
            get().pauseSystem('30분 비활성');
          }
        }, 30 * 60 * 1000); // 30분
      };

      return {
        state: 'inactive',
        remainingTime: 0,
        sessionStartTime: null,
        sessionDuration: 0,
        isExtended: false,
        extendedTime: 0,
        totalSessions: 0,
        totalActiveTime: 0,
        isPaused: false,
        pauseReason: undefined,
        lastActivity: Date.now(),
        userInitiated: false,
        
        // AI 에이전트 상태
        aiAgent: {
          state: 'disabled' as AIAgentState,
          isEnabled: false,
          lastActivated: null,
          totalQueries: 0,
          mcpStatus: 'disconnected' as const
        },

        startSystem: async (durationInSeconds: number, userInitiated = false) => {
          clearTimers();
          
          const startTime = Date.now();
          
          set({
            state: 'active',
            remainingTime: durationInSeconds,
            sessionStartTime: startTime,
            sessionDuration: durationInSeconds,
            isExtended: false,
            extendedTime: 0,
            totalSessions: get().totalSessions + 1,
            isPaused: false,
            pauseReason: undefined,
            lastActivity: startTime,
            userInitiated
          });

          const sessionType = userInitiated ? '사용자 세션' : 'AI 자동 세션';
          systemLogger.system(`🚀 시스템 활성화 (${sessionType}, ${durationInSeconds / 60}분)`);

          // 시스템 상태 업데이트 간격을 3초로 최적화 (1초 → 3초)
          timer = setInterval(async () => {
            const current = get();
            if (current.state !== 'active') return;

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, durationInSeconds - elapsed);

            if (remaining <= 0) {
              // 자동 중지 여부 확인
              if (get().shouldAutoStop()) {
                systemLogger.system('⏰ 세션 시간 만료 - 시스템 중지');
                await get()._handleSessionEnd();
              } else {
                // 사용자 세션은 자동 연장
                systemLogger.system('⏰ 세션 시간 만료 - 사용자 세션 자동 연장 (10분)');
                get().extendSession(10);
              }
            } else {
              set({ remainingTime: remaining });
            }
          }, 3000); // 3초마다 업데이트 (1초 → 3초로 성능 최적화)

          // 경고 타이머 설정 (사용자 세션만)
          startWarningTimers(durationInSeconds, userInitiated);
          
          // 비활성 타이머 시작 (AI 세션만)
          if (!userInitiated) {
            startInactivityTimer();
          }
        },

        stopSystem: (reason = '사용자 요청') => {
          const current = get();
          clearTimers();
          
          let actualSessionDuration = 0;
          if (current.sessionStartTime) {
            actualSessionDuration = Math.floor((Date.now() - current.sessionStartTime) / 1000);
            systemLogger.system(`🛑 시스템 중지 (${reason}, 세션 시간: ${Math.floor(actualSessionDuration / 60)}분)`);
          }

          set({
            state: 'inactive',
            remainingTime: 0,
            sessionStartTime: null,
            sessionDuration: 0,
            isExtended: false,
            extendedTime: 0,
            totalActiveTime: current.totalActiveTime + actualSessionDuration,
            isPaused: false,
            pauseReason: undefined,
            userInitiated: false
          });
        },

        pauseSystem: (reason: string) => {
          clearTimers();
          
          set({
            state: 'paused',
            isPaused: true,
            pauseReason: reason
          });

          systemLogger.system(`⏸️ 시스템 일시정지: ${reason}`);
        },

        resumeSystem: () => {
          const current = get();
          
          if (current.state !== 'paused') {
            systemLogger.warn('시스템이 일시정지 상태가 아닙니다');
            return;
          }

          // 남은 시간으로 다시 시작
          get().startSystem(current.remainingTime, current.userInitiated);
          
          systemLogger.system('▶️ 시스템 재개');
        },

        extendSession: async (additionalMinutes: number) => {
          const current = get();
          
          if (current.state !== 'active') {
            systemLogger.warn('활성 상태가 아닌 시스템은 연장할 수 없습니다');
            return;
          }

          const additionalSeconds = additionalMinutes * 60;
          const newRemainingTime = current.remainingTime + additionalSeconds;
          const newTotalDuration = current.sessionDuration + additionalSeconds;

          // 기존 타이머 정리하고 새로 시작
          clearTimers();
          
          const startTime = current.sessionStartTime!;
          
          // 세션 연장 시에도 3초 간격으로 최적화
          timer = setInterval(async () => {
            const currentState = get();
            if (currentState.state !== 'active') return;

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, newTotalDuration - elapsed);

            if (remaining <= 0) {
              if (get().shouldAutoStop()) {
                systemLogger.system('⏰ 연장된 세션 시간 만료 - 시스템 중지');
                await get()._handleSessionEnd();
              } else {
                // 사용자 세션은 추가 연장
                systemLogger.system('⏰ 연장된 세션 시간 만료 - 추가 연장 (10분)');
                get().extendSession(10);
              }
            } else {
              set({ remainingTime: remaining });
            }
          }, 3000); // 3초마다 업데이트 (성능 최적화)

          set({
            remainingTime: newRemainingTime,
            sessionDuration: newTotalDuration,
            isExtended: true,
            extendedTime: current.extendedTime + additionalSeconds,
            lastActivity: Date.now()
          });

          systemLogger.system(`⏰ 세션 연장: +${additionalMinutes}분`);
        },

        updateActivity: () => {
          try {
            // 🚨 컴포넌트 언마운트 후 상태 업데이트 방지
            const current = get();
            if (!current) {
              console.warn('⚠️ [SystemStore] updateActivity: 스토어 상태가 없음 - 업데이트 중단');
              return;
            }

            // 🔒 React 안전 모드: 배치 업데이트로 처리
            Promise.resolve().then(() => {
              try {
                const latestState = get();
                if (latestState && latestState.state !== 'inactive') {
                  set({ lastActivity: Date.now() });
                  
                  // 비활성 타이머 리셋 (AI 세션만)
                  if (latestState.state === 'active' && !latestState.userInitiated) {
                    if (inactivityTimer) {
                      clearTimeout(inactivityTimer);
                    }
                    startInactivityTimer();
                  }
                }
              } catch (batchError) {
                console.warn('⚠️ [SystemStore] 배치 업데이트 실패 (무시):', batchError);
              }
            });
          } catch (error) {
            console.error('❌ [SystemStore] updateActivity 실패:', error);
            // 에러 발생 시에도 안전하게 계속 진행
          }
        },

        aiTriggeredActivation: (reason: string) => {
          systemLogger.ai(`🤖 AI 트리거 시스템 활성화: ${reason}`);
          get().startSystem(20 * 60, false); // AI 세션은 20분
        },

        _updateRemainingTime: () => {
          // 내부 메서드 - 직접 호출하지 말 것
        },

        _handleSessionEnd: async () => {
          clearTimers();
          
          // 모든 서비스 중지
          const stopAllServices = async () => {
            try {
              // 1. 시뮬레이션 엔진 중지
              console.log('🛑 시뮬레이션 엔진 중지 중...');
              await fetch('/api/system/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }).catch(() => {
                console.log('ℹ️ 시뮬레이션 엔진 이미 중지됨');
              });
              
              // 2. AI 에이전트 비활성화
              console.log('🛑 AI 에이전트 비활성화 중...');
              await fetch('/api/ai-agent/power', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate' })
              }).catch(() => {
                console.log('ℹ️ AI 에이전트 이미 비활성화됨');
              });
              
              console.log('✅ 모든 서비스 중지 완료');
            } catch (error) {
              console.error('서비스 중지 중 오류:', error);
            }
          };
          
          // 서비스 중지 실행
          await stopAllServices();
          
          set({
            state: 'stopping',
            remainingTime: 0
          });

          // 1초 후 완전히 비활성화
          setTimeout(() => {
            const currentState = get();
            set({
              state: 'inactive',
              sessionStartTime: null,
              sessionDuration: 0,
              isExtended: false,
              extendedTime: 0,
              totalActiveTime: currentState.totalActiveTime + (currentState.sessionStartTime ? Math.floor((Date.now() - currentState.sessionStartTime) / 1000) : 0),
              isPaused: false,
              pauseReason: undefined,
              userInitiated: false
            });
            
            console.log('🔴 시스템 완전 종료');
          }, 1000);
        },

        _checkInactivity: () => {
          const current = get();
          const inactiveTime = Date.now() - current.lastActivity;
          
          // 30분 비활성 시 일시정지 (AI 세션만)
          if (current.state === 'active' && !current.userInitiated && inactiveTime > 30 * 60 * 1000) {
            get().pauseSystem('30분 비활성');
          }
        },

        // Getters
        getFormattedTime: () => {
          const { remainingTime } = get();
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        getSessionInfo: () => {
          const { remainingTime, totalSessions, totalActiveTime, userInitiated } = get();
          return {
            remainingMinutes: Math.floor(remainingTime / 60),
            totalSessions,
            averageSessionTime: totalSessions > 0 ? Math.floor(totalActiveTime / totalSessions / 60) : 0,
            isUserSession: userInitiated
          };
        },

        shouldAutoStop: () => {
          const current = get();
          // 사용자가 직접 시작한 세션은 자동 중지하지 않음
          return !current.userInitiated;
        },

        // System Control
        canStartDataCollection: () => {
          const { state } = get();
          return state === 'active';
        },

        canShowDashboard: () => {
          const { state } = get();
          return state === 'active' || state === 'paused';
        },

        canRunSimulation: () => {
          const { state } = get();
          return state === 'active';
        },

        // AI Agent Actions
        enableAIAgent: async () => {
          // 🔐 보안 강화: useUnifiedAdminStore를 통한 인증 확인 필수
          const { useUnifiedAdminStore } = await import('./useUnifiedAdminStore');
          const adminStore = useUnifiedAdminStore.getState();
          
          // AI 에이전트가 이미 인증되어 활성화된 경우에만 허용
          if (!adminStore.aiAgent.isEnabled || !adminStore.aiAgent.isAuthenticated) {
            systemLogger.error('🚫 AI 에이전트 활성화 실패: 인증되지 않은 접근 시도');
            console.warn('🚫 [Security] AI 에이전트 활성화 차단 - 인증 필요');
            throw new Error('AI 에이전트 사용을 위해서는 관리자 인증이 필요합니다.');
          }
          
          try {
            const response = await fetch('/api/ai-agent/power', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'activate' })
            });

            if (response.ok) {
              set({
                aiAgent: {
                  ...get().aiAgent,
                  state: 'enabled',
                  isEnabled: true,
                  lastActivated: Date.now()
                }
              });
              systemLogger.ai('✅ AI 에이전트 활성화 완료 (인증 확인됨)');
            }
          } catch (error) {
            systemLogger.error('❌ AI 에이전트 활성화 실패:', error);
            throw error;
          }
        },

        disableAIAgent: async () => {
          try {
            const response = await fetch('/api/ai-agent/power', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'deactivate' })
            });

            if (response.ok) {
              set({
                aiAgent: {
                  ...get().aiAgent,
                  state: 'disabled',
                  isEnabled: false
                }
              });
              systemLogger.ai('AI 에이전트 비활성화 완료');
            }
          } catch (error) {
            systemLogger.error('AI 에이전트 비활성화 실패:', error);
          }
        },

        toggleAIAgent: async () => {
          // 🔐 보안 강화: 토글도 인증 확인 필수
          const { useUnifiedAdminStore } = await import('./useUnifiedAdminStore');
          const adminStore = useUnifiedAdminStore.getState();
          
          const { aiAgent } = get();
          if (aiAgent.isEnabled) {
            // 비활성화는 항상 허용
            await get().disableAIAgent();
          } else {
            // 활성화는 인증 필요
            if (!adminStore.aiAgent.isEnabled || !adminStore.aiAgent.isAuthenticated) {
              systemLogger.error('🚫 AI 에이전트 토글 실패: 인증되지 않은 접근 시도');
              console.warn('🚫 [Security] AI 에이전트 토글 차단 - 인증 필요');
              throw new Error('AI 에이전트 사용을 위해서는 관리자 인증이 필요합니다.');
            }
            await get().enableAIAgent();
          }
        },

        updateAIAgentQuery: () => {
          try {
            // 🚨 컴포넌트 언마운트 후 상태 업데이트 방지
            const current = get();
            if (!current || !current.aiAgent) {
              console.warn('⚠️ [SystemStore] updateAIAgentQuery: 스토어 상태가 없음 - 업데이트 중단');
              return;
            }

            // 🔒 React 안전 모드: 배치 업데이트로 처리
            Promise.resolve().then(() => {
              try {
                const latestState = get();
                if (latestState && latestState.aiAgent) {
                  set({
                    aiAgent: {
                      ...latestState.aiAgent,
                      totalQueries: latestState.aiAgent.totalQueries + 1
                    }
                  });
                  
                  // 활동 업데이트 - 안전하게 호출
                  const updateActivity = get().updateActivity;
                  if (updateActivity) {
                    updateActivity();
                  }
                }
              } catch (batchError) {
                console.warn('⚠️ [SystemStore] AI 에이전트 배치 업데이트 실패 (무시):', batchError);
              }
            });
          } catch (error) {
            console.error('❌ [SystemStore] updateAIAgentQuery 실패:', error);
            // 에러 발생 시에도 안전하게 계속 진행
          }
        }
      };
    },
    {
      name: 'system-store',
      partialize: (state) => ({
        totalSessions: state.totalSessions,
        totalActiveTime: state.totalActiveTime,
        aiAgent: {
          totalQueries: state.aiAgent.totalQueries
        }
      })
    }
  )
); 