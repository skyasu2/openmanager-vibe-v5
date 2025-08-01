/**
 * 🎯 AI 세션 관리 훅 v1.0
 *
 * ✅ AI 응답 상태 유지
 * ✅ Thinking Process 실시간 추적
 * ✅ 세션 기반 대화 이력 관리
 * ✅ 로컬 스토리지 + Supabase 하이브리드
 */

import type { AISessionData, AISessionSummary } from '@/lib/ai-session-storage';
import { getAISessionStorage } from '@/lib/ai-session-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// ==============================================
// 🎯 AI 세션 상태 타입 정의
// ==============================================

export interface AISessionState {
  sessionId: string | null;
  currentQuery: string;
  currentResponse: string;
  mode: 'LOCAL' | 'GOOGLE_ONLY';
  isLoading: boolean;
  error: string | null;
  confidence: number;
  enginePath: string[];
  thinkingProcess: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: number;
  }>;
  reasoningSteps: string[];
  history: AISessionSummary[];
  metadata: Record<string, any>;
}

export interface AISessionOptions {
  enableHistory?: boolean;
  maxHistoryItems?: number;
  autoSave?: boolean;
  persistToSupabase?: boolean;
}

// ==============================================
// 🎣 AI 세션 관리 훅
// ==============================================

export function useAISession(
  options: AISessionOptions = {
    enableHistory: true,
    maxHistoryItems: 50,
    autoSave: true,
    persistToSupabase: true,
  }
) {
  const { enableHistory, maxHistoryItems, autoSave, persistToSupabase } =
    options;

  // ==============================================
  // 🔄 상태 관리
  // ==============================================

  const [sessionState, setSessionState] = useState<AISessionState>({
    sessionId: null,
    currentQuery: '',
    currentResponse: '',
    mode: 'LOCAL',
    isLoading: false,
    error: null,
    confidence: 0,
    enginePath: [],
    thinkingProcess: [],
    reasoningSteps: [],
    history: [],
    metadata: {},
  });

  const storage = useRef(getAISessionStorage());
  const localStorageKey = 'ai-session-state';

  // ==============================================
  // 🔄 초기화 및 복원
  // ==============================================

  useEffect(() => {
    if (enableHistory) {
      loadSessionHistory();
    }
  }, [enableHistory]);

  /**
   * 💾 로컬 스토리지에서 상태 복원
   */
  const restoreFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setSessionState(prev => ({
          ...prev,
          ...parsedState,
          isLoading: false, // 복원 시 로딩 상태는 항상 false
        }));
      }
    } catch (error) {
      console.warn('로컬 스토리지 복원 실패:', error);
    }
  }, []);

  /**
   * 💾 로컬 스토리지에 상태 저장
   */
  const saveToLocalStorage = useCallback(
    (state: AISessionState) => {
      if (!enableHistory) return;

      try {
        const stateToSave = {
          ...state,
          isLoading: false, // 로딩 상태는 저장하지 않음
        };
        localStorage.setItem(localStorageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('로컬 스토리지 저장 실패:', error);
      }
    },
    [enableHistory]
  );

  /**
   * 📝 세션 이력 로드
   */
  const loadSessionHistory = useCallback(async () => {
    try {
      const history = await storage.current.getUserSessions(
        undefined,
        maxHistoryItems
      );
      setSessionState(prev => ({ ...prev, history }));
    } catch (error) {
      console.warn('세션 이력 로드 실패:', error);
    }
  }, [maxHistoryItems]);

  // ==============================================
  // 🎯 세션 관리 함수들
  // ==============================================

  /**
   * 🎯 새로운 세션 시작
   */
  const startNewSession = useCallback(() => {
    const newSessionId = storage.current.generateSessionId();

    const newState: AISessionState = {
      sessionId: newSessionId,
      isLoading: false,
      currentQuery: '',
      currentResponse: '',
      mode: 'LOCAL',
      error: null,
      thinkingProcess: [],
      confidence: 0,
      enginePath: [],
      reasoningSteps: [],
      history: sessionState.history,
      metadata: {},
    };

    setSessionState(newState);
    saveToLocalStorage(newState);

    return newSessionId;
  }, [sessionState.history, saveToLocalStorage]);

  /**
   * 🔄 AI 쿼리 시작
   */
  const startQuery = useCallback(
    (query: string, mode: 'LOCAL' | 'GOOGLE_ONLY' = 'LOCAL') => {
      let sessionId = sessionState.sessionId;

      // 세션이 없으면 새로 생성
      if (!sessionId) {
        sessionId = storage.current.generateSessionId();
      }

      const newState: AISessionState = {
        ...sessionState,
        sessionId,
        isLoading: true,
        currentQuery: query,
        currentResponse: '',
        mode,
        error: null,
      };

      setSessionState(newState);
      saveToLocalStorage(newState);

      return sessionId;
    },
    [sessionState, saveToLocalStorage]
  );

  /**
   * 🧠 Thinking Process 업데이트
   */
  const updateThinkingProcess = useCallback(
    (step: { type: string; title: string; description: string }) => {
      const newStep = {
        ...step,
        timestamp: Date.now(),
      };

      setSessionState(prev => {
        const newState = {
          ...prev,
          thinkingProcess: [...prev.thinkingProcess, newStep],
        };
        saveToLocalStorage(newState);
        return newState;
      });
    },
    [saveToLocalStorage]
  );

  /**
   * ✅ AI 응답 완료
   */
  const completeQuery = useCallback(
    async (
      response: string,
      confidence: number,
      processingTime: number,
      fullResponse?: any
    ) => {
      const newState: AISessionState = {
        ...sessionState,
        isLoading: false,
        currentResponse: response,
        confidence,
        error: null,
        enginePath: fullResponse?.enginePath || [],
        reasoningSteps: fullResponse?.reasoning_steps || [],
      };

      setSessionState(newState);
      saveToLocalStorage(newState);

      // Supabase에 저장 (자동 저장이 활성화된 경우)
      if (persistToSupabase && sessionState.sessionId) {
        try {
          const sessionData: AISessionData = {
            session_id: sessionState.sessionId,
            query: sessionState.currentQuery,
            mode: sessionState.mode,
            response: {
              success: true,
              response,
              confidence,
              engine_path: sessionState.enginePath,
              processing_time: processingTime,
              fallbacks_used: 0,
            },
            thinking_process: sessionState.thinkingProcess,
            reasoning_steps: sessionState.reasoningSteps,
            metadata: {
              timestamp: new Date().toISOString(),
            },
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(), // 24시간 후
          };

          await storage.current.saveSession(sessionData);

          // 히스토리 새로고침
          if (enableHistory) {
            await loadSessionHistory();
          }
        } catch (error) {
          console.warn('세션 자동 저장 실패:', error);
        }
      }
    },
    [
      sessionState,
      saveToLocalStorage,
      persistToSupabase,
      enableHistory,
      loadSessionHistory,
    ]
  );

  /**
   * ❌ AI 쿼리 에러 처리
   */
  const handleQueryError = useCallback(
    (error: string) => {
      const newState: AISessionState = {
        ...sessionState,
        isLoading: false,
        error,
      };

      setSessionState(newState);
      saveToLocalStorage(newState);
    },
    [sessionState, saveToLocalStorage]
  );

  /**
   * 🔍 과거 세션 복원
   */
  const restoreSession = useCallback(
    async (sessionId: string) => {
      try {
        const sessionData = await storage.current.getSession(sessionId);

        if (sessionData) {
          const restoredState: AISessionState = {
            sessionId: sessionData.session_id,
            isLoading: false,
            currentQuery: sessionData.query,
            currentResponse: sessionData.response.response,
            mode: sessionData.mode,
            error: null,
            thinkingProcess: sessionData.thinking_process || [],
            confidence: sessionData.response.confidence,
            enginePath: sessionData.response.engine_path || [],
            reasoningSteps: sessionData.reasoning_steps || [],
            history: sessionState.history,
            metadata: sessionData.metadata,
          };

          setSessionState(restoredState);
          saveToLocalStorage(restoredState);

          return true;
        }

        return false;
      } catch (error) {
        console.error('세션 복원 실패:', error);
        return false;
      }
    },
    [sessionState.history, saveToLocalStorage]
  );

  /**
   * 🧹 세션 초기화
   */
  const clearSession = useCallback(() => {
    const clearedState: AISessionState = {
      sessionId: null,
      isLoading: false,
      currentQuery: '',
      currentResponse: '',
      mode: 'LOCAL',
      error: null,
      thinkingProcess: [],
      confidence: 0,
      enginePath: [],
      reasoningSteps: [],
      history: sessionState.history,
      metadata: {},
    };

    setSessionState(clearedState);

    if (enableHistory) {
      localStorage.removeItem(localStorageKey);
    }
  }, [sessionState.history, enableHistory]);

  // ==============================================
  // 🎯 반환값
  // ==============================================

  return {
    // 상태
    sessionState,

    // 세션 관리
    startNewSession,
    restoreSession,
    clearSession,

    // 쿼리 관리
    startQuery,
    updateThinkingProcess,
    completeQuery,
    handleQueryError,

    // 히스토리 관리
    refreshHistory: loadSessionHistory,

    // 헬퍼
    isSessionActive: !!sessionState.sessionId,
    hasResponse: !!sessionState.currentResponse,
    isThinking:
      sessionState.isLoading && sessionState.thinkingProcess.length > 0,
  };
}

// ==============================================
// 🎯 유틸리티 훅들
// ==============================================

/**
 * 🔄 AI 세션 상태만 추적하는 간단한 훅
 */
export function useAISessionState() {
  const { sessionState } = useAISession({
    enableHistory: false,
    autoSave: false,
  });

  return sessionState;
}

/**
 * 📝 AI 세션 히스토리만 관리하는 훅
 */
export function useAISessionHistory() {
  const { sessionState, refreshHistory, restoreSession } = useAISession({
    enableHistory: false,
    autoSave: false,
  });

  return {
    history: sessionState.history,
    refreshHistory,
    restoreSession,
  };
}
