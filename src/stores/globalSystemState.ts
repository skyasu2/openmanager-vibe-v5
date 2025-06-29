/**
 * 🌐 글로벌 시스템 상태 관리 (다중 사용자 지원)
 *
 * ✅ 해결하는 문제:
 * - 다중 사용자 상태 동기화
 * - 실시간 상태 업데이트
 * - 안전한 시작/종료 프로세스
 * - 수동 제어 우선
 */

'use client';

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 시스템 상태 타입 정의
export type GlobalSystemState =
  | 'STOPPED' // 완전 중지 상태
  | 'STARTING' // 시작 프로세스 진행 중
  | 'RUNNING' // 정상 동작 중
  | 'STOPPING' // 종료 프로세스 진행 중
  | 'ERROR'; // 오류 상태

export interface SystemStateInfo {
  state: GlobalSystemState;
  startedAt: number | null;
  stoppedAt: number | null;
  activeUsers: number;
  lastStateChange: number;
  isManualControl: boolean; // 수동 제어 모드
  autoShutdownEnabled: boolean; // 30분 자동 종료 옵션
  autoShutdownAt: number | null;
  operatorName: string | null; // 시스템을 조작한 사람 (선택적)
}

interface GlobalSystemStore {
  // 상태
  systemInfo: SystemStateInfo;

  // 액션
  startSystem: (operatorName?: string) => Promise<{
    success: boolean;
    message: string;
    state: GlobalSystemState;
  }>;

  stopSystem: (operatorName?: string) => Promise<{
    success: boolean;
    message: string;
    state: GlobalSystemState;
  }>;

  subscribeToSystemState: () => void;
  unsubscribeFromSystemState: () => void;

  // 사용자 세션 관리
  joinSession: () => void;
  leaveSession: () => void;

  // 설정
  toggleAutoShutdown: (enabled: boolean) => void;

  // 상태 조회
  canStartSystem: () => boolean;
  canStopSystem: () => boolean;
  getSystemStatusMessage: () => string;
}

// 초기 상태
const initialSystemInfo: SystemStateInfo = {
  state: 'STOPPED',
  startedAt: null,
  stoppedAt: null,
  activeUsers: 0,
  lastStateChange: Date.now(),
  isManualControl: true, // 기본값: 수동 제어
  autoShutdownEnabled: false, // 기본값: 자동 종료 비활성화
  autoShutdownAt: null,
  operatorName: null,
};

export const useGlobalSystemStore = create<GlobalSystemStore>()(
  subscribeWithSelector((set, get) => {
    let eventSource: EventSource | null = null;
    let sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      systemInfo: initialSystemInfo,

      // 시스템 시작
      startSystem: async (operatorName = '사용자') => {
        const { systemInfo, canStartSystem } = get();

        if (!canStartSystem()) {
          return {
            success: false,
            message: `시스템을 시작할 수 없습니다. 현재 상태: ${systemInfo.state}`,
            state: systemInfo.state,
          };
        }

        try {
          // 서버에 시스템 시작 요청
          const response = await fetch('/api/system/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operatorName,
              sessionId,
              isManualControl: systemInfo.isManualControl,
              autoShutdownEnabled: systemInfo.autoShutdownEnabled,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // 로컬 상태 즉시 업데이트 (서버 응답 대기하지 않고)
            set({
              systemInfo: {
                ...systemInfo,
                state: 'STARTING',
                lastStateChange: Date.now(),
                operatorName,
              },
            });
          }

          return {
            success: result.success,
            message: result.message || '시스템 시작 요청이 처리되었습니다.',
            state: result.success ? 'STARTING' : systemInfo.state,
          };
        } catch (error) {
          console.error('❌ 시스템 시작 요청 실패:', error);
          return {
            success: false,
            message: '서버 연결 오류로 시스템을 시작할 수 없습니다.',
            state: systemInfo.state,
          };
        }
      },

      // 시스템 종료
      stopSystem: async (operatorName = '사용자') => {
        const { systemInfo, canStopSystem } = get();

        if (!canStopSystem()) {
          return {
            success: false,
            message: `시스템을 종료할 수 없습니다. 현재 상태: ${systemInfo.state}`,
            state: systemInfo.state,
          };
        }

        try {
          // 서버에 시스템 종료 요청
          const response = await fetch('/api/system/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operatorName,
              sessionId,
              gracefulShutdown: true, // 안전한 종료
            }),
          });

          const result = await response.json();

          if (result.success) {
            // 로컬 상태 즉시 업데이트
            set({
              systemInfo: {
                ...systemInfo,
                state: 'STOPPING',
                lastStateChange: Date.now(),
                operatorName,
              },
            });
          }

          return {
            success: result.success,
            message: result.message || '시스템 종료 요청이 처리되었습니다.',
            state: result.success ? 'STOPPING' : systemInfo.state,
          };
        } catch (error) {
          console.error('❌ 시스템 종료 요청 실패:', error);
          return {
            success: false,
            message: '서버 연결 오류로 시스템을 종료할 수 없습니다.',
            state: systemInfo.state,
          };
        }
      },

      // 실시간 상태 구독
      subscribeToSystemState: () => {
        if (eventSource) {
          eventSource.close();
        }

        eventSource = new EventSource(
          `/api/system/stream?sessionId=${sessionId}`
        );

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            set({ systemInfo: data });
          } catch (error) {
            console.error('❌ 시스템 상태 파싱 오류:', error);
          }
        };

        eventSource.onerror = error => {
          console.error('❌ 시스템 상태 스트림 오류:', error);
          // 재연결 로직
          setTimeout(() => get().subscribeToSystemState(), 5000);
        };
      },

      // 구독 해제
      unsubscribeFromSystemState: () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      },

      // 세션 관리
      joinSession: () => {
        const { systemInfo } = get();
        set({
          systemInfo: {
            ...systemInfo,
            activeUsers: systemInfo.activeUsers + 1,
          },
        });
      },

      leaveSession: () => {
        const { systemInfo } = get();
        set({
          systemInfo: {
            ...systemInfo,
            activeUsers: Math.max(0, systemInfo.activeUsers - 1),
          },
        });
      },

      // 자동 종료 설정
      toggleAutoShutdown: (enabled: boolean) => {
        const { systemInfo } = get();
        set({
          systemInfo: {
            ...systemInfo,
            autoShutdownEnabled: enabled,
            autoShutdownAt:
              enabled && systemInfo.state === 'RUNNING'
                ? Date.now() + 30 * 60 * 1000
                : null,
          },
        });
      },

      // 상태 확인 메서드들
      canStartSystem: () => {
        const { state } = get().systemInfo;
        return state === 'STOPPED' || state === 'ERROR';
      },

      canStopSystem: () => {
        const { state } = get().systemInfo;
        return state === 'RUNNING' || state === 'STARTING';
      },

      getSystemStatusMessage: () => {
        const { systemInfo } = get();
        const { state, operatorName, lastStateChange } = systemInfo;

        const timeAgo = Math.floor((Date.now() - lastStateChange) / 1000);
        const operator = operatorName || '시스템';

        switch (state) {
          case 'STOPPED':
            return '시스템이 완전히 중지되었습니다. 시작할 수 있습니다.';
          case 'STARTING':
            return `${operator}이(가) 시스템을 시작하는 중입니다... (${timeAgo}초 경과)`;
          case 'RUNNING':
            return `시스템이 정상 동작 중입니다. ${operator}에 의해 시작됨.`;
          case 'STOPPING':
            return `${operator}이(가) 시스템을 안전하게 종료하는 중입니다... (${timeAgo}초 경과)`;
          case 'ERROR':
            return '시스템 오류가 발생했습니다. 관리자에게 문의하세요.';
          default:
            return '시스템 상태를 확인할 수 없습니다.';
        }
      },
    };
  })
);

// 컴포넌트 마운트 시 자동 구독을 위한 훅
export const useSystemStateSubscription = () => {
  const {
    subscribeToSystemState,
    unsubscribeFromSystemState,
    joinSession,
    leaveSession,
  } = useGlobalSystemStore();

  useEffect(() => {
    joinSession();
    subscribeToSystemState();

    return () => {
      leaveSession();
      unsubscribeFromSystemState();
    };
  }, []);
};
