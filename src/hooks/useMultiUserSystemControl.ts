/**
 * 다중 사용자 시스템 제어 Hook
 *
 * 분산 락을 사용한 안전한 시스템 제어
 * - 실시간 상태 동기화
 * - 대기열 관리
 * - 브라우저 알림
 */

export type SystemControlAction = 'start' | 'stop' | 'restart' | 'maintenance';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SystemControlState {
  // 시스템 상태
  systemState: string;
  isLoading: boolean;
  error: string | null;

  // 락 상태
  isLocked: boolean;
  canControl: boolean;
  currentController: {
    userName: string;
    action: SystemControlAction;
    acquiredAt: number;
    expiresAt: number;
    remainingTime: number;
  } | null;

  // 대기열 상태
  queue: {
    length: number;
    estimatedWaitTime: number;
  };

  // 사용자 대기 상태
  isWaiting: boolean;
  waitingPosition?: number;
  userEstimatedWaitTime?: number;
}

interface SystemControlActions {
  // 시스템 제어
  startSystem: () => Promise<boolean>;
  stopSystem: () => Promise<boolean>;
  restartSystem: () => Promise<boolean>;
  maintenanceMode: () => Promise<boolean>;

  // 상태 관리
  refreshStatus: () => Promise<void>;
  cancelWaiting: () => void;

  // 관리자 기능
  forceUnlock: (adminKey: string) => Promise<boolean>;
}

interface UseMultiUserSystemControlOptions {
  userId?: string;
  userName?: string;
  sessionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNotifications?: boolean;
  isAdmin?: boolean;
  adminKey?: string;
}

export function useMultiUserSystemControl(
  options: UseMultiUserSystemControlOptions = {}
): [SystemControlState, SystemControlActions] {
  const {
    userId = 'anonymous',
    userName = '익명 사용자',
    sessionId = 'session_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substr(2, 9),
    autoRefresh = true,
    refreshInterval = 5000, // 5초마다
    enableNotifications = true,
    isAdmin = false,
    adminKey,
  } = options;

  // 상태 관리
  const [state, setState] = useState<SystemControlState>({
    systemState: 'UNKNOWN',
    isLoading: false,
    error: null,
    isLocked: false,
    canControl: true,
    currentController: null,
    queue: { length: 0, estimatedWaitTime: 0 },
    isWaiting: false,
  });

  // 자동 새로고침 타이머
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);

  /**
   * 시스템 제어 상태 조회
   */
  const refreshStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(
        '/api/system/control?sessionId=' + sessionId,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('상태 조회 실패: ' + response.statusText);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          systemState: result.data.systemState,
          isLocked: result.data.lockInfo.isLocked,
          canControl: result.data.canControl,
          currentController: result.data.lockInfo.currentController,
          queue: result.data.lockInfo.queue,
          isLoading: false,
        }));
      } else {
        throw new Error(result.message || '상태 조회 실패');
      }
    } catch (error) {
      console.error('시스템 상태 조회 실패:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }));
    }
  }, [sessionId]);

  /**
   * 시스템 제어 실행
   */
  const executeSystemControl = useCallback(
    async (action: SystemControlAction): Promise<boolean> => {
      try {
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
          isWaiting: false,
        }));

        // 요청 제한 (2초 내 중복 요청 방지)
        const now = Date.now();
        if (now - lastRequestTime.current < 2000) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: '너무 빠른 요청입니다. 잠시 후 다시 시도해주세요.',
          }));
          return false;
        }
        lastRequestTime.current = now;

        const response = await fetch('/api/system/control', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            userId,
            userName,
            sessionId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // 성공
          setState(prev => ({
            ...prev,
            isLoading: false,
            canControl: true,
            isWaiting: false,
          }));

          // 성공 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('시스템 ' + action + ' 성공', {
              body: '시스템 ' + action + ' 명령이 성공적으로 실행되었습니다.',
              icon: '/favicon.ico',
            });
          }

          // 상태 새로고침
          setTimeout(refreshStatus, 1000);

          return true;
        } else if (response.status === 423) {
          // 대기열에 추가됨 (423 Locked)
          setState(prev => ({
            ...prev,
            isLoading: false,
            isWaiting: true,
            waitingPosition: result.data?.waitingPosition,
            userEstimatedWaitTime: result.data?.estimatedWaitTime,
            error: null,
          }));

          // 대기열 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('시스템 제어 대기 중', {
              body:
                '대기열 ' +
                result.data?.waitingPosition +
                '번째, 예상 대기시간: ' +
                Math.round((result.data?.estimatedWaitTime || 0) / 1000) +
                '초',
              icon: '/favicon.ico',
            });
          }

          // 대기 중 상태 새로고침 (더 자주)
          if (refreshTimer.current) clearInterval(refreshTimer.current);
          refreshTimer.current = setInterval(refreshStatus, 2000);

          return false;
        } else {
          // 오류
          throw new Error(result.message || result.error || '시스템 제어 실패');
        }
      } catch (error) {
        console.error('시스템 ' + action + ' 실패:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          isWaiting: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }));
        return false;
      }
    },
    [userId, userName, sessionId, enableNotifications, refreshStatus]
  );

  /**
   * 시스템 시작
   */
  const startSystem = useCallback(
    () => executeSystemControl('start'),
    [executeSystemControl]
  );

  /**
   * 시스템 중지
   */
  const stopSystem = useCallback(
    () => executeSystemControl('stop'),
    [executeSystemControl]
  );

  /**
   * 시스템 재시작
   */
  const restartSystem = useCallback(
    () => executeSystemControl('restart'),
    [executeSystemControl]
  );

  /**
   * 유지보수 모드
   */
  const maintenanceMode = useCallback(
    () => executeSystemControl('maintenance'),
    [executeSystemControl]
  );

  /**
   * ❌ 대기 취소
   */
  const cancelWaiting = useCallback(() => {
    setState(prev => ({
      ...prev,
      isWaiting: false,
      waitingPosition: undefined,
      userEstimatedWaitTime: undefined,
    }));

    // 정상 새로고침 간격으로 복구
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (autoRefresh) {
      refreshTimer.current = setInterval(refreshStatus, refreshInterval);
    }
  }, [autoRefresh, refreshInterval, refreshStatus]);

  /**
   * 강제 락 해제 (관리자 전용)
   */
  const forceUnlock = useCallback(
    async (adminKey: string): Promise<boolean> => {
      try {
        const response = await fetch(
          '/api/system/control?adminKey=' + adminKey,
          {
            method: 'DELETE',
          }
        );

        const result = await response.json();

        if (result.success) {
          // 성공 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('강제 락 해제 완료', {
              body: '시스템 제어 락이 강제로 해제되었습니다.',
              icon: '/favicon.ico',
            });
          }

          // 상태 새로고침
          setTimeout(refreshStatus, 500);
          return true;
        } else {
          throw new Error(result.message || '강제 락 해제 실패');
        }
      } catch (error) {
        console.error('강제 락 해제 실패:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '강제 락 해제 실패',
        }));
        return false;
      }
    },
    [enableNotifications, refreshStatus]
  );

  // 초기화 및 자동 새로고침
  useEffect(() => {
    // 초기 상태 조회
    refreshStatus();

    // 브라우저 알림 권한 요청
    if (
      enableNotifications &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }

    // 자동 새로고침 설정
    if (autoRefresh && !state.isWaiting) {
      refreshTimer.current = setInterval(refreshStatus, refreshInterval);
    }

    // 정리
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [
    autoRefresh,
    refreshInterval,
    enableNotifications,
    state.isWaiting,
    refreshStatus,
  ]);

  // 대기 상태 변경 시 새로고침 간격 조정
  useEffect(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
    }

    if (autoRefresh) {
      const interval = state.isWaiting ? 2000 : refreshInterval; // 대기 중일 때 더 자주
      refreshTimer.current = setInterval(refreshStatus, interval);
    }
  }, [state.isWaiting, autoRefresh, refreshInterval, refreshStatus]);

  return [
    state,
    {
      startSystem,
      stopSystem,
      restartSystem,
      maintenanceMode,
      refreshStatus,
      cancelWaiting,
      forceUnlock,
    },
  ];
}
