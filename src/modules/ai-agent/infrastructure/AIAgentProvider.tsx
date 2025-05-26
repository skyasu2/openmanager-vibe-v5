'use client';

/**
 * AI Agent Provider
 * 
 * 🚀 React Context 기반 AI 에이전트 상태 관리
 * - 완전한 클라이언트/서버 분리
 * - 타입 안전성
 * - 실시간 상태 동기화
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import AIAgentService, { 
  AIQuery, 
  AIResponse, 
  ThinkingStep,
  AIAgentConfig 
} from './AIAgentService';

// AI 에이전트 상태 인터페이스
interface AIAgentState {
  // 연결 상태
  isConnected: boolean;
  isHealthy: boolean;
  
  // AI 상태
  isProcessing: boolean;
  isThinking: boolean;
  powerMode: 'active' | 'inactive' | 'sleep';
  
  // 대화 상태
  sessionId: string | null;
  currentQuery: string | null;
  lastResponse: AIResponse | null;
  
  // 사고 과정
  thinkingSteps: ThinkingStep[];
  thinkingSessionId: string | null;
  
  // 성능 및 통계
  responseTime: number;
  totalQueries: number;
  successRate: number;
  
  // 에러 상태
  lastError: string | null;
}

// 액션 타입
type AIAgentAction = 
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_HEALTHY'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_THINKING'; payload: boolean }
  | { type: 'SET_POWER_MODE'; payload: 'active' | 'inactive' | 'sleep' }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_CURRENT_QUERY'; payload: string | null }
  | { type: 'SET_LAST_RESPONSE'; payload: AIResponse }
  | { type: 'ADD_THINKING_STEP'; payload: ThinkingStep }
  | { type: 'CLEAR_THINKING_STEPS' }
  | { type: 'SET_THINKING_SESSION_ID'; payload: string | null }
  | { type: 'UPDATE_STATS'; payload: { responseTime: number; success: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// 초기 상태
const initialState: AIAgentState = {
  isConnected: false,
  isHealthy: false,
  isProcessing: false,
  isThinking: false,
  powerMode: 'inactive',
  sessionId: null,
  currentQuery: null,
  lastResponse: null,
  thinkingSteps: [],
  thinkingSessionId: null,
  responseTime: 0,
  totalQueries: 0,
  successRate: 100,
  lastError: null
};

// 리듀서
const aiAgentReducer = (state: AIAgentState, action: AIAgentAction): AIAgentState => {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_HEALTHY':
      return { ...state, isHealthy: action.payload };
    
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    
    case 'SET_THINKING':
      return { ...state, isThinking: action.payload };
    
    case 'SET_POWER_MODE':
      return { ...state, powerMode: action.payload };
    
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    
    case 'SET_CURRENT_QUERY':
      return { ...state, currentQuery: action.payload };
    
    case 'SET_LAST_RESPONSE':
      return { ...state, lastResponse: action.payload };
    
    case 'ADD_THINKING_STEP':
      return { 
        ...state, 
        thinkingSteps: [...state.thinkingSteps, action.payload]
      };
    
    case 'CLEAR_THINKING_STEPS':
      return { ...state, thinkingSteps: [] };
    
    case 'SET_THINKING_SESSION_ID':
      return { ...state, thinkingSessionId: action.payload };
    
    case 'UPDATE_STATS':
      const newTotal = state.totalQueries + 1;
      const successCount = action.payload.success ? 
        Math.floor(state.successRate * state.totalQueries / 100) + 1 :
        Math.floor(state.successRate * state.totalQueries / 100);
      
      return {
        ...state,
        responseTime: action.payload.responseTime,
        totalQueries: newTotal,
        successRate: newTotal > 0 ? (successCount / newTotal) * 100 : 100
      };
    
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
    
    case 'RESET_STATE':
      return { ...initialState, sessionId: state.sessionId };
    
    default:
      return state;
  }
};

// Context 인터페이스
interface AIAgentContextType {
  // 상태
  state: AIAgentState;
  
  // AI 질의 메서드
  queryAI: (query: AIQuery) => Promise<AIResponse>;
  
  // 사고 과정 구독
  subscribeToThinking: (callback: (step: ThinkingStep) => void) => () => void;
  
  // 전원 관리
  activateAI: () => Promise<boolean>;
  deactivateAI: () => Promise<boolean>;
  
  // 상태 관리
  checkHealth: () => Promise<void>;
  resetSession: () => void;
  clearThinking: () => void;
  
  // 서비스 인스턴스 (고급 사용자용)
  service: AIAgentService;
}

// Context 생성
const AIAgentContext = createContext<AIAgentContextType | null>(null);

// Provider Props
interface AIAgentProviderProps {
  children: ReactNode;
  config?: Partial<AIAgentConfig>;
}

// Provider 컴포넌트
export const AIAgentProvider: React.FC<AIAgentProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const [state, dispatch] = useReducer(aiAgentReducer, initialState);
  const service = React.useMemo(() => new AIAgentService(config), [config]);

  // 초기화 및 헬스체크
  useEffect(() => {
    const initialize = async () => {
      try {
        await checkHealth();
        dispatch({ type: 'SET_CONNECTED', payload: true });
        
        // 세션 ID 생성
        const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
        
      } catch (error) {
        console.error('AI Agent initialization failed:', error);
        dispatch({ type: 'SET_ERROR', payload: '초기화 실패' });
      }
    };

    initialize();

    // 정기적 헬스체크 (5분마다)
    const healthInterval = setInterval(checkHealth, 5 * 60 * 1000);
    
    return () => {
      clearInterval(healthInterval);
      service.destroy();
    };
  }, []);

  // AI 질의 처리
  const queryAI = useCallback(async (query: AIQuery): Promise<AIResponse> => {
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'SET_CURRENT_QUERY', payload: query.query });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    const startTime = Date.now();
    
    try {
      // 활동 기록
      await service.recordActivity();
      
      // AI 질의 실행
      const response = await service.query({
        ...query,
        sessionId: query.sessionId || state.sessionId || undefined
      });
      
      const responseTime = Date.now() - startTime;
      
      // 상태 업데이트
      dispatch({ type: 'SET_LAST_RESPONSE', payload: response });
      dispatch({ type: 'UPDATE_STATS', payload: { responseTime, success: response.success } });
      
      // 사고 과정 세션 설정
      if (response.thinkingSessionId) {
        dispatch({ type: 'SET_THINKING_SESSION_ID', payload: response.thinkingSessionId });
      }
      
      if (!response.success && response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
      
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const responseTime = Date.now() - startTime;
      dispatch({ type: 'UPDATE_STATS', payload: { responseTime, success: false } });
      
      // 에러 응답 반환
      return {
        success: false,
        response: '죄송합니다. AI 처리 중 오류가 발생했습니다.',
        mode: 'basic',
        confidence: 0,
        intent: { name: 'error', confidence: 0, entities: {} },
        metadata: {
          processingTime: responseTime,
          timestamp: new Date().toISOString(),
          sessionId: state.sessionId || 'error'
        },
        error: errorMessage
      };
      
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
      dispatch({ type: 'SET_CURRENT_QUERY', payload: null });
    }
  }, [service, state.sessionId]);

  // 사고 과정 구독
  const subscribeToThinking = useCallback((callback: (step: ThinkingStep) => void) => {
    if (!state.thinkingSessionId) {
      console.warn('No thinking session available');
      return () => {};
    }

    dispatch({ type: 'SET_THINKING', payload: true });
    dispatch({ type: 'CLEAR_THINKING_STEPS' });

    const unsubscribe = service.subscribeToThinking(
      state.thinkingSessionId,
      (step: ThinkingStep) => {
        dispatch({ type: 'ADD_THINKING_STEP', payload: step });
        callback(step);
      }
    );

    return () => {
      dispatch({ type: 'SET_THINKING', payload: false });
      unsubscribe();
    };
  }, [service, state.thinkingSessionId]);

  // AI 활성화
  const activateAI = useCallback(async (): Promise<boolean> => {
    try {
      const success = await service.setPowerMode('activate');
      if (success) {
        dispatch({ type: 'SET_POWER_MODE', payload: 'active' });
      }
      return success;
    } catch (error) {
      console.error('AI activation failed:', error);
      return false;
    }
  }, [service]);

  // AI 비활성화
  const deactivateAI = useCallback(async (): Promise<boolean> => {
    try {
      const success = await service.setPowerMode('deactivate');
      if (success) {
        dispatch({ type: 'SET_POWER_MODE', payload: 'inactive' });
      }
      return success;
    } catch (error) {
      console.error('AI deactivation failed:', error);
      return false;
    }
  }, [service]);

  // 헬스체크
  const checkHealth = useCallback(async (): Promise<void> => {
    try {
      const status = await service.getStatus();
      dispatch({ type: 'SET_HEALTHY', payload: status.healthy });
      
      // 전원 모드 동기화
      if (status.mode === 'active') {
        dispatch({ type: 'SET_POWER_MODE', payload: 'active' });
      } else if (status.mode === 'sleep') {
        dispatch({ type: 'SET_POWER_MODE', payload: 'sleep' });
      } else {
        dispatch({ type: 'SET_POWER_MODE', payload: 'inactive' });
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
      dispatch({ type: 'SET_HEALTHY', payload: false });
      dispatch({ type: 'SET_ERROR', payload: '서버 연결 실패' });
    }
  }, [service]);

  // 세션 리셋
  const resetSession = useCallback(() => {
    const newSessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
  }, []);

  // 사고 과정 클리어
  const clearThinking = useCallback(() => {
    dispatch({ type: 'CLEAR_THINKING_STEPS' });
    dispatch({ type: 'SET_THINKING_SESSION_ID', payload: null });
    dispatch({ type: 'SET_THINKING', payload: false });
  }, []);

  const contextValue: AIAgentContextType = {
    state,
    queryAI,
    subscribeToThinking,
    activateAI,
    deactivateAI,
    checkHealth,
    resetSession,
    clearThinking,
    service
  };

  return (
    <AIAgentContext.Provider value={contextValue}>
      {children}
    </AIAgentContext.Provider>
  );
};

// Hook
export const useAIAgent = (): AIAgentContextType => {
  const context = useContext(AIAgentContext);
  if (!context) {
    throw new Error('useAIAgent must be used within an AIAgentProvider');
  }
  return context;
};

export default AIAgentProvider; 