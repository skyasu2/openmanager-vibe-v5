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
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  timestamp: string;
  duration?: number;
  progress?: number;
}

export interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  timestamp: string;
  metadata?: {
    processingTime?: number;
    sources?: string[];
    reasoning?: string[];
  };
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
  currentQuestion: string;
  logs: AgentLog[];
  responses: AIResponse[];
  
  // 액션들
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (tab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions') => void;
  setFunctionTab: (tab: 'qa' | 'report' | 'patterns' | 'logs' | 'context') => void;
  setSelectedContext: (context: 'basic' | 'advanced' | 'custom') => void;
  setThinking: (thinking: boolean) => void;
  setCurrentQuestion: (question: string) => void;
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearResponses: () => void;
  reset: () => void;
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
        currentQuestion: '',
        logs: [],
        responses: [],
        
        // UI 액션들
        setOpen: (open) => set((state) => ({ 
          isOpen: open,
          isMinimized: open ? false : state.isMinimized 
        })),
        
        setMinimized: (minimized) => set({ isMinimized: minimized }),
        
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        setFunctionTab: (tab) => set({ functionTab: tab }),
        
        setSelectedContext: (context) => set({ selectedContext: context }),
        
        // AI 액션들
        setThinking: (thinking) => set({ isThinking: thinking }),
        setCurrentQuestion: (question) => set({ currentQuestion: question }),
        
        addLog: (logData) => set((state) => ({
          logs: [...state.logs.slice(-19), { // 최대 20개 유지
            ...logData,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          }]
        })),
        
        addResponse: (responseData) => set((state) => ({
          responses: [...state.responses.slice(-9), { // 최대 10개 유지
            ...responseData,
            id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          }]
        })),
        
        clearLogs: () => set({ logs: [] }),
        clearResponses: () => set({ responses: [] }),
        
        reset: () => set({
          isOpen: false,
          isMinimized: false,
          activeTab: 'chat',
          functionTab: 'qa',
          selectedContext: 'basic',
          isThinking: false,
          currentQuestion: '',
          logs: [],
          responses: []
        })
      }),
      {
        name: 'ai-sidebar-storage',
        partialize: (state) => ({
          // 중요한 상태만 영속화
          isMinimized: state.isMinimized,
          activeTab: state.activeTab,
          functionTab: state.functionTab,
          selectedContext: state.selectedContext
        })
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
    setFunctionTab
  };
};

export const useAIThinking = () => {
  const isThinking = useAISidebarStore((state) => state.isThinking);
  const currentQuestion = useAISidebarStore((state) => state.currentQuestion);
  const logs = useAISidebarStore((state) => state.logs);
  const setThinking = useAISidebarStore((state) => state.setThinking);
  const setCurrentQuestion = useAISidebarStore((state) => state.setCurrentQuestion);
  const addLog = useAISidebarStore((state) => state.addLog);
  const clearLogs = useAISidebarStore((state) => state.clearLogs);
  
  return {
    isThinking,
    currentQuestion,
    logs,
    setThinking,
    setCurrentQuestion,
    addLog,
    clearLogs
  };
};

export const useAIChat = () => {
  const responses = useAISidebarStore((state) => state.responses);
  const addResponse = useAISidebarStore((state) => state.addResponse);
  const clearResponses = useAISidebarStore((state) => state.clearResponses);
  
  return {
    responses,
    addResponse,
    clearResponses
  };
};

export const useAIContext = () => {
  const selectedContext = useAISidebarStore((state) => state.selectedContext);
  const setSelectedContext = useAISidebarStore((state) => state.setSelectedContext);
  
  return {
    selectedContext,
    setSelectedContext
  };
};

// 🔍 선택자 함수들 (메모화)
export const selectIsAIActive = (state: AISidebarState) => state.isOpen && state.isThinking;
export const selectLatestResponse = (state: AISidebarState) => 
  state.responses[state.responses.length - 1];
export const selectRecentLogs = (state: AISidebarState) => 
  state.logs.slice(-10); // 최근 10개만 