/**
 * useAIThinking Hook
 *
 * 🧠 AI 사고 과정 관리를 위한 React 훅
 */

import { useState, useCallback } from 'react';

export interface AIThinkingStep {
  id: string;
  type: 'thought' | 'observation' | 'action' | 'answer';
  content: string;
  timestamp: Date;
  confidence?: number;
}

export interface AgentLog {
  id: string;
  type:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation';
  message: string;
  timestamp: Date;
  metadata?: any;
  step?: number;
  progress?: number;
  content?: string;
  duration?: number;
}

export const useAIThinking = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [currentQuestion, setCurrentQuestionState] = useState('');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<AIThinkingStep[]>([]);

  /**
   * 사고 상태 설정
   */
  const setThinking = useCallback((thinking: boolean) => {
    setIsThinking(thinking);
  }, []);

  /**
   * 현재 질문 설정
   */
  const setCurrentQuestion = useCallback((question: string) => {
    setCurrentQuestionState(question);
  }, []);

  /**
   * 로그 추가
   */
  const addLog = useCallback((log: Omit<AgentLog, 'id' | 'timestamp'>) => {
    const newLog: AgentLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  /**
   * 사고 단계 추가
   */
  const addThinkingStep = useCallback(
    (step: Omit<AIThinkingStep, 'id' | 'timestamp'>) => {
      const newStep: AIThinkingStep = {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };
      setThinkingSteps(prev => [...prev, newStep]);
    },
    []
  );

  /**
   * 로그 초기화
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * 사고 단계 초기화
   */
  const clearThinkingSteps = useCallback(() => {
    setThinkingSteps([]);
  }, []);

  // 최근 사고 단계 (최대 10개)
  const recentSteps = thinkingSteps.slice(-10);

  return {
    // 상태
    isThinking,
    currentQuestion,
    logs,
    thinkingSteps,
    recentSteps,

    // 액션
    setThinking,
    setCurrentQuestion,
    addLog,
    addThinkingStep,
    clearLogs,
    clearThinkingSteps,
  };
};
