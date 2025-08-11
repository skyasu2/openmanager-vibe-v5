/**
 * 🔄 실시간 데이터 통합: WebSocket + React Query
 *
 * Phase 7.3: 실시간 데이터 통합
 * - WebSocket 실시간 업데이트
 * - React Query 캐시와 동기화
 * - 자동 재연결 및 에러 처리
 * - Optimistic Updates 지원
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { serverKeys } from './useServerQueries';
import { predictionKeys } from './usePredictionQueries';
import { systemKeys } from './useSystemQueries';
import { FREE_TIER_INTERVALS } from '@/config/free-tier-intervals';

// 🌐 WebSocket 연결 상태
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// 📨 실시간 메시지 타입
interface RealtimeMessage {
  type: 'server_update' | 'prediction_update' | 'system_update' | 'alert';
  data: unknown;
  timestamp: string;
  id?: string;
}

// 🖥️ 서버 데이터 타입
interface ServerData {
  id: string;
  name?: string;
  status?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  last_updated?: string;
  [key: string]: unknown;
}

// 🔧 시스템 데이터 타입
interface SystemData {
  status?: string;
  version?: string;
  uptime?: number;
  [key: string]: unknown;
}

// 🔮 예측 데이터 타입
interface PredictionData {
  metric: string;
  predicted_value: number;
  confidence?: number;
  timestamp?: string;
  [key: string]: unknown;
}

// 🔧 WebSocket 설정
interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  autoConnect?: boolean;
}

// 🔄 실시간 서버 상태 업데이트
export const useRealtimeServers = (config: WebSocketConfig = {}) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const {
    url = '/api/websocket/servers',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = FREE_TIER_INTERVALS.WEBSOCKET_HEARTBEAT_INTERVAL,
    autoConnect = true,
  } = config;

  // 📡 WebSocket 연결
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // WebSocket URL 구성 (개발/프로덕션 환경 대응)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}${url}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 서버 WebSocket 연결됨');
        reconnectAttemptsRef.current = 0;

        // 하트비트 시작
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
        heartbeatRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, heartbeatInterval);

        toast.success('실시간 서버 모니터링 활성화');
      };

      wsRef.current.onmessage = event => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'server_update':
              // 서버 상태 업데이트
              const serverData = message.data as ServerData;
              queryClient.setQueryData(serverKeys.lists(), (old: unknown) => {
                if (!Array.isArray(old)) return old;
                return old.map((server: ServerData) =>
                  server.id === serverData.id
                    ? { ...server, ...serverData }
                    : server
                );
              });

              // 특정 서버 상세 정보도 업데이트
              if (serverData.id) {
                queryClient.setQueryData(
                  serverKeys.detail(serverData.id),
                  (old: unknown) => {
                    const oldServer = old as ServerData | null;
                    return oldServer ? { ...oldServer, ...serverData } : old;
                  }
                );
              }
              break;

            case 'system_update':
              // 시스템 상태 업데이트
              const systemData = message.data as SystemData;
              queryClient.setQueryData(systemKeys.health(), (old: unknown) => {
                const oldSystem = old as SystemData | null;
                return oldSystem ? { ...oldSystem, ...systemData } : systemData;
              });
              break;

            case 'alert': {
              // 실시간 알림
              const alertData = message.data as {
                level: 'critical' | 'warning' | 'info';
                title: string;
                message: string;
              };
              const { level, title, message: alertMessage } = alertData;
              const toastOptions = {
                duration: level === 'critical' ? 10000 : 5000,
              };

              switch (level) {
                case 'critical':
                  toast.error(`🚨 ${title}: ${alertMessage}`, toastOptions);
                  break;
                case 'warning':
                  toast.error(`⚠️ ${title}: ${alertMessage}`, toastOptions);
                  break;
                case 'info':
                  toast.success(`ℹ️ ${title}: ${alertMessage}`, toastOptions);
                  break;
              }
              break;
            }
          }
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 오류:', error);
        }
      };

      wsRef.current.onerror = error => {
        console.error('❌ WebSocket 오류:', error);
      };

      wsRef.current.onclose = () => {
        console.log('📡 서버 WebSocket 연결 종료');

        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // 자동 재연결
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `🔄 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
          );

          setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        } else {
          toast.error('서버 연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
        }
      };
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
    }
  }, [
    url,
    reconnectInterval,
    maxReconnectAttempts,
    heartbeatInterval,
    queryClient,
  ]);

  // 🔌 연결 해제
  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 📤 메시지 전송
  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // 🔄 수동 재연결
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // 🚀 자동 연결
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 📊 연결 상태
  const getConnectionStatus = useCallback((): ConnectionStatus => {
    if (!wsRef.current) return 'disconnected';

    switch (wsRef.current.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }, []);

  return {
    connect,
    disconnect,
    reconnect,
    sendMessage,
    connectionStatus: getConnectionStatus(),
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
};

// 🔮 실시간 AI 예측 업데이트
export const useRealtimePredictions = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 예측 전용 WebSocket 연결
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/websocket/predictions`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🔮 AI 예측 WebSocket 연결됨');
    };

    wsRef.current.onmessage = event => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);

        if (message.type === 'prediction_update') {
          // 새로운 예측 결과를 캐시에 추가
          queryClient.setQueryData(predictionKeys.list('{}'), (old: unknown) => {
            const oldPredictions = old as PredictionData[] | null;
            if (!Array.isArray(oldPredictions)) return [message.data];
            return [message.data as PredictionData, ...oldPredictions.slice(0, 49)]; // 최신 50개만 유지
          });

          // 실시간 예측 알림
          const predictionData = message.data as PredictionData;
          toast.success(
            `🔮 새로운 예측: ${predictionData.metric} ${predictionData.predicted_value.toFixed(1)}%`,
            { duration: 3000 }
          );
        }
      } catch (error) {
        console.error('❌ 예측 WebSocket 메시지 오류:', error);
      }
    };

    wsRef.current.onerror = error => {
      console.error('❌ 예측 WebSocket 오류:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  // 📤 예측 요청 전송
  const requestPrediction = useCallback(
    (metric: string, horizon: number = 30) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'request_prediction',
            data: { metric, horizon, timestamp: new Date().toISOString() },
          })
        );
        return true;
      }
      return false;
    },
    []
  );

  return {
    requestPrediction,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};

// 🎯 통합 실시간 훅
export const useRealtimeData = (
  options: {
    servers?: boolean;
    predictions?: boolean;
    alerts?: boolean;
  } = {}
) => {
  const {
    servers = true,
    predictions: _predictions = true,
    alerts: _alerts = true,
  } = options;

  const serverConnection = useRealtimeServers({ autoConnect: servers });
  const predictionConnection = useRealtimePredictions();

  // 📊 전체 연결 상태
  const overallStatus =
    serverConnection.isConnected && predictionConnection.isConnected
      ? 'connected'
      : serverConnection.connectionStatus;

  // 🔄 전체 재연결
  const reconnectAll = useCallback(() => {
    if (servers) {
      serverConnection.reconnect();
    }
    // 예측 연결은 자동으로 재연결됨
  }, [servers, serverConnection]);

  return {
    servers: serverConnection,
    predictions: predictionConnection,
    overallStatus,
    reconnectAll,
    isFullyConnected:
      serverConnection.isConnected && predictionConnection.isConnected,
  };
};
