/**
 * 🧠 LangGraph Thinking Hook
 * 
 * LangGraph 스타일 사고 과정을 React 컴포넌트에서 사용할 수 있는 훅
 * - 실시간 사고 흐름 추적
 * - ReAct 프레임워크 지원
 * - UI 애니메이션 상태 관리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  langGraphProcessor, 
  type ThinkingFlow, 
  type LogicStep, 
  type ReActStep 
} from '@/modules/ai-agent/core/LangGraphThinkingProcessor';

export interface ThinkingUIState {
  isThinking: boolean;
  currentStep: LogicStep | null;
  allSteps: LogicStep[];
  reactSteps: ReActStep[];
  progress: number;
  animate: boolean;
  finalAnswer: string | null;
}

export interface UseLangGraphThinkingOptions {
  autoAnimate?: boolean;
  animationSpeed?: number;
  showReActSteps?: boolean;
  maxHistorySteps?: number;
}

export function useLangGraphThinking(options: UseLangGraphThinkingOptions = {}) {
  const {
    autoAnimate = true,
    animationSpeed = 1000,
    showReActSteps = true,
    maxHistorySteps = 50
  } = options;

  const [state, setState] = useState<ThinkingUIState>({
    isThinking: false,
    currentStep: null,
    allSteps: [],
    reactSteps: [],
    progress: 0,
    animate: false,
    finalAnswer: null
  });

  const currentFlowRef = useRef<ThinkingFlow | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 사고 흐름 시작
   */
  const startThinking = useCallback((sessionId: string, query: string, mode: ThinkingFlow['mode'] = 'basic') => {
    const queryId = langGraphProcessor.startThinking(sessionId, query, mode);
    
    setState(prev => ({
      ...prev,
      isThinking: true,
      currentStep: null,
      allSteps: [],
      reactSteps: [],
      progress: 0,
      animate: autoAnimate,
      finalAnswer: null
    }));

    return queryId;
  }, [autoAnimate]);

  /**
   * 사고 흐름 완료
   */
  const completeThinking = useCallback((result?: any) => {
    langGraphProcessor.completeThinking(result);
    
    setState(prev => ({
      ...prev,
      isThinking: false,
      progress: 100,
      animate: false
    }));
  }, []);

  /**
   * 애니메이션 토글
   */
  const toggleAnimation = useCallback(() => {
    setState(prev => ({
      ...prev,
      animate: !prev.animate
    }));
  }, []);

  /**
   * 진행 상황 계산
   */
  const calculateProgress = useCallback((steps: LogicStep[]): number => {
    if (steps.length === 0) return 0;
    
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  }, []);

  /**
   * 사고 흐름 콜백 처리
   */
  useEffect(() => {
    const unsubscribe = langGraphProcessor.onThinking((flow: ThinkingFlow, step?: LogicStep) => {
      currentFlowRef.current = flow;
      
      setState(prev => {
        const newState: ThinkingUIState = {
          ...prev,
          isThinking: flow.status === 'thinking',
          allSteps: [...flow.logic_steps].slice(-maxHistorySteps),
          reactSteps: showReActSteps ? [...flow.react_sequence].slice(-maxHistorySteps) : [],
          progress: calculateProgress(flow.logic_steps),
          finalAnswer: flow.final_answer || null
        };

        // 현재 처리 중인 스텝 업데이트
        if (step) {
          newState.currentStep = step;
          
          // 애니메이션 효과
          if (autoAnimate && step.status === 'processing') {
            newState.animate = true;
            
            // 일정 시간 후 애니메이션 정지
            if (animationTimeoutRef.current) {
              clearTimeout(animationTimeoutRef.current);
            }
            
            animationTimeoutRef.current = setTimeout(() => {
              setState(s => ({ ...s, animate: false }));
            }, animationSpeed);
          }
        }

        return newState;
      });
    });

    return () => {
      unsubscribe();
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [autoAnimate, animationSpeed, showReActSteps, maxHistorySteps, calculateProgress]);

  /**
   * 편의 메서드들
   */
  const logStep = useCallback((title: string, description?: string, type?: 'analysis' | 'query' | 'processing' | 'prediction' | 'summary' | 'validation') => {
    return langGraphProcessor.logStep(title, description, type);
  }, []);

  const thought = useCallback((content: string, metadata?: Record<string, any>) => {
    langGraphProcessor.thought(content, metadata);
  }, []);

  const observation = useCallback((content: string, metadata?: Record<string, any>) => {
    langGraphProcessor.observation(content, metadata);
  }, []);

  const action = useCallback((content: string, metadata?: Record<string, any>) => {
    langGraphProcessor.action(content, metadata);
  }, []);

  const answer = useCallback((content: string, metadata?: Record<string, any>) => {
    langGraphProcessor.answer(content, metadata);
  }, []);

  const reflection = useCallback((content: string, metadata?: Record<string, any>) => {
    langGraphProcessor.reflection(content, metadata);
  }, []);

  const completeStep = useCallback((stepId: string, details?: any, progress: number = 100) => {
    langGraphProcessor.completeStep(stepId, details, progress);
  }, []);

  /**
   * 현재 흐름의 요약 정보
   */
  const getFlowSummary = useCallback(() => {
    const flow = currentFlowRef.current;
    if (!flow) return null;

    return {
      query: flow.query,
      mode: flow.mode,
      stepCount: flow.logic_steps.length,
      reactCount: flow.react_sequence.length,
      duration: flow.endTime ? flow.endTime - flow.startTime : Date.now() - flow.startTime,
      status: flow.status
    };
  }, []);

  /**
   * 스텝별 통계
   */
  const getStepStats = useCallback(() => {
    if (state.allSteps.length === 0) return null;

    const stats = {
      total: state.allSteps.length,
      completed: state.allSteps.filter(s => s.status === 'completed').length,
      processing: state.allSteps.filter(s => s.status === 'processing').length,
      error: state.allSteps.filter(s => s.status === 'error').length,
      avgDuration: 0
    };

    const completedSteps = state.allSteps.filter(s => s.duration);
    if (completedSteps.length > 0) {
      stats.avgDuration = completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSteps.length;
    }

    return stats;
  }, [state.allSteps]);

  return {
    // 상태
    ...state,
    
    // 액션
    startThinking,
    completeThinking,
    toggleAnimation,
    
    // ReAct 프레임워크
    logStep,
    thought,
    observation,
    action,
    answer,
    reflection,
    completeStep,
    
    // 유틸리티
    getFlowSummary,
    getStepStats,
    
    // 프로세서 직접 접근 (고급 사용)
    processor: langGraphProcessor
  };
} 