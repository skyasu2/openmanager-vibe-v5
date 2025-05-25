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

export type SystemState = 'stopped' | 'active' | 'ai-only';

export interface SystemStatus {
  state: SystemState;
  isActive: boolean;
  remainingTime: number; // 남은 시간 (초)
  sessionStartTime: Date | null;
  sessionEndTime: Date | null;
  autoStopTimer: NodeJS.Timeout | null;
  countdownTimer: NodeJS.Timeout | null;
  totalSessions: number;
  totalActiveTime: number; // 총 활성화 시간 (초)
}

export interface SystemStore extends SystemStatus {
  // Actions
  startSystem: (duration?: number) => void;
  stopSystem: () => void;
  extendSession: (additionalMinutes: number) => void;
  triggerAIActivation: (reason: string) => void;
  updateCountdown: () => void;
  
  // Getters
  getFormattedTime: () => string;
  getSessionInfo: () => {
    isActive: boolean;
    remainingMinutes: number;
    totalSessions: number;
    averageSessionTime: number;
  };
  
  // System Control
  canStartDataCollection: () => boolean;
  canShowDashboard: () => boolean;
  canRunSimulation: () => boolean;
}

const DEFAULT_SESSION_DURATION = 20 * 60; // 20분 (초)

export const useSystemStore = create<SystemStore>()(
  persist(
    (set, get) => ({
      // Initial State
      state: 'stopped',
      isActive: false,
      remainingTime: 0,
      sessionStartTime: null,
      sessionEndTime: null,
      autoStopTimer: null,
      countdownTimer: null,
      totalSessions: 0,
      totalActiveTime: 0,

      // Actions
      startSystem: (duration = DEFAULT_SESSION_DURATION) => {
        const currentState = get();
        
        // 기존 타이머 정리
        if (currentState.autoStopTimer) {
          clearTimeout(currentState.autoStopTimer);
        }
        if (currentState.countdownTimer) {
          clearInterval(currentState.countdownTimer);
        }

        const now = new Date();
        const endTime = new Date(now.getTime() + duration * 1000);

        console.log(`🚀 System activated for ${duration / 60} minutes`);

        // 자동 정지 타이머 설정
        const autoStopTimer = setTimeout(() => {
          console.log('⏰ Session time expired, stopping system...');
          get().stopSystem();
        }, duration * 1000);

        // 카운트다운 타이머 설정 (1초마다)
        const countdownTimer = setInterval(() => {
          get().updateCountdown();
        }, 1000);

        set({
          state: 'active',
          isActive: true,
          remainingTime: duration,
          sessionStartTime: now,
          sessionEndTime: endTime,
          autoStopTimer,
          countdownTimer,
          totalSessions: currentState.totalSessions + 1
        });

        // 시스템 컴포넌트들에게 활성화 신호 전송
        window.dispatchEvent(new CustomEvent('system-activated', {
          detail: { duration, endTime }
        }));
      },

      stopSystem: () => {
        const currentState = get();
        
        // 타이머 정리
        if (currentState.autoStopTimer) {
          clearTimeout(currentState.autoStopTimer);
        }
        if (currentState.countdownTimer) {
          clearInterval(currentState.countdownTimer);
        }

        // 세션 시간 계산
        let sessionDuration = 0;
        if (currentState.sessionStartTime) {
          sessionDuration = Math.floor((Date.now() - currentState.sessionStartTime.getTime()) / 1000);
        }

        console.log(`🛑 System stopped (session duration: ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s)`);

        set({
          state: 'stopped',
          isActive: false,
          remainingTime: 0,
          sessionStartTime: null,
          sessionEndTime: null,
          autoStopTimer: null,
          countdownTimer: null,
          totalActiveTime: currentState.totalActiveTime + sessionDuration
        });

        // 시스템 컴포넌트들에게 정지 신호 전송
        window.dispatchEvent(new CustomEvent('system-stopped'));
      },

      extendSession: (additionalMinutes: number) => {
        const currentState = get();
        
        if (!currentState.isActive) {
          console.warn('Cannot extend session: system is not active');
          return;
        }

        const additionalSeconds = additionalMinutes * 60;
        const newEndTime = new Date(currentState.sessionEndTime!.getTime() + additionalSeconds * 1000);

        // 기존 타이머 정리 후 새로 설정
        if (currentState.autoStopTimer) {
          clearTimeout(currentState.autoStopTimer);
        }

        const autoStopTimer = setTimeout(() => {
          console.log('⏰ Extended session time expired, stopping system...');
          get().stopSystem();
        }, (currentState.remainingTime + additionalSeconds) * 1000);

        set({
          remainingTime: currentState.remainingTime + additionalSeconds,
          sessionEndTime: newEndTime,
          autoStopTimer
        });

        console.log(`⏱️ Session extended by ${additionalMinutes} minutes`);
      },

      triggerAIActivation: (reason: string) => {
        const currentState = get();
        
        if (currentState.state === 'stopped') {
          console.log(`🤖 AI triggered system activation: ${reason}`);
          
          set({ state: 'ai-only' });
          
          // AI 전용 모드는 데이터 수집만 활성화, UI는 비활성 상태 유지
          window.dispatchEvent(new CustomEvent('ai-activation', {
            detail: { reason }
          }));
        }
      },

      updateCountdown: () => {
        const currentState = get();
        
        if (!currentState.isActive || !currentState.sessionEndTime) {
          return;
        }

        const now = Date.now();
        const remaining = Math.max(0, Math.floor((currentState.sessionEndTime.getTime() - now) / 1000));

        set({ remainingTime: remaining });

        // 5분, 1분, 30초 경고
        if (remaining === 300) {
          console.log('⚠️ 5 minutes remaining');
          window.dispatchEvent(new CustomEvent('session-warning', { detail: { minutes: 5 } }));
        } else if (remaining === 60) {
          console.log('⚠️ 1 minute remaining');
          window.dispatchEvent(new CustomEvent('session-warning', { detail: { minutes: 1 } }));
        } else if (remaining === 30) {
          console.log('⚠️ 30 seconds remaining');
          window.dispatchEvent(new CustomEvent('session-warning', { detail: { seconds: 30 } }));
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
        const { isActive, remainingTime, totalSessions, totalActiveTime } = get();
        return {
          isActive,
          remainingMinutes: Math.floor(remainingTime / 60),
          totalSessions,
          averageSessionTime: totalSessions > 0 ? Math.floor(totalActiveTime / totalSessions / 60) : 0
        };
      },

      // System Control
      canStartDataCollection: () => {
        const { state } = get();
        return state === 'active' || state === 'ai-only';
      },

      canShowDashboard: () => {
        const { state } = get();
        return state === 'active';
      },

      canRunSimulation: () => {
        const { state } = get();
        return state === 'active';
      }
    }),
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