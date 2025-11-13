/**
 * 🤖 AI 사이드바 통합 상태 관리 스토어 - 최적화 버전
 *
 * ⚡ 최적화 사항:
 * - SSR 안전성 보장
 * - 메모리 사용량 최적화
 * - 함수 패널 기능 통합
 * - 공통 로직 중앙화
 * - modules/ai-sidebar 훅들과 통합
 */

'use client';

import { useState, useCallback } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// AI Thinking Step 타입 import (중복 정의 제거)
import type { AIThinkingStep } from '../types/ai-thinking';
import type { AIMode } from '../types/ai-types';

export interface AgentLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: unknown;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'thinking';
  timestamp: Date;
  engine?: string;
  metadata?: {
    processingTime?: number;
    confidence?: number;
    error?: string;
  };
}

export interface EnhancedChatMessage extends ChatMessage {
  thinkingSteps?: AIThinkingStep[];
  isStreaming?: boolean;
  isCompleted?: boolean;
  parentMessageId?: string; // thinking 메시지가 속한 원본 메시지 ID
}

export interface AIResponse {
  content: string;
  thinkingSteps?: AIThinkingStep[];
  metadata?: Record<string, unknown>;
}

export interface ChatHookOptions {
  autoScroll?: boolean;
  maxMessages?: number;
}

// 🧠 AI Thinking 관리 훅 (실제 구현)
export const useAIThinking = () => {
  // Thinking 상태를 위한 별도 상태 (persist 제외)
  const [thinkingState, setThinkingState] = useState<{
    steps: AIThinkingStep[];
    isThinking: boolean;
    currentStepIndex: number;
    startTime?: Date;
    sessionId?: string;
  }>({
    steps: [],
    isThinking: false,
    currentStepIndex: -1,
  });

  const addStep = useCallback((step: Omit<AIThinkingStep, 'timestamp'>) => {
    const newStep: AIThinkingStep = {
      ...step,
      timestamp: new Date(),
    };
    
    setThinkingState(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      isThinking: step.status !== 'completed',
      currentStepIndex: prev.steps.length,
    }));
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<AIThinkingStep>) => {
    setThinkingState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, ...updates, timestamp: new Date() }
          : step
      ),
      isThinking: updates.status 
        ? (updates.status !== 'completed')
        : prev.isThinking,
    }));
  }, []);

  const clearSteps = useCallback(() => {
    setThinkingState(prev => ({
      ...prev,
      steps: [],
      isThinking: false,
      currentStepIndex: -1,
    }));
  }, []);

  const startThinking = useCallback((initialStep?: string, sessionId?: string) => {
    const now = new Date();
    setThinkingState({
      steps: initialStep ? [{
        id: crypto.randomUUID(),
        step: initialStep,
        status: 'processing',
        timestamp: now,
      }] : [],
      isThinking: true,
      currentStepIndex: 0,
      startTime: now,
      sessionId,
    });
  }, []);

  const completeThinking = useCallback(() => {
    setThinkingState(prev => ({
      ...prev,
      isThinking: false,
      steps: prev.steps.map(step => 
        step.status === 'processing' 
          ? { ...step, status: 'completed', timestamp: new Date() }
          : step
      ),
    }));
  }, []);

  // 실제 thinking 과정 시뮬레이션
  const simulateThinkingSteps = useCallback((query: string, mode: AIMode = 'LOCAL') => {
    if (mode === 'GOOGLE_AI') {
      // Google AI는 단순한 처리 과정
      const steps: Omit<AIThinkingStep, 'timestamp'>[] = [
        {
          id: crypto.randomUUID(),
          step: 'API 호출 중...',
          status: 'processing',
          description: 'Google AI API를 호출하고 있습니다.'
        }
      ];
      
      steps.forEach(step => addStep(step));
      
      // 2초 후 완료
      setTimeout(() => {
        const firstStep = steps[0];
        if (firstStep) {
          updateStep(firstStep.id, { status: 'completed' });
        }
        completeThinking();
      }, 2000);
    } else {
      // Local AI는 상세한 thinking 과정
      const steps: Omit<AIThinkingStep, 'timestamp'>[] = [
        {
          id: crypto.randomUUID(),
          step: '질문 분석',
          status: 'processing',
          description: `"${query}" 질문을 이해하고 의도를 파악하고 있습니다...`
        },
        {
          id: crypto.randomUUID(),
          step: '데이터 수집',
          status: 'processing',
          description: '관련 시스템 데이터와 메트릭을 수집하고 있습니다...'
        },
        {
          id: crypto.randomUUID(),
          step: '분석 및 추론',
          status: 'processing', 
          description: '수집된 데이터를 분석하고 패턴을 파악하고 있습니다...'
        },
        {
          id: crypto.randomUUID(),
          step: '답변 생성',
          status: 'processing',
          description: '최적의 답변을 생성하고 검증하고 있습니다...'
        }
      ];

      // 첫 번째 단계 시작
      const firstStep = steps[0];
      if (firstStep) {
        addStep(firstStep);
      }
      
      // 단계별 진행 시뮬레이션
      steps.forEach((step, index) => {
        setTimeout(() => {
          if (index > 0) addStep(step); // 첫 번째는 이미 추가됨
          
          // 이전 단계 완료
          if (index > 0) {
            const prevStep = steps[index - 1];
            if (prevStep) {
              updateStep(prevStep.id, { status: 'completed' });
            }
          }
          
          // 마지막 단계면 전체 완료
          if (index === steps.length - 1) {
            setTimeout(() => {
              updateStep(step.id, { status: 'completed' });
              completeThinking();
            }, 1500);
          }
        }, (index + 1) * 1500); // 1.5초 간격으로 진행
      });
    }
  }, [addStep, updateStep, completeThinking]); // addStep, updateStep, completeThinking 함수 의존성 복구

  return {
    steps: thinkingState.steps,
    isThinking: thinkingState.isThinking,
    currentStepIndex: thinkingState.currentStepIndex,
    startTime: thinkingState.startTime,
    sessionId: thinkingState.sessionId,
    addStep,
    updateStep,
    clearSteps,
    startThinking,
    completeThinking,
    simulateThinkingSteps,
  };
};

export const useAIChat = () => {
  const messages = useAISidebarStore((state) => state.messages);
  const addMessage = useAISidebarStore((state) => state.addMessage);
  const clearMessages = useAISidebarStore((state) => state.clearMessages);
  
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: EnhancedChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      // API 호출 로직 여기에 추가 예정
      // 현재는 더미 응답
      const assistantMessage: EnhancedChatMessage = {
        id: crypto.randomUUID(),
        content: '응답을 처리 중입니다...',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
        isCompleted: false,
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]); // addMessage 함수 의존성 복구

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
};

// 🔧 타입 정의 (기존 호환성 유지)
export interface PresetQuestion {
  id: string;
  question: string;
  category: 'performance' | 'security' | 'prediction' | 'analysis';
  isAIRecommended?: boolean;
}

// 🎯 프리셋 질문 상수
export const PRESET_QUESTIONS: readonly PresetQuestion[] = [
  // 성능 분석
  {
    id: 'perf-1',
    question: '현재 시스템의 전반적인 성능 상태는 어떤가요?',
    category: 'performance',
  },
  {
    id: 'perf-2',
    question: 'CPU 사용률이 높은 서버들을 분석해주세요',
    category: 'performance',
  },
  {
    id: 'perf-3',
    question: '메모리 사용량 트렌드를 분석해주세요',
    category: 'performance',
    isAIRecommended: true,
  },
  {
    id: 'perf-4',
    question: '응답 시간이 느린 서버를 찾아주세요',
    category: 'performance',
  },

  // 보안 점검
  {
    id: 'sec-1',
    question: '보안상 위험한 서버나 패턴이 있나요?',
    category: 'security',
  },
  {
    id: 'sec-2',
    question: '비정상적인 네트워크 활동을 감지해주세요',
    category: 'security',
    isAIRecommended: true,
  },
  {
    id: 'sec-3',
    question: '접근 권한 관련 이슈가 있는지 확인해주세요',
    category: 'security',
  },

  // 예측 분석
  {
    id: 'pred-1',
    question: '향후 1시간 내 장애 가능성이 있는 서버는?',
    category: 'prediction',
  },
  {
    id: 'pred-2',
    question: '리소스 부족으로 인한 문제가 예상되는 곳은?',
    category: 'prediction',
    isAIRecommended: true,
  },
  {
    id: 'pred-3',
    question: '내일까지 주의 깊게 모니터링해야 할 서버는?',
    category: 'prediction',
  },

  // 종합 분석
  {
    id: 'anal-1',
    question: '전체 인프라의 상태를 종합적으로 분석해주세요',
    category: 'analysis',
  },
  {
    id: 'anal-2',
    question: '최적화가 필요한 부분을 우선순위별로 알려주세요',
    category: 'analysis',
    isAIRecommended: true,
  },
  {
    id: 'anal-3',
    question: '비용 절감을 위한 개선사항을 제안해주세요',
    category: 'analysis',
  },
] as const;

// 🏪 메인 스토어 인터페이스 (확장)
interface AISidebarState {
  // UI 상태
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions';

  // 채팅 관련 상태
  messages: EnhancedChatMessage[];
  sessionId: string;
  currentEngine: string;

  // 함수 패널 관련 상태
  functionTab: 'qa' | 'report' | 'patterns' | 'logs' | 'context';
  selectedContext: 'basic' | 'advanced' | 'custom';

  // 액션들
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (
    tab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions'
  ) => void;
  setFunctionTab: (
    tab: 'qa' | 'report' | 'patterns' | 'logs' | 'context'
  ) => void;
  setSelectedContext: (context: 'basic' | 'advanced' | 'custom') => void;

  // 채팅 관련 액션들
  addMessage: (message: EnhancedChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<EnhancedChatMessage>) => void;
  clearMessages: () => void;
  setCurrentEngine: (engine: string) => void;

  reset: () => void;
}

// ⚡ 메인 스토어 (간소화 - AI 로직은 modules/ai-sidebar 훅들 사용)
export const useAISidebarStore = create<AISidebarState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        isOpen: false,
        isMinimized: false,
        activeTab: 'chat',
        functionTab: 'qa',
        selectedContext: 'basic',
        messages: [],
        sessionId: crypto.randomUUID
          ? crypto.randomUUID()
          : `session-${Date.now()}`,
        currentEngine: 'unified',

        // UI 액션들
        setOpen: (open) =>
          set((state) => ({
            isOpen: open,
            isMinimized: open ? false : state.isMinimized,
          })),

        setMinimized: (minimized) => set({ isMinimized: minimized }),

        toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),

        setActiveTab: (tab) => set({ activeTab: tab }),

        setFunctionTab: (tab) => set({ functionTab: tab }),

        setSelectedContext: (context) => set({ selectedContext: context }),

        // 채팅 관련 액션들
        addMessage: (message) =>
          set((state) => ({
            messages: [...state.messages, message].slice(-100), // 최대 100개만 유지 (메모리 누수 방지)
          })),

        updateMessage: (messageId, updates) =>
          set((state) => ({
            messages: state.messages.map(msg => 
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          })),

        clearMessages: () => set({ messages: [] }),

        setCurrentEngine: (engine) => set({ currentEngine: engine }),

        reset: () =>
          set({
            isOpen: false,
            isMinimized: false,
            activeTab: 'chat',
            functionTab: 'qa',
            selectedContext: 'basic',
            messages: [],
            sessionId: crypto.randomUUID
              ? crypto.randomUUID()
              : `session-${Date.now()}`,
            currentEngine: 'unified',
          }),
      }),
      {
        name: 'ai-sidebar-storage',
        partialize: (state) => ({
          // 중요한 상태만 영속화
          isMinimized: state.isMinimized,
          activeTab: state.activeTab,
          functionTab: state.functionTab,
          selectedContext: state.selectedContext,
          // 🔥 대화 기록 영속화 추가
          messages: state.messages,
          currentEngine: state.currentEngine,
          sessionId: state.sessionId,
        }),
        // SSR 안전성을 위한 완전한 hydration 제어
        skipHydration: true,
        // Hydration 불일치 방지를 위한 추가 옵션
        onRehydrateStorage: () => (state) => {
          // Hydration 후 초기 상태 정규화
          if (state) {
            state.isOpen = false; // 초기에는 항상 닫힌 상태로 시작
          }
        },
      }
    ),
    { name: 'AISidebarStore' }
  )
);

// 🎛️ 선택적 훅들 (성능 최적화)
export const useAISidebarUI = () => {
  const isOpen = useAISidebarStore((state) => state.isOpen);
  const isMinimized = useAISidebarStore((state) => state.isMinimized);
  const activeTab = useAISidebarStore((state) => state.activeTab);
  const functionTab = useAISidebarStore((state) => state.functionTab);
  const setOpen = useAISidebarStore((state) => state.setOpen);
  const setMinimized = useAISidebarStore((state) => state.setMinimized);
  const setActiveTab = useAISidebarStore((state) => state.setActiveTab);
  const setFunctionTab = useAISidebarStore((state) => state.setFunctionTab);

  return {
    isOpen,
    isMinimized,
    activeTab,
    functionTab,
    setOpen,
    setMinimized,
    setActiveTab,
    setFunctionTab,
  };
};

export const useAIContext = () => {
  const selectedContext = useAISidebarStore((state) => state.selectedContext);
  const setSelectedContext = useAISidebarStore(
    (state) => state.setSelectedContext
  );

  return {
    selectedContext,
    setSelectedContext,
  };
};

// 🔍 선택자 함수들 (메모화)
export const selectQuickQuestions = () => [
  {
    id: '1',
    question: '현재 시스템 상태는?',
    category: 'performance' as const,
  },
  { id: '2', question: '보안 위험 요소는?', category: 'security' as const },
  { id: '3', question: '성능 예측 분석', category: 'prediction' as const },
  { id: '4', question: '로그 패턴 분석', category: 'analysis' as const },
];

// 🎛️ 추가 훅들
export const useAISettings = () => {
  const selectedContext = useAISidebarStore((state) => state.selectedContext);
  const setSelectedContext = useAISidebarStore(
    (state) => state.setSelectedContext
  );

  return {
    selectedContext,
    setSelectedContext,
    settings: {
      autoThinking: true,
      contextLevel: selectedContext,
      responseFormat: 'detailed',
    },
  };
};

// 🚨 타입 정의 추가
export interface AISidebarSettings {
  autoThinking: boolean;
  contextLevel: 'basic' | 'advanced' | 'custom';
  responseFormat: 'brief' | 'detailed' | 'technical';
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  isClosable?: boolean;
  autoClose?: number;
}