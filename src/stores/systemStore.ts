/**
 * System Control Store
 * 
 * 🔋 시스템 전체 제어 및 절전 관리
 * - 평상시 모든 동작 정지
 * - 20분 활성화 타이머
 * - AI 에이전트 자동 감지 시작
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { systemLogger } from '../lib/logger';

export type SystemState = 'inactive' | 'active' | 'stopping';
export type AIAgentState = 'disabled' | 'enabled' | 'loading' | 'error';

export interface SystemStatus {
  state: SystemState;
  remainingTime: number; // 남은 시간 (초)
  sessionStartTime: number | null;
  sessionDuration: number;
  isExtended: boolean;
  extendedTime: number;
  totalSessions: number;
  totalActiveTime: number; // 총 활성화 시간 (초)
  
  // AI 에이전트 상태
  aiAgent: {
    state: AIAgentState;
    isEnabled: boolean;
    lastActivated: number | null;
    totalQueries: number;
    mcpStatus: 'connected' | 'disconnected' | 'error';
  };
}

export interface SystemStore extends SystemStatus {
  // System Actions
  startSystem: (durationInSeconds: number) => void;
  stopSystem: () => void;
  extendSession: (additionalMinutes: number) => void;
  aiTriggeredActivation: (reason: string) => void;
  
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
  };
  
  // System Control
  canStartDataCollection: () => boolean;
  canShowDashboard: () => boolean;
  canRunSimulation: () => boolean;
  
  // Internal methods
  _updateRemainingTime: () => void;
  _handleSessionEnd: () => void;
}

export const useSystemStore = create<SystemStore>()(
  persist(
    (set, get) => {
      let timer: NodeJS.Timeout | null = null;
      let warningTimer: NodeJS.Timeout | null = null;

      const clearTimers = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        if (warningTimer) {
          clearTimeout(warningTimer);
          warningTimer = null;
        }
      };

      const startWarningTimers = (remainingTime: number) => {
        // 5분 전 경고
        if (remainingTime > 300) {
          setTimeout(() => {
            const current = get();
            if (current.state === 'active' && current.remainingTime <= 300) {
              systemLogger.warn('5 minutes remaining');
            }
          }, (remainingTime - 300) * 1000);
        }

        // 1분 전 경고
        if (remainingTime > 60) {
          setTimeout(() => {
            const current = get();
            if (current.state === 'active' && current.remainingTime <= 60) {
              systemLogger.warn('1 minute remaining');
            }
          }, (remainingTime - 60) * 1000);
        }

        // 30초 전 경고
        if (remainingTime > 30) {
          setTimeout(() => {
            const current = get();
            if (current.state === 'active' && current.remainingTime <= 30) {
              systemLogger.warn('30 seconds remaining');
            }
          }, (remainingTime - 30) * 1000);
        }
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
        
        // AI 에이전트 상태
        aiAgent: {
          state: 'disabled' as AIAgentState,
          isEnabled: false,
          lastActivated: null,
          totalQueries: 0,
          mcpStatus: 'disconnected' as const
        },

        startSystem: (durationInSeconds: number) => {
          clearTimers();
          
          const startTime = Date.now();
          
          set({
            state: 'active',
            remainingTime: durationInSeconds,
            sessionStartTime: startTime,
            sessionDuration: durationInSeconds,
            isExtended: false,
            extendedTime: 0,
            totalSessions: get().totalSessions + 1
          });

          systemLogger.system(`System activated for ${durationInSeconds / 60} minutes`);

          // 1초마다 남은 시간 업데이트
          timer = setInterval(() => {
            const current = get();
            if (current.state !== 'active') return;

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, durationInSeconds - elapsed);

            if (remaining <= 0) {
              systemLogger.system('Session time expired, stopping system...');
              get()._handleSessionEnd();
            } else {
              set({ remainingTime: remaining });
            }
          }, 1000);

          // 경고 타이머 설정
          startWarningTimers(durationInSeconds);
        },

        stopSystem: () => {
          const current = get();
          clearTimers();
          
          let actualSessionDuration = 0;
          if (current.sessionStartTime) {
            actualSessionDuration = Math.floor((Date.now() - current.sessionStartTime) / 1000);
            systemLogger.system(`System stopped (session duration: ${Math.floor(actualSessionDuration / 60)}m ${actualSessionDuration % 60}s)`);
          }

          set({
            state: 'inactive',
            remainingTime: 0,
            sessionStartTime: null,
            sessionDuration: 0,
            isExtended: false,
            extendedTime: 0,
            totalActiveTime: current.totalActiveTime + actualSessionDuration
          });
        },

        extendSession: (additionalMinutes: number) => {
          const current = get();
          
          if (current.state !== 'active') {
            systemLogger.warn('Cannot extend session: system is not active');
            return;
          }

          const additionalSeconds = additionalMinutes * 60;
          const newRemainingTime = current.remainingTime + additionalSeconds;
          const newTotalDuration = current.sessionDuration + additionalSeconds;

          // 기존 타이머 정리하고 새로 시작
          clearTimers();
          
          const startTime = current.sessionStartTime!;
          
          timer = setInterval(() => {
            const currentState = get();
            if (currentState.state !== 'active') return;

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, newTotalDuration - elapsed);

            if (remaining <= 0) {
              systemLogger.system('Extended session time expired, stopping system...');
              get()._handleSessionEnd();
            } else {
              set({ remainingTime: remaining });
            }
          }, 1000);

          set({
            remainingTime: newRemainingTime,
            sessionDuration: newTotalDuration,
            isExtended: true,
            extendedTime: current.extendedTime + additionalSeconds
          });

          systemLogger.system(`Session extended by ${additionalMinutes} minutes`);
        },

        aiTriggeredActivation: (reason: string) => {
          systemLogger.ai(`AI triggered system activation: ${reason}`);
          get().startSystem(20 * 60); // 20분 활성화
        },

        _updateRemainingTime: () => {
          // 내부 메서드 - 직접 호출하지 말 것
        },

        _handleSessionEnd: () => {
          clearTimers();
          
          // 모든 서비스 중지
          const stopAllServices = async () => {
            try {
              // 1. 데이터 생성기 중지
              console.log('🛑 데이터 생성기 중지 중...');
              await fetch('/api/data-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
              });
              
              // 2. AI 에이전트 비활성화
              console.log('🛑 AI 에이전트 비활성화 중...');
              await fetch('/api/ai-agent/power', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate' })
              });
              
              console.log('✅ 모든 서비스 중지 완료');
            } catch (error) {
              console.error('서비스 중지 중 오류:', error);
            }
          };
          
          // 서비스 중지 실행
          stopAllServices();
          
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
              totalActiveTime: currentState.totalActiveTime + (currentState.sessionStartTime ? Math.floor((Date.now() - currentState.sessionStartTime) / 1000) : 0)
            });
            
            console.log('🔴 시스템 완전 종료 - 재시작하려면 랜딩페이지에서 활성화 버튼을 눌러주세요.');
          }, 1000);
        },

        // Getters
        getFormattedTime: () => {
          const { remainingTime } = get();
          const minutes = Math.floor(remainingTime / 60);
          const seconds = remainingTime % 60;
          return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        getSessionInfo: () => {
          const { remainingTime, totalSessions, totalActiveTime } = get();
          return {
            remainingMinutes: Math.floor(remainingTime / 60),
            totalSessions,
            averageSessionTime: totalSessions > 0 ? Math.floor(totalActiveTime / totalSessions / 60) : 0
          };
        },

        // System Control
        canStartDataCollection: () => {
          const { state } = get();
          return state === 'active';
        },

        canShowDashboard: () => {
          const { state } = get();
          return state === 'active';
        },

        canRunSimulation: () => {
          const { state } = get();
          return state === 'active';
        },

        // AI 에이전트 액션들
        enableAIAgent: async () => {
          set((state) => ({
            aiAgent: {
              ...state.aiAgent,
              state: 'loading'
            }
          }));

          try {
            // MCP 서비스 및 AI 에이전트 활성화
            const response = await fetch('/api/ai-agent/power', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'activate' })
            });

            if (response.ok) {
              set((state) => ({
                aiAgent: {
                  ...state.aiAgent,
                  state: 'enabled',
                  isEnabled: true,
                  lastActivated: Date.now(),
                  mcpStatus: 'connected'
                }
              }));
              systemLogger.ai('AI Agent enabled successfully');
            } else {
              throw new Error('Failed to enable AI agent');
            }
          } catch (error) {
            set((state) => ({
              aiAgent: {
                ...state.aiAgent,
                state: 'error',
                isEnabled: false,
                mcpStatus: 'error'
              }
            }));
            systemLogger.error('Failed to enable AI agent', error);
          }
        },

        disableAIAgent: async () => {
          set((state) => ({
            aiAgent: {
              ...state.aiAgent,
              state: 'loading'
            }
          }));

          try {
            // AI 에이전트 비활성화
            const response = await fetch('/api/ai-agent/power', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'deactivate' })
            });

            if (response.ok) {
              set((state) => ({
                aiAgent: {
                  ...state.aiAgent,
                  state: 'disabled',
                  isEnabled: false,
                  mcpStatus: 'disconnected'
                }
              }));
              systemLogger.ai('AI Agent disabled successfully');
            } else {
              throw new Error('Failed to disable AI agent');
            }
          } catch (error) {
            set((state) => ({
              aiAgent: {
                ...state.aiAgent,
                state: 'error',
                mcpStatus: 'error'
              }
            }));
            systemLogger.error('Failed to disable AI agent', error);
          }
        },

        toggleAIAgent: async () => {
          const { aiAgent } = get();
          if (aiAgent.isEnabled) {
            await get().disableAIAgent();
          } else {
            await get().enableAIAgent();
          }
        },

        updateAIAgentQuery: () => {
          set((state) => ({
            aiAgent: {
              ...state.aiAgent,
              totalQueries: state.aiAgent.totalQueries + 1
            }
          }));
        }
      };
    },
    {
      name: 'system-control-storage',
      // 타이머는 persist하지 않음
      partialize: (state) => ({
        state: state.state,
        totalSessions: state.totalSessions,
        totalActiveTime: state.totalActiveTime
      })
    }
  )
); 