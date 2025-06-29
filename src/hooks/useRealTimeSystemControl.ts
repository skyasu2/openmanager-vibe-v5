/**
 * 🌐 실시간 시스템 상태 공유 Hook v3
 *
 * SSE 기반 실시간 상태 공유
 * - 모든 사용자가 자유롭게 시스템 제어
 * - 실시간 상태 브로드캐스트
 * - 제어 히스토리 추적
 * - 베르셀 환경 최적화
 */

import { systemLogger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SystemControlAction = 'start' | 'stop' | 'restart' | 'maintenance';

export interface SystemAction {
  id: string;
  action: SystemControlAction;
  userId: string;
  userName: string;
  clientIP: string;
  timestamp: string;
  status: 'executing' | 'completed' | 'failed';
  message?: string;
  duration?: number;
}

export interface ConnectedUser {
  userId: string;
  userName: string;
  clientIP: string;
  connectedAt: string;
}

export interface RealTimeSystemState {
  // 시스템 상태
  systemState:
    | 'STARTING'
    | 'RUNNING'
    | 'STOPPING'
    | 'STOPPED'
    | 'ERROR'
    | 'MAINTENANCE';
  lastAction?: SystemAction;
  recentActions: SystemAction[];
  connectedUsers: ConnectedUser[];
  uptime: number;
  lastUpdate: string;

  // 연결 상태
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RealTimeSystemActions {
  // 시스템 제어
  startSystem: () => Promise<boolean>;
  stopSystem: () => Promise<boolean>;
  restartSystem: () => Promise<boolean>;
  maintenanceMode: () => Promise<boolean>;

  // 상태 관리
  refreshStatus: () => Promise<void>;

  // 연결 관리
  connect: () => void;
  disconnect: () => void;
}

export interface UseRealTimeSystemControlOptions {
  userId?: string;
  userName?: string;
  enableNotifications?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

/**
 * 실시간 시스템 상태 공유 Hook
 */
export function useRealTimeSystemControl(
  options: UseRealTimeSystemControlOptions = {}
): [RealTimeSystemState, RealTimeSystemActions] {
  const {
    userId = 'user_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substr(2, 9),
    userName = '익명 사용자',
    enableNotifications = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
  } = options;

  // 상태 관리
  const [state, setState] = useState<RealTimeSystemState>({
    systemState: 'STOPPED',
    recentActions: [],
    connectedUsers: [],
    uptime: 0,
    lastUpdate: new Date().toISOString(),
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // SSE 연결 관리
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 🔗 SSE 연결 시작
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/system/realtime?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`
    );

    eventSource.onopen = () => {
      systemLogger.info(`📡 SSE 연결 성공: ${userName}`);
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      reconnectAttemptRef.current = 0;

      // 연결 성공 알림
      if (
        enableNotifications &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('실시간 시스템 상태 연결', {
          body: '실시간 시스템 상태 스트림에 연결되었습니다.',
          icon: '/favicon.ico',
        });
      }
    };

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            systemLogger.info('📡 SSE 연결 확인:', data.message);
            break;

          case 'state_update':
            setState(prev => ({
              ...prev,
              systemState: data.data.systemState,
              lastAction: data.data.lastAction,
              recentActions: data.data.recentActions,
              connectedUsers: data.data.connectedUsers,
              uptime: data.data.uptime,
              lastUpdate: data.data.lastUpdate,
            }));

            // 상태 변경 알림 (중요한 변경만)
            if (
              enableNotifications &&
              data.data.lastAction &&
              data.data.lastAction.status === 'completed' &&
              data.data.lastAction.userId !== userId
            ) {
              if (
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                new Notification('시스템 상태 변경', {
                  body: `${data.data.lastAction.userName}님이 시스템을 ${data.data.lastAction.action}했습니다.`,
                  icon: '/favicon.ico',
                });
              }
            }
            break;

          case 'heartbeat':
            // Heartbeat - 연결 유지 확인
            break;

          default:
            systemLogger.warn('알 수 없는 SSE 메시지 타입:', data.type);
        }
      } catch (error) {
        systemLogger.error('SSE 메시지 파싱 실패:', error);
      }
    };

    eventSource.onerror = error => {
      systemLogger.error('SSE 연결 오류:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: 'SSE 연결이 끊어졌습니다.',
      }));

      eventSource.close();

      // 자동 재연결
      if (autoReconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
        reconnectAttemptRef.current++;
        const retryDelay = Math.min(
          1000 * Math.pow(2, reconnectAttemptRef.current),
          30000
        );

        systemLogger.info(
          `🔄 SSE 재연결 시도 ${reconnectAttemptRef.current}/${maxReconnectAttempts} (${retryDelay}ms 후)`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, retryDelay);
      }
    };

    eventSourceRef.current = eventSource;
  }, [
    userId,
    userName,
    enableNotifications,
    autoReconnect,
    maxReconnectAttempts,
  ]);

  /**
   * ❌ SSE 연결 해제
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
    systemLogger.info(`📡 SSE 연결 해제: ${userName}`);
  }, [userName]);

  /**
   * 🔄 시스템 상태 새로고침
   */
  const refreshStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(
        `/api/system/control?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`,
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
          lastAction: result.data.lastAction,
          recentActions: result.data.recentActions,
          connectedUsers: result.data.connectedUsers,
          lastUpdate: result.data.timestamp,
          isLoading: false,
        }));
      } else {
        throw new Error(result.message || '상태 조회 실패');
      }
    } catch (error) {
      systemLogger.error('시스템 상태 조회 실패:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }));
    }
  }, [userId, userName]);

  /**
   * 🎯 시스템 제어 실행
   */
  const executeSystemControl = useCallback(
    async (action: SystemControlAction): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/system/control', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            userId,
            userName,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setState(prev => ({ ...prev, isLoading: false }));

          // 성공 알림
          if (
            enableNotifications &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('시스템 제어 성공', {
              body: `시스템 ${action} 명령이 실행되었습니다.`,
              icon: '/favicon.ico',
            });
          }

          systemLogger.info(`✅ 시스템 ${action} 성공: ${userName}`);
          return true;
        } else {
          throw new Error(result.message || '시스템 제어 실패');
        }
      } catch (error) {
        systemLogger.error(`❌ 시스템 ${action} 실패:`, error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }));

        // 오류 알림
        if (
          enableNotifications &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('시스템 제어 실패', {
            body: `시스템 ${action} 실행 중 오류가 발생했습니다.`,
            icon: '/favicon.ico',
          });
        }

        return false;
      }
    },
    [userId, userName, enableNotifications]
  );

  /**
   * 🚀 시스템 시작
   */
  const startSystem = useCallback(
    () => executeSystemControl('start'),
    [executeSystemControl]
  );

  /**
   * 🛑 시스템 중지
   */
  const stopSystem = useCallback(
    () => executeSystemControl('stop'),
    [executeSystemControl]
  );

  /**
   * 🔄 시스템 재시작
   */
  const restartSystem = useCallback(
    () => executeSystemControl('restart'),
    [executeSystemControl]
  );

  /**
   * 🔧 유지보수 모드
   */
  const maintenanceMode = useCallback(
    () => executeSystemControl('maintenance'),
    [executeSystemControl]
  );

  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    connect();

    // 브라우저 알림 권한 요청
    if (
      enableNotifications &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          systemLogger.info('브라우저 알림 권한 허용됨');
        }
      });
    }

    // 정리 함수
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enableNotifications]);

  // 상태와 액션 반환
  return [
    state,
    {
      startSystem,
      stopSystem,
      restartSystem,
      maintenanceMode,
      refreshStatus,
      connect,
      disconnect,
    },
  ];
}

export default useRealTimeSystemControl;
