/**
 * AI 사고 과정 관리 Custom Hook
 * 실시간 사고 과정 시뮬레이션 및 상태 관리
 */

import { useCallback, useState } from 'react';
import type { ThinkingStep } from '../types/ai-sidebar-types';

export interface CompletedThinking {
  steps: ThinkingStep[];
  isExpanded: boolean;
  query: string;
  engine: string;
  processingTime: number;
}

export interface UseAIThinkingReturn {
  // 현재 사고 상태
  isThinking: boolean;
  currentThinkingSteps: ThinkingStep[];
  isThinkingExpanded: boolean;
  thinkingStartTime: Date | null;
  showThinkingDisplay: boolean;

  // 완료된 사고 과정
  completedThinkingSteps: Record<string, CompletedThinking>;

  // 액션
  startThinking: () => void;
  stopThinking: (
    query?: string,
    engine?: string,
    processingTime?: number
  ) => void;
  toggleThinkingExpanded: () => void;
  toggleCompletedThinking: (messageId: string) => void;
  simulateRealTimeThinking: () => () => void;
}

export function useAIThinking(): UseAIThinkingReturn {
  // 현재 사고 상태
  const [isThinking, setIsThinking] = useState(false);
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<
    ThinkingStep[]
  >([]);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [thinkingStartTime, setThinkingStartTime] = useState<Date | null>(null);
  const [showThinkingDisplay, setShowThinkingDisplay] = useState(false);
  const [thinkingPersistTimer, setThinkingPersistTimer] =
    useState<NodeJS.Timeout | null>(null);

  // 완료된 사고 과정 저장
  const [completedThinkingSteps, setCompletedThinkingSteps] = useState<
    Record<string, CompletedThinking>
  >({});

  // 실시간 사고 과정 시뮬레이션
  const simulateRealTimeThinking = useCallback(() => {
    const steps: ThinkingStep[] = [
      {
        id: '1',
        step: '1',
        title: '질문 분석',
        description: '사용자의 질문을 이해하고 의도를 파악하고 있습니다...',
        status: 'processing',
      },
      {
        id: '2',
        step: '2',
        title: '데이터 수집',
        description: '관련 정보를 수집하고 있습니다...',
        status: 'pending',
      },
      {
        id: '3',
        step: '3',
        title: '분석 및 추론',
        description: '수집된 데이터를 분석하고 있습니다...',
        status: 'pending',
      },
      {
        id: '4',
        step: '4',
        title: '답변 생성',
        description: '최적의 답변을 생성하고 있습니다...',
        status: 'pending',
      },
    ];

    setCurrentThinkingSteps(steps);
    setThinkingStartTime(new Date());

    // 단계별 진행 시뮬레이션
    let currentStepIndex = 0;
    const interval = setInterval(
      () => {
        if (currentStepIndex < steps.length) {
          setCurrentThinkingSteps((prev) =>
            prev.map((step, index) => {
              if (index === currentStepIndex) {
                return {
                  ...step,
                  status: 'completed',
                  duration: Math.random() * 2000 + 1000,
                };
              } else if (index === currentStepIndex + 1) {
                return { ...step, status: 'processing' };
              }
              return step;
            })
          );
          currentStepIndex++;
        } else {
          clearInterval(interval);
        }
      },
      1500 + Math.random() * 1000
    ); // 1.5-2.5초 간격

    return () => clearInterval(interval);
  }, []);

  // 사고 시작
  const startThinking = useCallback(() => {
    setIsThinking(true);
    setShowThinkingDisplay(true);
    simulateRealTimeThinking();

    // 기존 타이머 정리
    if (thinkingPersistTimer) {
      clearTimeout(thinkingPersistTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulateRealTimeThinking, thinkingPersistTimer]); // thinkingPersistTimer, simulateRealTimeThinking 함수/타이머 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  // 사고 종료
  const stopThinking = useCallback(
    (query?: string, engine?: string, processingTime?: number) => {
      setIsThinking(false);

      // 완료된 사고 과정을 저장 (질문과 답변 사이에 표시하기 위해)
      if (query && currentThinkingSteps.length > 0) {
        const messageId = `thinking-${Date.now()}`;
        setCompletedThinkingSteps((prev) => ({
          ...prev,
          [messageId]: {
            steps: [...currentThinkingSteps].map((step) => ({
              ...step,
              status: 'completed' as const,
            })),
            isExpanded: false, // 기본적으로 접힌 상태
            query,
            engine: engine || 'unknown',
            processingTime: processingTime || 0,
          },
        }));
      }

      // 실시간 표시는 1초 후 숨김
      const timer = setTimeout(() => {
        setShowThinkingDisplay(false);
        setCurrentThinkingSteps([]);
      }, 1000);

      setThinkingPersistTimer(timer);
    },
    [currentThinkingSteps]
  );

  // 사고 확장/축소 토글
  const toggleThinkingExpanded = useCallback(() => {
    setIsThinkingExpanded((prev) => !prev);
  }, []);

  // 완료된 사고 과정 토글
  const toggleCompletedThinking = useCallback((messageId: string) => {
    setCompletedThinkingSteps((prev) => ({
      ...prev,
      [messageId]: {
        steps: prev[messageId]?.steps ?? [],
        query: prev[messageId]?.query ?? '',
        engine: prev[messageId]?.engine ?? '',
        processingTime: prev[messageId]?.processingTime ?? 0,
        isExpanded: !prev[messageId]?.isExpanded,
      },
    }));
  }, []);

  return {
    // 상태
    isThinking,
    currentThinkingSteps,
    isThinkingExpanded,
    thinkingStartTime,
    showThinkingDisplay,
    completedThinkingSteps,

    // 액션
    startThinking,
    stopThinking,
    toggleThinkingExpanded,
    toggleCompletedThinking,
    simulateRealTimeThinking,
  };
}
