'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 📊 AI 에이전트 로그 타입
export interface AgentLog {
  step: string;
  detail: string;
  time: string;
  type: 'context' | 'match' | 'generate' | 'validation';
  status: 'processing' | 'completed' | 'error';
  duration?: number;
}

// 🤖 AI 응답 타입
export interface AIResponse {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  processingTime: number;
  logs: AgentLog[];
  timestamp: Date;
}

// 🎯 프리셋 질문 타입
export interface PresetQuestion {
  id: string;
  category: 'performance' | 'security' | 'analysis' | 'prediction';
  title: string;
  description: string;
  query: string;
  icon?: string;
}

// 📱 AI 사이드바 상태
interface AISidebarState {
  // 🎛️ UI 상태
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'chat' | 'thinking' | 'presets' | 'settings';
  isMobile: boolean;
  
  // 🧠 AI 처리 상태
  isThinking: boolean;
  activeStep: 'context' | 'match' | 'generate' | 'validation' | null;
  thinkingLogs: string[];
  processingProgress: number;
  
  // 💬 채팅 및 응답
  currentQuestion: string;
  aiResponse: string;
  responses: AIResponse[];
  activePreset: PresetQuestion | null;
  
  // 📊 성능 및 통계
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  
  // ⚠️ 에러 상태
  lastError: string | null;
  isError: boolean;
}

// 🎯 액션 타입
interface AISidebarActions {
  // UI 제어
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (tab: AISidebarState['activeTab']) => void;
  setMobile: (mobile: boolean) => void;
  
  // AI 처리 제어
  startThinking: (question: string) => void;
  setActiveStep: (step: AISidebarState['activeStep']) => void;
  addThinkingLog: (log: string) => void;
  setProgress: (progress: number) => void;
  finishThinking: (response: string, logs: AgentLog[]) => void;
  
  // 채팅 관리
  setCurrentQuestion: (question: string) => void;
  setAIResponse: (response: string) => void;
  addResponse: (response: AIResponse) => void;
  setActivePreset: (preset: PresetQuestion | null) => void;
  clearChat: () => void;
  
  // 에러 관리
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 통계 업데이트
  updateStats: (responseTime: number, success: boolean) => void;
  
  // 리셋
  reset: () => void;
}

// 🏪 Zustand 스토어
export const useAISidebarStore = create<AISidebarState & AISidebarActions>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      isOpen: false,
      isMinimized: false,
      activeTab: 'chat',
      isMobile: false,
      
      isThinking: false,
      activeStep: null,
      thinkingLogs: [],
      processingProgress: 0,
      
      currentQuestion: '',
      aiResponse: '',
      responses: [],
      activePreset: null,
      
      totalQueries: 0,
      averageResponseTime: 0,
      successRate: 100,
      
      lastError: null,
      isError: false,
      
      // UI 액션
      setOpen: (open) => set({ isOpen: open }),
      setMinimized: (minimized) => set({ isMinimized: minimized }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setMobile: (mobile) => set({ isMobile: mobile }),
      
      // AI 처리 액션
      startThinking: (question) => set({
        isThinking: true,
        currentQuestion: question,
        thinkingLogs: [],
        processingProgress: 0,
        activeStep: 'context',
        isError: false,
        lastError: null
      }),
      
      setActiveStep: (step) => set({ activeStep: step }),
      
      addThinkingLog: (log) => set((state) => ({
        thinkingLogs: [...state.thinkingLogs, log]
      })),
      
      setProgress: (progress) => set({ processingProgress: progress }),
      
      finishThinking: (response, logs) => {
        const state = get();
        const processingTime = logs.reduce((total, log) => total + (log.duration || 0), 0);
        
        const newResponse: AIResponse = {
          id: Date.now().toString(),
          question: state.currentQuestion,
          answer: response,
          confidence: Math.random() * 0.3 + 0.7, // 70-100%
          processingTime,
          logs,
          timestamp: new Date()
        };
        
        set({
          isThinking: false,
          activeStep: null,
          aiResponse: response,
          responses: [...state.responses, newResponse],
          processingProgress: 100
        });
        
        // 통계 업데이트
        get().updateStats(processingTime, true);
      },
      
      // 채팅 액션
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setAIResponse: (response) => set({ aiResponse: response }),
      
      addResponse: (response) => set((state) => ({
        responses: [...state.responses, response]
      })),
      
      setActivePreset: (preset) => set({ activePreset: preset }),
      
      clearChat: () => set({
        responses: [],
        currentQuestion: '',
        aiResponse: '',
        activePreset: null
      }),
      
      // 에러 액션
      setError: (error) => set({
        lastError: error,
        isError: !!error,
        isThinking: false
      }),
      
      clearError: () => set({ lastError: null, isError: false }),
      
      // 통계 액션
      updateStats: (responseTime, success) => set((state) => {
        const newTotal = state.totalQueries + 1;
        const newAverage = ((state.averageResponseTime * state.totalQueries) + responseTime) / newTotal;
        const successCount = success ? 
          Math.floor(state.successRate * state.totalQueries / 100) + 1 :
          Math.floor(state.successRate * state.totalQueries / 100);
        
        return {
          totalQueries: newTotal,
          averageResponseTime: newAverage,
          successRate: newTotal > 0 ? (successCount / newTotal) * 100 : 100
        };
      }),
      
      // 리셋 액션
      reset: () => set({
        isThinking: false,
        activeStep: null,
        thinkingLogs: [],
        processingProgress: 0,
        currentQuestion: '',
        aiResponse: '',
        responses: [],
        activePreset: null,
        lastError: null,
        isError: false
      })
    }),
    {
      name: 'ai-sidebar-store',
      partialize: (state: AISidebarState & AISidebarActions) => ({
        responses: state.responses,
        totalQueries: state.totalQueries,
        averageResponseTime: state.averageResponseTime,
        successRate: state.successRate
      })
    }
  )
);

// 🎯 프리셋 질문 데이터
export const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'perf-1',
    category: 'performance',
    title: 'CPU 사용률 분석',
    description: '현재 서버들의 CPU 사용률과 성능 병목 지점을 분석합니다',
    query: '현재 서버들의 CPU 사용률이 어떻게 되나요? 성능 병목이 있는 서버를 찾아주세요.',
    icon: '🔥'
  },
  {
    id: 'perf-2', 
    category: 'performance',
    title: '메모리 최적화',
    description: '메모리 사용량이 높은 서버들을 식별하고 최적화 방안을 제시합니다',
    query: '메모리 사용량이 높은 서버들을 찾아서 최적화 방안을 알려주세요.',
    icon: '💾'
  },
  {
    id: 'sec-1',
    category: 'security',
    title: '보안 위험 탐지',
    description: '시스템 전반의 보안 위험 요소를 탐지하고 대응방안을 제시합니다',
    query: '현재 시스템에서 보안 위험이 있는 서버나 취약점이 있는지 확인해주세요.',
    icon: '🛡️'
  },
  {
    id: 'pred-1',
    category: 'prediction',
    title: '서버 확장 예측',
    description: '현재 트렌드를 바탕으로 서버 확장 시점과 규모를 예측합니다',
    query: '현재 트렌드를 보면 언제쯤 서버를 확장해야 할까요? 예측 분석을 해주세요.',
    icon: '📈'
  },
  {
    id: 'analysis-1',
    category: 'analysis',
    title: '종합 상태 분석',
    description: '전체 시스템의 건강 상태를 종합적으로 분석하고 개선점을 제안합니다',
    query: '전체 시스템의 현재 상태를 종합적으로 분석하고 개선할 점을 알려주세요.',
    icon: '🔍'
  }
];

// 🪝 편의 훅들
export const useAISidebarUI = () => {
  const { isOpen, isMinimized, activeTab, isMobile, setOpen, setMinimized, setActiveTab, setMobile } = useAISidebarStore();
  return { isOpen, isMinimized, activeTab, isMobile, setOpen, setMinimized, setActiveTab, setMobile };
};

export const useAIThinking = () => {
  const { 
    isThinking, 
    activeStep, 
    thinkingLogs, 
    processingProgress,
    startThinking,
    setActiveStep,
    addThinkingLog,
    setProgress,
    finishThinking
  } = useAISidebarStore();
  
  return { 
    isThinking, 
    activeStep, 
    thinkingLogs, 
    processingProgress,
    startThinking,
    setActiveStep,
    addThinkingLog,
    setProgress,
    finishThinking
  };
};

export const useAIChat = () => {
  const {
    currentQuestion,
    aiResponse,
    responses,
    activePreset,
    setCurrentQuestion,
    setAIResponse,
    addResponse,
    setActivePreset,
    clearChat
  } = useAISidebarStore();
  
  return {
    currentQuestion,
    aiResponse,
    responses,
    activePreset,
    setCurrentQuestion,
    setAIResponse,
    addResponse,
    setActivePreset,
    clearChat
  };
}; 