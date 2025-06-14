/**
 * 🤖 AI 사이드바 통합 상태 관리 스토어 - 하이브리드 최적화 버전
 * 
 * ⚡ 통합 최적화 사항:
 * - SSR 안전성 보장
 * - 메모리 사용량 최적화
 * - 함수 패널 기능 통합
 * - 도메인 주도 설계(DDD) 적용
 * - 서비스 레이어 분리
 * - 시스템 알림 및 타이핑 효과
 * - 공통 로직 중앙화
 */

'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 🔧 타입 정의
export interface AgentLog {
  id: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  timestamp: string;
  duration?: number;
  progress?: number;
}

export interface AIThinkingStep {
  id: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  timestamp: Date;
  duration?: number;
  progress?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string | Date;
  isTyping?: boolean;
  typingSpeed?: 'slow' | 'normal' | 'fast';
}

export interface AIResponse {
  id: string;
  query: string;
  response: string;
  confidence: number;
  timestamp: string | Date;
  context?: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isClosable?: boolean;
  autoClose?: number;
}

export interface PresetQuestion {
  id: string;
  question: string;
  category: 'performance' | 'security' | 'prediction' | 'analysis';
  isAIRecommended?: boolean;
}

export interface AISidebarSettings {
  typingSpeed: 'slow' | 'normal' | 'fast';
  showThinkingProcess: boolean;
  autoCloseAlerts: boolean;
  soundEnabled: boolean;
}

// 🎯 프리셋 질문 상수
export const PRESET_QUESTIONS: readonly PresetQuestion[] = [
  // 성능 분석
  { id: 'perf-1', question: '현재 시스템의 전반적인 성능 상태는 어떤가요?', category: 'performance' },
  { id: 'perf-2', question: 'CPU 사용률이 높은 서버들을 분석해주세요', category: 'performance' },
  { id: 'perf-3', question: '메모리 사용량 트렌드를 분석해주세요', category: 'performance', isAIRecommended: true },
  { id: 'perf-4', question: '응답 시간이 느린 서버를 찾아주세요', category: 'performance' },

  // 보안 점검
  { id: 'sec-1', question: '보안상 위험한 서버나 패턴이 있나요?', category: 'security' },
  { id: 'sec-2', question: '비정상적인 네트워크 활동을 감지해주세요', category: 'security', isAIRecommended: true },
  { id: 'sec-3', question: '접근 권한 관련 이슈가 있는지 확인해주세요', category: 'security' },

  // 예측 분석
  { id: 'pred-1', question: '향후 1시간 내 장애 가능성이 있는 서버는?', category: 'prediction' },
  { id: 'pred-2', question: '리소스 부족으로 인한 문제가 예상되는 곳은?', category: 'prediction', isAIRecommended: true },
  { id: 'pred-3', question: '내일까지 주의 깊게 모니터링해야 할 서버는?', category: 'prediction' },

  // 종합 분석
  { id: 'anal-1', question: '전체 인프라의 상태를 종합적으로 분석해주세요', category: 'analysis' },
  { id: 'anal-2', question: '최적화가 필요한 부분을 우선순위별로 알려주세요', category: 'analysis', isAIRecommended: true },
  { id: 'anal-3', question: '비용 절감을 위한 개선사항을 제안해주세요', category: 'analysis' }
] as const;

// 🏪 메인 스토어 인터페이스
interface AISidebarState {
  // UI 상태
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions';

  // 함수 패널 관련 상태
  functionTab: 'qa' | 'report' | 'patterns' | 'logs' | 'context';
  selectedContext: 'basic' | 'advanced' | 'custom';

  // AI 상태
  isThinking: boolean;
  currentQuestion: string | null;
  logs: AgentLog[];
  thinkingSteps: AIThinkingStep[];
  responses: AIResponse[];

  // 채팅 관련
  messages: ChatMessage[];

  // 알림 시스템
  alerts: SystemAlert[];

  // 설정
  settings: AISidebarSettings;

  // UI 액션들
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (tab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions') => void;
  setFunctionTab: (tab: 'qa' | 'report' | 'patterns' | 'logs' | 'context') => void;
  setSelectedContext: (context: 'basic' | 'advanced' | 'custom') => void;

  // AI 액션들
  setThinking: (thinking: boolean) => void;
  setCurrentQuestion: (question: string | null) => void;
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  addThinkingStep: (step: Omit<AIThinkingStep, 'id' | 'timestamp'>) => void;
  addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearThinkingSteps: () => void;
  clearResponses: () => void;

  // 채팅 Actions
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  clearMessages: () => void;

  // 알림 Actions
  addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;

  // 설정 Actions
  updateSettings: (settings: Partial<AISidebarSettings>) => void;

  // 전체 리셋
  reset: () => void;
}

// 🔧 유틸리티 함수들
const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createMessage = (content: string, role: 'user' | 'assistant', options?: Partial<ChatMessage>): Omit<ChatMessage, 'id'> => ({
  content,
  role,
  timestamp: new Date().toISOString(),
  ...options
});

const createSystemAlert = (
  type: SystemAlert['type'],
  title: string,
  message: string,
  options?: Partial<SystemAlert>
): Omit<SystemAlert, 'id' | 'timestamp'> => ({
  type,
  title,
  message,
  isClosable: true,
  autoClose: type === 'error' ? undefined : 5,
  ...options
});

// 🤖 AI 처리 시뮬레이션
const simulateThinkingProcess = async (question: string): Promise<Omit<AIThinkingStep, 'id' | 'timestamp'>[]> => {
  const steps: Omit<AIThinkingStep, 'id' | 'timestamp'>[] = [
    { step: '질문 분석', content: `"${question}" 질문을 분석하고 있습니다...`, type: 'analysis', progress: 20 },
    { step: '데이터 수집', content: '관련 서버 데이터를 수집하고 있습니다...', type: 'data_processing', progress: 40 },
    { step: '패턴 매칭', content: '기존 패턴과 비교 분석 중입니다...', type: 'pattern_matching', progress: 60 },
    { step: '추론 과정', content: '수집된 정보를 바탕으로 추론하고 있습니다...', type: 'reasoning', progress: 80 },
    { step: '응답 생성', content: '최적의 답변을 생성하고 있습니다...', type: 'response_generation', progress: 100 }
  ];

  return steps;
};

const generateAIResponse = async (question: string, steps: AIThinkingStep[]): Promise<Omit<AIResponse, 'id' | 'timestamp'>> => {
  // 실제 AI 응답 생성 로직 (시뮬레이션)
  const responses = {
    performance: "현재 시스템 성능은 전반적으로 양호합니다. CPU 사용률 평균 45%, 메모리 사용률 62%로 정상 범위 내에 있습니다.",
    security: "보안 상태를 점검한 결과, 현재까지 특별한 위험 요소는 발견되지 않았습니다. 모든 접근 로그가 정상적으로 기록되고 있습니다.",
    prediction: "향후 2시간 내 서버 부하 증가가 예상됩니다. 특히 웹서버 클러스터의 CPU 사용률이 70%를 넘을 가능성이 있습니다.",
    analysis: "전체 인프라 분석 결과, 3개 서버에서 최적화가 필요합니다. 메모리 사용량 최적화를 통해 약 15%의 성능 향상이 가능할 것으로 예상됩니다."
  };

  const category = question.includes('성능') || question.includes('CPU') || question.includes('메모리') ? 'performance' :
    question.includes('보안') || question.includes('위험') ? 'security' :
      question.includes('예상') || question.includes('예측') ? 'prediction' : 'analysis';

  return {
    query: question,
    response: responses[category],
    confidence: Math.random() * 0.3 + 0.7, // 70-100% 신뢰도
    context: `${steps.length}단계 분석 완료`
  };
};

// ⚡ 메인 스토어 (하이브리드 최적화)
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
        isThinking: false,
        currentQuestion: null,
        logs: [],
        thinkingSteps: [],
        responses: [],
        messages: [],
        alerts: [],
        settings: {
          typingSpeed: 'normal',
          showThinkingProcess: true,
          autoCloseAlerts: true,
          soundEnabled: false,
        },

        // UI 액션들
        setOpen: (open) => set((state) => ({
          isOpen: open,
          isMinimized: open ? false : state.isMinimized
        }), false, 'setOpen'),

        setMinimized: (minimized) => set({ isMinimized: minimized }, false, 'setMinimized'),

        setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),

        setFunctionTab: (tab) => set({ functionTab: tab }, false, 'setFunctionTab'),

        setSelectedContext: (context) => set({ selectedContext: context }, false, 'setSelectedContext'),

        // AI 액션들
        setThinking: (thinking) => set({ isThinking: thinking }, false, 'setThinking'),

        setCurrentQuestion: (question) => set({ currentQuestion: question }, false, 'setCurrentQuestion'),

        addLog: (logData) => set((state) => ({
          logs: [...state.logs.slice(-19), { // 최대 20개 유지
            ...logData,
            id: generateId('log'),
            timestamp: new Date().toISOString()
          }]
        }), false, 'addLog'),

        addThinkingStep: (stepData) => set((state) => ({
          thinkingSteps: [...state.thinkingSteps.slice(-19), { // 최대 20개 유지
            ...stepData,
            id: generateId('thinking'),
            timestamp: new Date()
          }]
        }), false, 'addThinkingStep'),

        addResponse: (responseData) => set((state) => ({
          responses: [...state.responses.slice(-9), { // 최대 10개 유지
            ...responseData,
            id: generateId('response'),
            timestamp: new Date().toISOString()
          }]
        }), false, 'addResponse'),

        clearLogs: () => set({ logs: [] }, false, 'clearLogs'),
        clearThinkingSteps: () => set({ thinkingSteps: [] }, false, 'clearThinkingSteps'),
        clearResponses: () => set({ responses: [] }, false, 'clearResponses'),

        // 채팅 Actions
        sendMessage: async (content: string) => {
          const {
            setThinking,
            setCurrentQuestion,
            addMessage,
            addResponse,
            addThinkingStep,
            clearThinkingSteps,
            settings,
            addAlert
          } = get();

          try {
            // 사용자 메시지 추가
            const userMessage = createMessage(content, 'user');
            addMessage(userMessage);

            // AI 처리 시작
            setThinking(true);
            setCurrentQuestion(content);
            clearThinkingSteps();

            // 사고 과정 시뮬레이션
            const thinkingSteps = await simulateThinkingProcess(content);

            // 각 단계를 실시간으로 추가 (설정에 따라)
            if (settings.showThinkingProcess) {
              for (const step of thinkingSteps) {
                addThinkingStep(step);
                await new Promise(resolve => setTimeout(resolve,
                  settings.typingSpeed === 'fast' ? 50 :
                    settings.typingSpeed === 'slow' ? 200 : 100
                ));
              }
            }

            // AI 응답 생성
            const aiResponse = await generateAIResponse(content, get().thinkingSteps);
            addResponse(aiResponse);

            // AI 메시지 추가 (타이핑 효과 포함)
            const assistantMessage = createMessage(
              aiResponse.response,
              'assistant',
              {
                isTyping: true,
                typingSpeed: settings.typingSpeed
              }
            );
            addMessage(assistantMessage);

          } catch (error) {
            console.error('AI 메시지 처리 오류:', error);

            // 에러 알림 추가
            addAlert(createSystemAlert(
              'error',
              'AI 처리 오류',
              'AI 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
            ));
          } finally {
            setThinking(false);
            setCurrentQuestion(null);
          }
        },

        addMessage: (messageData) => set((state) => ({
          messages: [...state.messages.slice(-49), { // 최대 50개 유지
            ...messageData,
            id: generateId('msg'),
            timestamp: typeof messageData.timestamp === 'string' ? messageData.timestamp : new Date().toISOString()
          }]
        }), false, 'addMessage'),

        clearMessages: () => set({ messages: [] }, false, 'clearMessages'),

        // 알림 Actions
        addAlert: (alertData) => set((state) => ({
          alerts: [...state.alerts.slice(-9), { // 최대 10개 유지
            ...alertData,
            id: generateId('alert'),
            timestamp: new Date()
          }]
        }), false, 'addAlert'),

        removeAlert: (id) => set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== id)
        }), false, 'removeAlert'),

        clearAlerts: () => set({ alerts: [] }, false, 'clearAlerts'),

        // 설정 Actions
        updateSettings: (newSettings) => set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }), false, 'updateSettings'),

        // 전체 리셋
        reset: () => set({
          isOpen: false,
          isMinimized: false,
          activeTab: 'chat',
          functionTab: 'qa',
          selectedContext: 'basic',
          isThinking: false,
          currentQuestion: null,
          logs: [],
          thinkingSteps: [],
          responses: [],
          messages: [],
          alerts: [],
          settings: {
            typingSpeed: 'normal',
            showThinkingProcess: true,
            autoCloseAlerts: true,
            soundEnabled: false,
          }
        }, false, 'reset')
      }),
      {
        name: 'ai-sidebar-store',
        partialize: (state) => ({
          // 지속성이 필요한 상태만 저장
          isMinimized: state.isMinimized,
          activeTab: state.activeTab,
          functionTab: state.functionTab,
          selectedContext: state.selectedContext,
          settings: state.settings,
          messages: state.messages.slice(-20), // 최근 20개 메시지만 저장
          responses: state.responses.slice(-5), // 최근 5개 응답만 저장
        }),
      }
    ),
    { name: 'AISidebarStore' }
  )
);

// 🎯 선택자 함수들
export const selectIsAIActive = (state: AISidebarState) =>
  state.isOpen && state.isThinking;

export const selectLatestMessage = (state: AISidebarState) =>
  state.messages[state.messages.length - 1];

export const selectLatestResponse = (state: AISidebarState) =>
  state.responses[state.responses.length - 1];

export const selectRecentLogs = (state: AISidebarState) =>
  state.logs.slice(-10); // 최근 10개만

export const selectRecentThinkingSteps = (state: AISidebarState) =>
  state.thinkingSteps.slice(-10); // 최근 10개만

export const selectActiveAlerts = (state: AISidebarState) =>
  state.alerts.filter(alert =>
    !alert.autoClose ||
    (new Date().getTime() - alert.timestamp.getTime()) < (alert.autoClose * 1000)
  );

export const selectQuickQuestions = () => PRESET_QUESTIONS;

// 🎣 커스텀 훅들
export const useAISidebarUI = () => {
  const store = useAISidebarStore();
  return {
    isOpen: store.isOpen,
    isMinimized: store.isMinimized,
    activeTab: store.activeTab,
    functionTab: store.functionTab,
    selectedContext: store.selectedContext,
    setOpen: store.setOpen,
    setMinimized: store.setMinimized,
    setActiveTab: store.setActiveTab,
    setFunctionTab: store.setFunctionTab,
    setSelectedContext: store.setSelectedContext,
  };
};

export const useAIThinking = () => {
  const store = useAISidebarStore();
  return {
    isThinking: store.isThinking,
    currentQuestion: store.currentQuestion,
    logs: store.logs,
    thinkingSteps: store.thinkingSteps,
    recentSteps: selectRecentThinkingSteps(store),
    addLog: store.addLog,
    addThinkingStep: store.addThinkingStep,
    clearLogs: store.clearLogs,
    clearThinkingSteps: store.clearThinkingSteps,
  };
};

export const useAIChat = () => {
  const store = useAISidebarStore();
  return {
    messages: store.messages,
    responses: store.responses,
    latestMessage: selectLatestMessage(store),
    latestResponse: selectLatestResponse(store),
    sendMessage: store.sendMessage,
    addMessage: store.addMessage,
    clearMessages: store.clearMessages,
  };
};

export const useAIAlerts = () => {
  const store = useAISidebarStore();
  return {
    alerts: store.alerts,
    activeAlerts: selectActiveAlerts(store),
    addAlert: store.addAlert,
    removeAlert: store.removeAlert,
    clearAlerts: store.clearAlerts,
  };
};

export const useAISettings = () => {
  const store = useAISidebarStore();
  return {
    settings: store.settings,
    updateSettings: store.updateSettings,
  };
};

export const useAIContext = () => {
  const store = useAISidebarStore();
  return {
    selectedContext: store.selectedContext,
    setSelectedContext: store.setSelectedContext,
    quickQuestions: selectQuickQuestions(),
    isActive: selectIsAIActive(store),
  };
}; 