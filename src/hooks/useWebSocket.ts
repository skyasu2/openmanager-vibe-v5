/**
 * 🔗 useWebSocket Hook
 *
 * 실시간 서버 메트릭 스트림을 위한 React Hook
 * - 자동 연결/재연결
 * - 구독 관리
 * - 상태 추적
 * - TypeScript 지원
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

// 🎯 타입 정의
export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  debug?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionCount: number;
  lastPing: Date | null;
  error: string | null;
}

export interface MetricsData {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  requests?: number;
  errors?: number;
  [key: string]: number | undefined;
}

export interface StreamData {
  serverId: string;
  data: MetricsData;
  timestamp: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertData {
  serverId: string;
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  activeServers: number;
  totalAlerts: number;
  timestamp: string;
  services?: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
    };
  };
}

export const useWebSocket = (config: WebSocketConfig = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_NODE_ENV ||
    process.env.NODE_ENV === 'production'
      ? 'https://openmanager-ai-engine.onrender.com'
      : 'http://localhost:3000',
    autoConnect = true,
    reconnectAttempts = 5,
    debug = false,
  } = config;

  // 🔄 상태 관리
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionCount: 0,
    lastPing: null,
    error: null,
  });

  const [serverMetrics, setServerMetrics] = useState<StreamData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [latestMetric, setLatestMetric] = useState<StreamData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // 🔗 Socket 참조
  const socketRef = useRef<Socket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const reconnectCountRef = useRef(0);

  /**
   * 📡 WebSocket 연결
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      if (debug) console.log('🔗 이미 연결됨');
      return;
    }

    setConnectionState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      const socket = socketRef.current;

      // 연결 성공
      socket.on('connect', () => {
        setConnectionState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          lastPing: new Date(),
          error: null,
        }));
        reconnectCountRef.current = 0;

        if (debug) console.log('✅ WebSocket 연결 성공:', socket.id);

        // 기존 구독 복원
        subscriptionsRef.current.forEach((streamType) => {
          socket.emit('subscribe', { streamType, clientId: socket.id });
        });

        // 현재 상태 요청
        socket.emit('request-current-status');
      });

      // 연결 실패
      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket 연결 실패:', error);
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: error.message,
        }));
      });

      // 연결 해제
      socket.on('disconnect', (reason) => {
        setConnectionState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        if (debug) console.log('🔌 연결 해제:', reason);

        // 자동 재연결 시도
        if (
          reason !== 'io client disconnect' &&
          reconnectCountRef.current < reconnectAttempts
        ) {
          reconnectCountRef.current++;
          setTimeout(connect, 2000 * reconnectCountRef.current);
        }
      });

      // 🎉 환영 메시지
      socket.on('welcome', (message) => {
        if (debug) console.log('🎉 환영 메시지:', message);
      });

      // 📊 현재 상태
      socket.on('current-status', (status) => {
        setSystemStatus(status);
        setConnectionState((prev) => ({
          ...prev,
          connectionCount: status.connectionCount,
        }));

        if (debug) console.log('📊 시스템 상태:', status);
      });

      // 📈 서버 메트릭 스트림
      socket.on('server-metrics', (data: StreamData) => {
        setLatestMetric(data);
        setServerMetrics((prev) => {
          const newMetrics = [data, ...prev].slice(0, 100); // 최대 100개만 유지
          return newMetrics;
        });

        if (debug) console.log('📈 메트릭 수신:', data.serverId, data.data.cpu);
      });

      // 🚨 알림 스트림
      socket.on('alerts', (alert: AlertData) => {
        setAlerts((prev) => {
          const newAlerts = [alert, ...prev].slice(0, 50); // 최대 50개만 유지
          return newAlerts;
        });

        if (debug) console.log('🚨 알림 수신:', alert.message);

        // 실시간 알림만 처리 (브라우저 웹 알림 제거됨)
      });
    } catch (error) {
      console.error('❌ WebSocket 연결 중 오류:', error);
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, [url, reconnectAttempts]); // debug 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  /**
   * 🔌 연결 해제
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));

    if (debug) console.log('🔌 수동 연결 해제');
  }, []); // debug 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  /**
   * 📝 스트림 구독
   */
  const subscribe = useCallback(
    (streamType: string) => {
      if (!socketRef.current?.connected) {
        if (debug)
          console.warn('⚠️ 연결되지 않은 상태에서 구독 시도:', streamType);
        return;
      }

      subscriptionsRef.current.add(streamType);
      socketRef.current.emit('subscribe', {
        streamType,
        clientId: socketRef.current.id,
      });

      if (debug) console.log('📝 구독 추가:', streamType);
    },
    [debug]
  );

  /**
   * 📝 구독 해제
   */
  const unsubscribe = useCallback(
    (streamType: string) => {
      if (!socketRef.current?.connected) return;

      subscriptionsRef.current.delete(streamType);
      socketRef.current.emit('unsubscribe', streamType);

      if (debug) console.log('📝 구독 해제:', streamType);
    },
    [debug]
  );

  /**
   * 🔄 상태 새로고침
   */
  const refreshStatus = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request-current-status');
    }
  }, []);

  /**
   * 🧹 데이터 정리
   */
  const clearData = useCallback(() => {
    setServerMetrics([]);
    setAlerts([]);
    setLatestMetric(null);
  }, []);

  // 🎬 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // 브라우저 웹 알림 기능 제거됨

    return () => {
      disconnect();
    };
  }, [autoConnect]); // connect, disconnect 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  // 📊 유용한 계산된 값들
  const stats = {
    totalMetrics: serverMetrics.length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.priority === 'critical').length,
    highPriorityAlerts: alerts.filter((a) => a.priority === 'high').length,
    uniqueServers: new Set(serverMetrics.map((m) => m.serverId)).size,
    lastUpdate: latestMetric?.timestamp
      ? new Date(latestMetric.timestamp)
      : null,
  };

  return {
    // 연결 상태
    connectionState,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,

    // 데이터
    serverMetrics,
    alerts,
    latestMetric,
    systemStatus,
    stats,

    // 액션
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    refreshStatus,
    clearData,

    // 현재 구독 목록
    subscriptions: Array.from(subscriptionsRef.current),
  };
};

/**
 * 🎯 특정 서버만 모니터링하는 Hook
 */
export const useServerWebSocket = (
  serverId: string,
  config?: WebSocketConfig
) => {
  const websocket = useWebSocket(config);

  // 특정 서버의 메트릭만 필터링
  const serverMetrics = websocket.serverMetrics.filter(
    (m) => m.serverId === serverId
  );
  const serverAlerts = websocket.alerts.filter((a) => a.serverId === serverId);
  const latestServerMetric =
    websocket.latestMetric?.serverId === serverId
      ? websocket.latestMetric
      : null;

  useEffect(() => {
    if (websocket.isConnected) {
      websocket.subscribe('server-metrics');
      websocket.subscribe('alerts');
    }
  }, []); // websocket 함수 참조 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  return {
    ...websocket,
    serverMetrics,
    serverAlerts,
    latestServerMetric,
    serverId,
  };
};
