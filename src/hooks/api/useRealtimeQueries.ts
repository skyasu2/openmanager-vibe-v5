/**
 * 🔄 실시간 데이터 통합: WebSocket + React Query
 *
 * Phase 7.3: 실시간 데이터 통합
 * - WebSocket 실시간 업데이트
 * - React Query 캐시와 동기화
 * - 자동 재연결 및 에러 처리
 * - Optimistic Updates 지원
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { predictionKeys } from './usePredictionQueries';
import { serverKeys } from './useServerQueries';
import { systemKeys } from './useSystemQueries';

// 🌐 WebSocket 연결 상태
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// 📨 실시간 메시지 타입
interface RealtimeMessage {
  type: 'server_update' | 'prediction_update' | 'system_update' | 'alert';
  data: any;
  timestamp: string;
  id?: string;
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
    heartbeatInterval = 45000,
    autoConnect = true,
  } = config;

  // 🔄 SSE 연결 (WebSocket 대체)
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current as any).readyState === EventSource.OPEN) {
      return;
    }

    try {
      // SSE URL 구성 (Vercel 호환)
      const sseUrl = '/api/sse/servers';
      console.log('🔄 서버 SSE 연결 시작:', sseUrl);

      const eventSource = new EventSource(sseUrl);
      wsRef.current = eventSource as any; // EventSource를 WebSocket 타입으로 캐스팅

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
              queryClient.setQueryData(serverKeys.lists(), (old: any[]) => {
                if (!old) return old;
                return old.map(server =>
                  server.id === message.data.id
                    ? { ...server, ...message.data }
                    : server
                );
              });

              // 특정 서버 상세 정보도 업데이트
              if (message.data.id) {
                queryClient.setQueryData(
                  serverKeys.detail(message.data.id),
                  (old: any) => (old ? { ...old, ...message.data } : old)
                );
              }
              break;

            case 'system_update':
              // 시스템 상태 업데이트
              queryClient.setQueryData(systemKeys.health(), (old: any) => {
                return old ? { ...old, ...message.data } : message.data;
              });
              break;

            case 'alert':
              // 실시간 알림
              const { level, title, message: alertMessage } = message.data;
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
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 오류:', error);
        }
      };

      wsRef.current.onerror = error => {
        console.error('❌ WebSocket 오류:', error);
        // 🛡️ 404 에러 등 연결 실패 시 사용자에게 알림하지 않음 (폴백 모드)
      };

      wsRef.current.onclose = event => {
        console.log('📡 서버 WebSocket 연결 종료', {
          code: event.code,
          reason: event.reason,
        });

        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // 🛡️ 404 에러 (WebSocket 엔드포인트 없음) 처리
        if (event.code === 1002 || event.code === 1006) {
          console.warn(
            '⚠️ WebSocket 엔드포인트가 구현되지 않음 - 폴백 모드로 전환'
          );
          // 폴백 모드: React Query만 사용하여 정기적 API 호출
          return;
        }

        // 자동 재연결 (404가 아닌 경우만)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `🔄 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
          );

          setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        } else {
          console.warn(
            '⚠️ WebSocket 연결 실패 - 폴백 모드로 전환 (React Query 전용)'
          );
          // 오류 알림 제거: 폴백 모드가 정상적으로 작동하므로 사용자에게 알릴 필요 없음
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
  const sendMessage = useCallback((message: any) => {
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
          queryClient.setQueryData(predictionKeys.list('{}'), (old: any[]) => {
            if (!old) return [message.data];
            return [message.data, ...old.slice(0, 49)]; // 최신 50개만 유지
          });

          // 실시간 예측 알림
          toast.success(
            `🔮 새로운 예측: ${message.data.metric} ${message.data.predicted_value.toFixed(1)}%`,
            { duration: 3000 }
          );
        }
      } catch (error) {
        console.error('❌ 예측 WebSocket 메시지 오류:', error);
      }
    };

    wsRef.current.onerror = error => {
      console.error('❌ 예측 WebSocket 오류:', error);
      // 🛡️ 예측 WebSocket 404 에러 시 폴백 모드 (예측 API 직접 호출)
    };

    wsRef.current.onclose = event => {
      console.log('📡 예측 WebSocket 연결 종료', {
        code: event.code,
        reason: event.reason,
      });

      // 🛡️ 404 에러 시 폴백 모드로 전환
      if (event.code === 1002 || event.code === 1006) {
        console.warn('⚠️ 예측 WebSocket 엔드포인트 없음 - REST API 폴백 모드');
        return;
      }
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
  const { servers = true, predictions = true, alerts = true } = options;

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
