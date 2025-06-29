/**
 * 🧠 Enhanced AI 사고 과정 React 훅
 *
 * EnhancedThinkingService를 React 컴포넌트에서 쉽게 사용할 수 있도록 하는 훅
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  enhancedThinkingService,
  EnhancedThinkingStep,
  ThinkingSession,
} from '@/services/ai/EnhancedThinkingService';

export interface UseEnhancedThinkingReturn {
  // 상태
  isThinking: boolean;
  currentSession: ThinkingSession | null;
  steps: EnhancedThinkingStep[];

  // 액션
  startThinking: (question: string) => string;
  stopThinking: () => void;

  // 실제 AI 엔진 연동용 함수들
  onEngineStart: (engine: string, operation: string) => void;
  onEngineProgress: (engine: string, message: string, progress: number) => void;
  onEngineComplete: (engine: string, result: string) => void;
}

export const useEnhancedThinking = (): UseEnhancedThinkingReturn => {
  const [isThinking, setIsThinking] = useState(false);
  const [currentSession, setCurrentSession] = useState<ThinkingSession | null>(
    null
  );
  const [steps, setSteps] = useState<EnhancedThinkingStep[]>([]);

  // 이벤트 리스너 설정
  useEffect(() => {
    const handleSessionStarted = (session: ThinkingSession) => {
      setCurrentSession(session);
      setSteps(session.steps);
      setIsThinking(true);
    };

    const handleStepAdded = ({
      sessionId,
      step,
    }: {
      sessionId: string;
      step: EnhancedThinkingStep;
    }) => {
      if (currentSession?.sessionId === sessionId) {
        setSteps(prev => [...prev, step]);
      }
    };

    const handleSessionCompleted = (session: ThinkingSession) => {
      if (currentSession?.sessionId === session.sessionId) {
        setCurrentSession(session);
        setSteps(session.steps);
        setIsThinking(false);
      }
    };

    // 이벤트 리스너 등록
    enhancedThinkingService.on('session_started', handleSessionStarted);
    enhancedThinkingService.on('step_added', handleStepAdded);
    enhancedThinkingService.on('session_completed', handleSessionCompleted);

    // 정리
    return () => {
      enhancedThinkingService.off('session_started', handleSessionStarted);
      enhancedThinkingService.off('step_added', handleStepAdded);
      enhancedThinkingService.off('session_completed', handleSessionCompleted);
    };
  }, [currentSession?.sessionId]);

  // 사고 과정 시작
  const startThinking = useCallback((question: string): string => {
    const sessionId = enhancedThinkingService.startThinkingSession(question);
    return sessionId;
  }, []);

  // 사고 과정 중단
  const stopThinking = useCallback(() => {
    if (currentSession) {
      enhancedThinkingService.completeThinkingSession(currentSession.sessionId);
    }
  }, [currentSession]);

  // 실제 AI 엔진 연동용 함수들
  const onEngineStart = useCallback(
    (engine: string, operation: string) => {
      if (currentSession) {
        enhancedThinkingService.onEngineStart(
          currentSession.sessionId,
          engine,
          operation
        );
      }
    },
    [currentSession]
  );

  const onEngineProgress = useCallback(
    (engine: string, message: string, progress: number) => {
      if (currentSession) {
        enhancedThinkingService.onEngineProgress(
          currentSession.sessionId,
          engine,
          message,
          progress
        );
      }
    },
    [currentSession]
  );

  const onEngineComplete = useCallback(
    (engine: string, result: string) => {
      if (currentSession) {
        enhancedThinkingService.onEngineComplete(
          currentSession.sessionId,
          engine,
          result
        );
      }
    },
    [currentSession]
  );

  return {
    isThinking,
    currentSession,
    steps,
    startThinking,
    stopThinking,
    onEngineStart,
    onEngineProgress,
    onEngineComplete,
  };
};
