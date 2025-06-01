/**
 * 🤖 AI 사이드바 통합 상태 관리 스토어 - Vercel 최적화
 * 
 * ⚡ Vercel 서버리스 환경 최적화:
 * - SSR 안전성 보장
 * - 지연 로딩 지원
 * - 메모리 사용량 최적화
 * - Edge Runtime 호환
 */

'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// 🔧 타입 정의 (최적화)
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

// 🎯 프리셋 질문 상수 (메모리 최적화)
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
  { id: 'sec-4', question: '최근 보안 로그에서 특이사항을 찾아주세요', category: 'security' },
  
  // 예측 분석
  { id: 'pred-1', question: '향후 1시간 내 장애 가능성이 있는 서버는?', category: 'prediction' },
  { id: 'pred-2', question: '리소스 부족으로 인한 문제가 예상되는 곳은?', category: 'prediction', isAIRecommended: true },
  { id: 'pred-3', question: '내일까지 주의 깊게 모니터링해야 할 서버는?', category: 'prediction' },
  { id: 'pred-4', question: '확장이 필요한 서버나 서비스를 추천해주세요', category: 'prediction' },
  
  // 종합 분석
  { id: 'anal-1', question: '전체 인프라의 상태를 종합적으로 분석해주세요', category: 'analysis' },
  { id: 'anal-2', question: '최적화가 필요한 부분을 우선순위별로 알려주세요', category: 'analysis', isAIRecommended: true },
  { id: 'anal-3', question: '비용 절감을 위한 개선사항을 제안해주세요', category: 'analysis' },
  { id: 'anal-4', question: '현재 운영 중인 서비스의 안정성을 평가해주세요', category: 'analysis' }
] as const;

// 🏪 메인 스토어 인터페이스
interface AISidebarState {
  // UI 상태
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'chat' | 'presets' | 'thinking' | 'settings';
  
  // AI 상태
  isThinking: boolean;
  currentQuestion: string;
  logs: AgentLog[];
  responses: AIResponse[];
  
  // 성능 최적화를 위한 상태 분리
  uiState: {
    activeTab: 'chat' | 'presets' | 'thinking' | 'settings';
    isMinimized: boolean;
  };
  
  // 액션들
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (tab: 'chat' | 'presets' | 'thinking' | 'settings') => void;
  setThinking: (thinking: boolean) => void;
  setCurrentQuestion: (question: string) => void;
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearResponses: () => void;
  reset: () => void;
}

// 🔧 초기 상태 (SSR 안전)
const getInitialState = (): AISidebarState => ({
  isOpen: false,
  isMinimized: false,
  activeTab: 'chat',
  isThinking: false,
  currentQuestion: '',
  logs: [],
  responses: [],
  uiState: {
    activeTab: 'chat',
    isMinimized: false
  },
  // 액션들 (임시 - 실제로는 create에서 구현됨)
  setOpen: () => {},
  setMinimized: () => {},
  setActiveTab: () => {},
  setThinking: () => {},
  setCurrentQuestion: () => {},
  addLog: () => {},
  addResponse: () => {},
  clearLogs: () => {},
  clearResponses: () => {},
  reset: () => {}
});

// ⚡ 메인 스토어 (Vercel 최적화)
export const useAISidebarStore = create<AISidebarState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        isOpen: false,
        isMinimized: false,
        activeTab: 'chat',
        isThinking: false,
        currentQuestion: '',
        logs: [],
        responses: [],
        uiState: {
          activeTab: 'chat',
          isMinimized: false
        },
        
        // UI 액션들 (최적화된)
        setOpen: (open) => set((state) => ({ 
          isOpen: open,
          // 열릴 때 최소화 해제
          isMinimized: open ? false : state.isMinimized 
        })),
        
        setMinimized: (minimized) => set({ isMinimized: minimized }),
        
        setActiveTab: (tab) => set((state) => ({
          activeTab: tab,
          uiState: { ...state.uiState, activeTab: tab }
        })),
        
        // AI 액션들
        setThinking: (thinking) => set({ isThinking: thinking }),
        setCurrentQuestion: (question) => set({ currentQuestion: question }),
        
        addLog: (logData) => set((state) => ({
          logs: [...state.logs, {
            ...logData,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          }]
        })),
        
        addResponse: (responseData) => set((state) => ({
          responses: [...state.responses, {
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
          isThinking: false,
          currentQuestion: '',
          logs: [],
          responses: [],
          uiState: {
            activeTab: 'chat',
            isMinimized: false
          }
        })
      }),
      {
        name: 'ai-sidebar-storage',
        // 중요한 상태만 저장
        partialize: (state) => ({
          isOpen: state.isOpen,
          activeTab: state.activeTab,
          isMinimized: state.isMinimized
        })
      }
    ),
    { name: 'ai-sidebar-store' }
  )
);

// 🎯 성능 최적화된 개별 훅들
export const useAISidebarUI = () => 
  useAISidebarStore(
    (state) => ({
      isOpen: state.isOpen,
      isMinimized: state.isMinimized,
      activeTab: state.activeTab,
      setOpen: state.setOpen,
      setMinimized: state.setMinimized,
      setActiveTab: state.setActiveTab
    }),
    shallow
  );

export const useAIThinking = () =>
  useAISidebarStore(
    (state) => ({
      isThinking: state.isThinking,
      currentQuestion: state.currentQuestion,
      logs: state.logs,
      setThinking: state.setThinking,
      setCurrentQuestion: state.setCurrentQuestion,
      addLog: state.addLog,
      clearLogs: state.clearLogs
    }),
    shallow
  );

export const useAIChat = () =>
  useAISidebarStore(
    (state) => ({
      responses: state.responses,
      addResponse: state.addResponse,
      clearResponses: state.clearResponses
    }),
    shallow
  );

// 🧩 유틸리티 훅들
export const useAISidebarActions = () =>
  useAISidebarStore(
    (state) => ({
      reset: state.reset,
      clearLogs: state.clearLogs,
      clearResponses: state.clearResponses
    }),
    shallow
  );

// 📊 선택자들 (메모이제이션 최적화)
export const selectIsAIActive = (state: AISidebarState) => state.isOpen && state.isThinking;
export const selectLatestResponse = (state: AISidebarState) => 
  state.responses[state.responses.length - 1];
export const selectRecentLogs = (state: AISidebarState) => 
  state.logs.slice(-10); // 최근 10개만

// 🔄 구독 헬퍼 (필요시 사용)
export const subscribeToAIState = (callback: (isActive: boolean) => void) =>
  useAISidebarStore.subscribe(
    selectIsAIActive,
    callback
  ); 