/**
 * 🔄 실시간 AI 로그 React 훅
 *
 * Server-Sent Events를 통한 실시간 AI 로그 수신
 * - 자동 재연결
 * - 세션별 필터링
 * - 로그 버퍼 관리
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RealTimeAILog {
  id: string;
  timestamp: string;
  level:
    | 'INFO'
    | 'DEBUG'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'ERROR'
    | 'WARNING'
    | 'ANALYSIS';
  engine: string;
  module: string;
  message: string;
  details?: string;
  progress?: number;
  sessionId: string;
  metadata?: {
    processingTime?: number;
    confidence?: number;
    algorithm?: string;
    technology?: string;
    openSource?: string;
    apiCall?: boolean;
    cacheHit?: boolean;
    [key: string]: unknown;
  };
}

interface UseRealTimeAILogsOptions {
  sessionId?: string;
  mode?: 'sidebar' | 'admin';
  maxLogs?: number;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

interface UseRealTimeAILogsReturn {
  logs: RealTimeAILog[];
  isConnected: boolean;
  isProcessing: boolean;
  currentEngine: string;
  techStack: Set<string>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  clearLogs: () => void;
  reconnect: () => void;
  addManualLog: (log: Partial<RealTimeAILog>) => Promise<void>;
}

export const useRealTimeAILogs = (
  options: UseRealTimeAILogsOptions = {}
): UseRealTimeAILogsReturn => {
  const {
    sessionId,
    mode = 'sidebar',
    maxLogs = 50,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [logs, setLogs] = useState<RealTimeAILog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEngine, setCurrentEngine] = useState<string>('');
  const [techStack, setTechStack] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // EventSource 연결 함수
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');

    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    params.append('mode', mode);

    const url = `/api/ai/logging/stream?${params.toString()}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      console.log('AI 로그 스트림 연결됨');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 연결 메시지 처리
        if (data.type === 'connection') {
          console.log('AI 로그 스트림 초기화:', data.message);
          return;
        }

        // 핑 메시지 처리
        if (data.type === 'ping') {
          return;
        }

        // 실제 로그 처리
        const log: RealTimeAILog = data;

        setLogs((prev) => {
          const newLogs = [...prev, log];
          return newLogs.slice(-maxLogs); // 최대 로그 수 제한
        });

        // 현재 엔진 업데이트
        setCurrentEngine(log.engine);

        // 기술 스택 업데이트
        const technology = log.metadata?.technology;
        if (typeof technology === 'string' && technology.length > 0) {
          setTechStack((prev) => new Set([...prev, technology]));
        }
        const openSource = log.metadata?.openSource;
        if (typeof openSource === 'string' && openSource.length > 0) {
          setTechStack((prev) => new Set([...prev, openSource]));
        }

        // 처리 상태 업데이트
        if (log.level === 'PROCESSING') {
          setIsProcessing(true);
        } else if (log.level === 'SUCCESS' || log.level === 'ERROR') {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('로그 파싱 오류:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('AI 로그 스트림 오류:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      eventSource.close();

      // 자동 재연결
      if (
        autoReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        reconnectAttemptsRef.current++;
        console.log(
          `AI 로그 스트림 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else {
        setConnectionStatus('disconnected');
      }
    };

    eventSourceRef.current = eventSource;
  }, [sessionId, mode, maxLogs, autoReconnect, reconnectDelay]);

  // 수동 재연결
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // 로그 초기화
  const clearLogs = useCallback(() => {
    setLogs([]);
    setTechStack(new Set());
    setCurrentEngine('');
    setIsProcessing(false);
  }, []);

  // 수동 로그 추가
  const addManualLog = useCallback(
    async (logData: Partial<RealTimeAILog>) => {
      try {
        const response = await fetch('/api/ai/logging/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId || 'manual',
            engine: logData.engine || 'manual',
            message: logData.message || 'Manual log entry',
            level: logData.level || 'INFO',
            metadata: logData.metadata,
          }),
        });

        if (!response.ok) {
          throw new Error('수동 로그 추가 실패');
        }

        const result = await response.json();
        console.log('수동 로그 추가됨:', result);
      } catch (error) {
        console.error('수동 로그 추가 오류:', error);
        throw error;
      }
    },
    [sessionId]
  );

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // connect 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  // sessionId 변경 시 재연결
  useEffect(() => {
    if (isConnected) {
      clearLogs();
      reconnect();
    }
  }, [sessionId, isConnected]); // clearLogs, reconnect 함수 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  return {
    logs,
    isConnected,
    isProcessing,
    currentEngine,
    techStack,
    connectionStatus,
    clearLogs,
    reconnect,
    addManualLog,
  };
};
