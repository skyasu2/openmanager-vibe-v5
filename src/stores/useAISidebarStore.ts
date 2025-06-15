/**
 * 🤖 AI 사이드바 통합 상태 관리 스토어 - 최적화 버전
 *
 * ⚡ 최적화 사항:
 * - SSR 안전성 보장
 * - 메모리 사용량 최적화
 * - 함수 패널 기능 통합
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
  type:
    | 'analysis'
    | 'reasoning'
    | 'data_processing'
    | 'pattern_matching'
    | 'response_generation';
  timestamp: string;
  duration?: number;
  progress?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface AIResponse {
  id: string;
  query: string;
  response: string;
  confidence: number;
  timestamp: string;
  context?: string;
}

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
  responses: AIResponse[];

  // 채팅 관련
  messages: ChatMessage[];

  // 액션들
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (
    tab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions'
  ) => void;
  setFunctionTab: (
    tab: 'qa' | 'report' | 'patterns' | 'logs' | 'context'
  ) => void;
  setSelectedContext: (context: 'basic' | 'advanced' | 'custom') => void;
  setThinking: (thinking: boolean) => void;
  setCurrentQuestion: (question: string | null) => void;
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearResponses: () => void;
  reset: () => void;

  // 채팅 Actions
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

// ⚡ 메인 스토어 (최적화)
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
        responses: [],
        messages: [],

        // UI 액션들
        setOpen: open =>
          set(state => ({
            isOpen: open,
            isMinimized: open ? false : state.isMinimized,
          })),

        setMinimized: minimized => set({ isMinimized: minimized }),

        setActiveTab: tab => set({ activeTab: tab }),

        setFunctionTab: tab => set({ functionTab: tab }),

        setSelectedContext: context => set({ selectedContext: context }),

        // AI 액션들
        setThinking: thinking => set({ isThinking: thinking }),
        setCurrentQuestion: question => set({ currentQuestion: question }),

        addLog: logData =>
          set(state => ({
            logs: [
              ...state.logs.slice(-19),
              {
                // 최대 20개 유지
                ...logData,
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
              },
            ],
          })),

        addResponse: responseData =>
          set(state => ({
            responses: [
              ...state.responses.slice(-9),
              {
                // 최대 10개 유지
                ...responseData,
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
              },
            ],
          })),

        clearLogs: () => set({ logs: [] }),
        clearResponses: () => set({ responses: [] }),

        reset: () =>
          set({
            isOpen: false,
            isMinimized: false,
            activeTab: 'chat',
            functionTab: 'qa',
            selectedContext: 'basic',
            isThinking: false,
            currentQuestion: null,
            logs: [],
            responses: [],
            messages: [],
          }),

        // 채팅 Actions
        sendMessage: async (content: string) => {
          const { messages, setThinking, addLog, clearLogs } = get();

          // 사용자 메시지 추가
          const userMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
          };

          set({ messages: [...messages, userMessage] });

          // AI 처리 시작
          setThinking(true);
          clearLogs();

          try {
            // 실제 AI 처리 과정 시뮬레이션
            const thinkingSteps = [
              {
                type: 'context',
                message: '컨텍스트 분석 중...',
                progress: 0.2,
              },
              {
                type: 'match',
                message: 'MCP 서버에서 관련 문서 검색 중...',
                progress: 0.4,
              },
              { type: 'generate', message: '응답 생성 중...', progress: 0.7 },
              { type: 'validation', message: '응답 검증 중...', progress: 1.0 },
            ];

            for (const step of thinkingSteps) {
              addLog({
                step: step.type,
                content: step.message,
                type: step.type as any,
                progress: step.progress,
              });

              // 단계별 지연
              await new Promise(resolve =>
                setTimeout(resolve, 800 + Math.random() * 400)
              );
            }

            // 실제 AI API 호출 시도
            let aiResponse = '';
            try {
              const response = await fetch('/api/mcp/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: content,
                  sessionId: `session_${Date.now()}`,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                aiResponse =
                  data.response ||
                  `MCP 서버를 통해 "${content}"에 대한 분석을 완료했습니다.`;
              } else {
                throw new Error('MCP API 호출 실패');
              }
            } catch (error) {
              console.warn('MCP API 실패, RAG 폴백 시도:', error);

              // RAG 폴백 시도
              try {
                const ragResponse = await fetch('/api/ai/hybrid', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    query: content,
                    mode: 'rag-only',
                  }),
                });

                if (ragResponse.ok) {
                  const ragData = await ragResponse.json();
                  aiResponse =
                    ragData.response ||
                    `로컬 RAG 엔진을 통해 "${content}"에 대한 분석을 완료했습니다.`;
                } else {
                  throw new Error('RAG 폴백도 실패');
                }
              } catch (ragError) {
                console.warn('RAG 폴백도 실패:', ragError);
                aiResponse = `죄송합니다. "${content}"에 대한 분석 중 문제가 발생했습니다. 시스템 상태를 확인해주세요.`;
              }
            }

            // AI 응답 메시지 추가
            const assistantMessage: ChatMessage = {
              id: `msg_${Date.now() + 1}`,
              content: aiResponse,
              role: 'assistant',
              timestamp: new Date().toISOString(),
            };

            const currentMessages = get().messages;
            set({ messages: [...currentMessages, assistantMessage] });
          } finally {
            setThinking(false);
          }
        },
        clearMessages: () => set({ messages: [] }),
      }),
      {
        name: 'ai-sidebar-storage',
        partialize: state => ({
          // 중요한 상태만 영속화
          isMinimized: state.isMinimized,
          activeTab: state.activeTab,
          functionTab: state.functionTab,
          selectedContext: state.selectedContext,
        }),
      }
    ),
    { name: 'AISidebarStore' }
  )
);

// 🎛️ 선택적 훅들 (성능 최적화)
export const useAISidebarUI = () => {
  const isOpen = useAISidebarStore(state => state.isOpen);
  const isMinimized = useAISidebarStore(state => state.isMinimized);
  const activeTab = useAISidebarStore(state => state.activeTab);
  const functionTab = useAISidebarStore(state => state.functionTab);
  const setOpen = useAISidebarStore(state => state.setOpen);
  const setMinimized = useAISidebarStore(state => state.setMinimized);
  const setActiveTab = useAISidebarStore(state => state.setActiveTab);
  const setFunctionTab = useAISidebarStore(state => state.setFunctionTab);

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

export const useAIThinking = () => {
  const isThinking = useAISidebarStore(state => state.isThinking);
  const currentQuestion = useAISidebarStore(state => state.currentQuestion);
  const logs = useAISidebarStore(state => state.logs);
  const setThinking = useAISidebarStore(state => state.setThinking);
  const setCurrentQuestion = useAISidebarStore(
    state => state.setCurrentQuestion
  );
  const addLog = useAISidebarStore(state => state.addLog);
  const clearLogs = useAISidebarStore(state => state.clearLogs);

  return {
    isThinking,
    currentQuestion,
    logs,
    setThinking,
    setCurrentQuestion,
    addLog,
    clearLogs,
  };
};

export const useAIChat = () => {
  const responses = useAISidebarStore(state => state.responses);
  const addResponse = useAISidebarStore(state => state.addResponse);
  const clearResponses = useAISidebarStore(state => state.clearResponses);

  return {
    responses,
    addResponse,
    clearResponses,
  };
};

export const useAIContext = () => {
  const selectedContext = useAISidebarStore(state => state.selectedContext);
  const setSelectedContext = useAISidebarStore(
    state => state.setSelectedContext
  );

  return {
    selectedContext,
    setSelectedContext,
  };
};

// 🔍 선택자 함수들 (메모화)
export const selectIsAIActive = (state: AISidebarState) =>
  state.isOpen && state.isThinking;
export const selectLatestResponse = (state: AISidebarState) =>
  state.responses[state.responses.length - 1];
export const selectLatestMessage = (state: AISidebarState) =>
  state.messages[state.messages.length - 1];
export const selectRecentLogs = (state: AISidebarState) =>
  state.logs.slice(-10); // 최근 10개만
export const selectRecentThinkingSteps = (state: AISidebarState) =>
  state.logs.filter(log => log.type === 'reasoning').slice(-5);
export const selectActiveAlerts = (state: AISidebarState) =>
  state.logs.filter(log => log.type === 'analysis' && log.progress && log.progress < 1);
export const selectQuickQuestions = (state: AISidebarState) => [
  { id: '1', question: '현재 시스템 상태는?', category: 'performance' as const },
  { id: '2', question: '보안 위험 요소는?', category: 'security' as const },
  { id: '3', question: '성능 예측 분석', category: 'prediction' as const },
  { id: '4', question: '로그 패턴 분석', category: 'analysis' as const },
];

// 🎛️ 추가 훅들
export const useAIAlerts = () => {
  const alerts = useAISidebarStore(selectActiveAlerts);
  return { alerts };
};

export const useAISettings = () => {
  const selectedContext = useAISidebarStore(state => state.selectedContext);
  const setSelectedContext = useAISidebarStore(state => state.setSelectedContext);
  
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
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}
