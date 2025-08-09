/**
 * 🔌 VM Backend Hook
 * 
 * VM AI 백엔드 연결 및 상태 관리를 위한 React Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { vmBackendConnector } from '@/services/vm/VMBackendConnector';

interface VMBackendState {
  isEnabled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  health: {
    status: 'healthy' | 'unhealthy' | 'disabled' | 'connecting' | 'error';
    message?: string;
    lastCheck?: Date;
  };
  sessions: Array<{
    id: string;
    userId: string;
    messageCount: number;
    createdAt: Date;
    lastActiveAt: Date;
    summary: string;
  }>;
  currentSession: string | null;
}

interface StreamMetadata {
  sessionId?: string;
  timestamp?: string;
  source?: string;
  [key: string]: unknown;
}

interface StreamData {
  type: 'thinking' | 'result' | 'progress' | 'error';
  content: string;
  metadata?: StreamMetadata;
  progress?: number;
}

interface AnalysisContext {
  sessionId?: string;
  previousQueries?: string[];
  userPreferences?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AnalysisResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: unknown;
  response?: string;
  content?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface StreamCompletionResult {
  response?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface StreamError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UseVMBackendOptions {
  userId?: string;
  autoConnect?: boolean;
  enableHealthCheck?: boolean;
  healthCheckInterval?: number;
}

export function useVMBackend(options: UseVMBackendOptions = {}) {
  const {
    userId = 'anonymous',
    autoConnect = true,
    enableHealthCheck = true,
    healthCheckInterval = 60000, // 1분
  } = options;

  const [state, setState] = useState<VMBackendState>({
    isEnabled: vmBackendConnector.isEnabled,
    isConnected: false,
    isConnecting: false,
    health: { status: 'disabled' },
    sessions: [],
    currentSession: null,
  });

  const [streamData, setStreamData] = useState<StreamData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const healthCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // VM 백엔드 연결
  const connect = useCallback(async (): Promise<boolean> => {
    if (!state.isEnabled) {
      console.log('🔌 VM Backend is disabled');
      return false;
    }

    if (state.isConnected || state.isConnecting) {
      return state.isConnected;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const connected = await vmBackendConnector.connect();
      
      setState(prev => ({
        ...prev,
        isConnected: connected,
        isConnecting: false,
        health: { 
          status: connected ? 'healthy' : 'error',
          message: connected ? 'Connected successfully' : 'Connection failed',
          lastCheck: new Date()
        }
      }));

      if (connected) {
        console.log('✅ VM Backend connected');
        await loadUserSessions();
      }

      return connected;
    } catch (error) {
      console.error('❌ VM Backend connection failed:', error);
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        health: { 
          status: 'error',
          message: error instanceof Error ? error.message : 'Connection failed',
          lastCheck: new Date()
        }
      }));

      return false;
    }
  }, [state.isEnabled, state.isConnected, state.isConnecting, userId]);

  // VM 백엔드 연결 해제
  const disconnect = useCallback(() => {
    vmBackendConnector.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      health: { status: 'disabled' },
      currentSession: null
    }));
    setStreamData([]);
    setIsStreaming(false);
  }, []);

  // 상태 확인
  const checkHealth = useCallback(async () => {
    if (!state.isEnabled) {
      setState(prev => ({
        ...prev,
        health: { status: 'disabled', message: 'VM Backend is disabled' }
      }));
      return;
    }

    try {
      const health = await vmBackendConnector.getHealthStatus();
      
      setState(prev => ({
        ...prev,
        health: {
          status: health.status === 'ok' ? 'healthy' : 'unhealthy',
          message: health.message || health.status,
          lastCheck: new Date()
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        health: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Health check failed',
          lastCheck: new Date()
        }
      }));
    }
  }, [state.isEnabled]);

  // 사용자 세션 로드
  const loadUserSessions = useCallback(async () => {
    if (!state.isConnected) return;

    try {
      const sessions = await vmBackendConnector.getUserSessions(userId);
      // AISession을 VMBackendState.sessions 형식으로 변환
      const mappedSessions = sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        messageCount: session.metadata.messageCount,
        createdAt: session.metadata.createdAt,
        lastActiveAt: session.metadata.lastActiveAt,
        summary: session.summary,
      }));
      setState(prev => ({ ...prev, sessions: mappedSessions }));
    } catch (error) {
      console.error('❌ Failed to load user sessions:', error);
    }
  }, [state.isConnected, userId]);

  // 새 세션 생성
  const createSession = useCallback(async (initialContext?: AnalysisContext): Promise<string | null> => {
    if (!state.isConnected) {
      console.warn('⚠️ VM Backend not connected');
      return null;
    }

    try {
      const session = await vmBackendConnector.createSession(userId, initialContext);
      if (session) {
        // AISession을 VMBackendState.sessions 형식으로 변환
        const mappedSession = {
          id: session.id,
          userId: session.userId,
          messageCount: session.metadata.messageCount,
          createdAt: session.metadata.createdAt,
          lastActiveAt: session.metadata.lastActiveAt,
          summary: session.summary,
        };
        setState(prev => ({ 
          ...prev, 
          currentSession: session.id,
          sessions: [mappedSession, ...prev.sessions]
        }));
        return session.id;
      }
    } catch (error) {
      console.error('❌ Failed to create session:', error);
    }

    return null;
  }, [state.isConnected, userId]);

  // 세션 선택
  const selectSession = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, currentSession: sessionId }));
    vmBackendConnector.subscribeToSession(sessionId);
  }, []);

  // 메시지 전송
  const sendMessage = useCallback(async (content: string, metadata?: StreamMetadata): Promise<boolean> => {
    if (!state.currentSession) {
      console.warn('⚠️ No active session');
      return false;
    }

    try {
      return await vmBackendConnector.addMessage(state.currentSession, {
        role: 'user',
        content,
        metadata
      });
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }, [state.currentSession]);

  // AI 스트리밍 시작
  const startAIStream = useCallback(async (query: string, context?: AnalysisContext): Promise<boolean> => {
    if (!state.isConnected) {
      console.warn('⚠️ VM Backend not connected');
      return false;
    }

    setIsStreaming(true);
    setStreamData([]);

    try {
      return await vmBackendConnector.startAIStream({
        sessionId: state.currentSession || undefined,
        query,
        context
      });
    } catch (error) {
      console.error('❌ Failed to start AI stream:', error);
      setIsStreaming(false);
      return false;
    }
  }, [state.isConnected, state.currentSession]);

  // AI 스트리밍 중지
  const stopAIStream = useCallback(() => {
    vmBackendConnector.stopAIStream();
    setIsStreaming(false);
  }, []);

  // 심층 분석 시작
  const startDeepAnalysis = useCallback(async (
    type: string,
    query: string,
    context?: AnalysisContext
  ): Promise<string | null> => {
    if (!state.isConnected) {
      console.warn('⚠️ VM Backend not connected');
      return null;
    }

    try {
      const job = await vmBackendConnector.startDeepAnalysis(type, query, context);
      return job?.id || null;
    } catch (error) {
      console.error('❌ Failed to start deep analysis:', error);
      return null;
    }
  }, [state.isConnected]);

  // 분석 결과 조회
  const getAnalysisResult = useCallback(async (jobId: string): Promise<AnalysisResult | null> => {
    if (!state.isConnected) return null;

    try {
      return await vmBackendConnector.getAnalysisResult(jobId);
    } catch (error) {
      console.error('❌ Failed to get analysis result:', error);
      return null;
    }
  }, [state.isConnected]);

  // 스트리밍 이벤트 핸들러
  useEffect(() => {
    const handleStreamData = (data: StreamData) => {
      setStreamData(prev => [...prev, data]);
    };

    const handleStreamComplete = (result: StreamCompletionResult) => {
      setIsStreaming(false);
      setStreamData(prev => [...prev, {
        type: 'result',
        content: result.response || result.content || 'Analysis completed',
        metadata: result
      }]);
    };

    const handleStreamError = (error: StreamError) => {
      setIsStreaming(false);
      setStreamData(prev => [...prev, {
        type: 'error',
        content: error.message || 'Stream error occurred',
        metadata: error
      }]);
    };

    vmBackendConnector.on('stream:data', handleStreamData);
    vmBackendConnector.on('stream:complete', handleStreamComplete);
    vmBackendConnector.on('stream:error', handleStreamError);

    return () => {
      vmBackendConnector.off('stream:data', handleStreamData);
      vmBackendConnector.off('stream:complete', handleStreamComplete);
      vmBackendConnector.off('stream:error', handleStreamError);
    };
  }, []);

  // 자동 연결 및 상태 체크
  useEffect(() => {
    if (autoConnect && state.isEnabled && !state.isConnected && !state.isConnecting) {
      connect();
    }
  }, [autoConnect, state.isEnabled, state.isConnected, state.isConnecting, connect]);

  // 정기 상태 체크
  useEffect(() => {
    if (enableHealthCheck && state.isEnabled) {
      checkHealth(); // 즉시 체크

      healthCheckTimer.current = setInterval(checkHealth, healthCheckInterval);

      return () => {
        if (healthCheckTimer.current) {
          clearInterval(healthCheckTimer.current);
        }
      };
    }
    
    // enableHealthCheck가 false이거나 state.isEnabled가 false인 경우 아무것도 반환하지 않음
    return undefined;
  }, [enableHealthCheck, state.isEnabled, checkHealth, healthCheckInterval]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (healthCheckTimer.current) {
        clearInterval(healthCheckTimer.current);
      }
      // 연결은 유지 (다른 컴포넌트에서 사용할 수 있음)
    };
  }, []);

  return {
    // 상태
    ...state,
    isStreaming,
    streamData,
    
    // 연결 관리
    connect,
    disconnect,
    checkHealth,
    
    // 세션 관리
    loadUserSessions,
    createSession,
    selectSession,
    sendMessage,
    
    // AI 기능
    startAIStream,
    stopAIStream,
    startDeepAnalysis,
    getAnalysisResult,
    
    // 유틸리티
    clearStreamData: () => setStreamData([]),
  };
}