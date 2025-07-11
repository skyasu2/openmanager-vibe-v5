/**
 * 🎣 useAIController Hook
 *
 * AI 컨트롤러와 UI를 연결하는 커스텀 훅
 * - 비즈니스 로직과 프레젠테이션 로직 분리
 * - 상태 관리 및 이벤트 처리
 * - 에러 처리 및 로딩 상태 관리
 */

import { useState, useCallback, useRef } from 'react';
import { getAIController } from '@/domains/ai-engine';
import {
  ConversationItem,
  StreamEvent,
  ThinkingStep,
  AIEngineStatus,
} from '@/domains/ai-engine/types';

interface UseAIControllerReturn {
  // 상태
  conversations: ConversationItem[];
  currentIndex: number;
  isProcessing: boolean;
  currentThinkingSteps: ThinkingStep[];
  currentStepIndex: number;
  currentResponse: string;
  streamPhase: 'idle' | 'thinking' | 'responding';

  // 액션
  handleQuery: (question: string) => Promise<void>;
  loadTabData: (tabId: string) => Promise<any>;
  manageSettings: (action: string, data?: any) => Promise<any>;
  getStatus: () => Promise<AIEngineStatus>;

  // 유틸리티
  generateSystemLogs: (question: string) => any[];
  determineCategory: (question: string) => string;

  // 네비게이션
  navigateToConversation: (index: number) => void;

  // 리셋
  resetState: () => void;
}

export function useAIController(): UseAIControllerReturn {
  // AI 컨트롤러 인스턴스
  const aiController = getAIController();

  // 상태 관리
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  // 스트리밍 상태
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<
    ThinkingStep[]
  >([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentResponse, setCurrentResponse] = useState('');
  const [streamPhase, setStreamPhase] = useState<
    'idle' | 'thinking' | 'responding'
  >('idle');

  // 참조
  const currentConversationRef = useRef<ConversationItem | null>(null);

  /**
   * 질의 처리
   */
  const handleQuery = useCallback(
    async (question: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setStreamPhase('thinking');
      setCurrentThinkingSteps([]);
      setCurrentStepIndex(-1);
      setCurrentResponse('');

      try {
        // 스트리밍 이벤트 처리
        const conversation = await new Promise<ConversationItem>(
          (resolve, reject) => {
            let tempConversation: ConversationItem | null = null;

            aiController
              .handleQuery(question)
              .then(result => {
                tempConversation = result;
                resolve(result);
              })
              .catch(reject);

            // 실제로는 스트리밍 이벤트를 받아야 하지만,
            // 현재 구조에서는 시뮬레이션
            simulateStreamingEvents(question);
          }
        );

        // 대화 목록에 추가
        setConversations(prev => [...prev, conversation]);
        setCurrentIndex(conversations.length);
        currentConversationRef.current = conversation;
      } catch (error) {
        console.error('질의 처리 오류:', error);
        // 에러 처리 로직
      } finally {
        setIsProcessing(false);
        setStreamPhase('idle');
      }
    },
    [isProcessing, conversations.length, aiController]
  );

  /**
   * 스트리밍 이벤트 시뮬레이션
   */
  const simulateStreamingEvents = useCallback(async (question: string) => {
    // 사고 과정 시뮬레이션
    const steps = generateThinkingSteps(question);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setCurrentThinkingSteps(prev => [...prev, steps[i]]);
      await delay(1000);
    }

    setStreamPhase('responding');

    // 응답 타이핑 시뮬레이션
    const response =
      'AI 응답이 여기에 표시됩니다. 실제로는 스트리밍으로 받아옵니다.';
    const chunks = response.split(' ');

    for (const chunk of chunks) {
      setCurrentResponse(prev => prev + chunk + ' ');
      await delay(100);
    }
  }, []);

  /**
   * 탭 데이터 로드
   */
  const loadTabData = useCallback(
    async (tabId: string) => {
      try {
        return await aiController.loadTabData(tabId);
      } catch (error) {
        console.error('탭 데이터 로드 오류:', error);
        throw error;
      }
    },
    [aiController]
  );

  /**
   * 설정 관리
   */
  const manageSettings = useCallback(
    async (action: string, data?: any) => {
      try {
        return await aiController.manageSettings(action, data);
      } catch (error) {
        console.error('설정 관리 오류:', error);
        throw error;
      }
    },
    [aiController]
  );

  /**
   * 상태 조회
   */
  const getStatus = useCallback(async () => {
    try {
      return await aiController.getRealServerMetrics().then(r => ({ status: r.success ? 'active' : 'error' }));
    } catch (error) {
      console.error('상태 조회 오류:', error);
      throw error;
    }
  }, [aiController]);

  /**
   * 시스템 로그 생성
   */
  const generateSystemLogs = useCallback((question: string) => {
    // AI 엔진에서 직접 호출
    const aiEngine = getAIController();
    return (aiEngine as any).generateSystemLogs?.(question) || [];
  }, []);

  /**
   * 카테고리 결정
   */
  const determineCategory = useCallback((question: string) => {
    // AI 엔진에서 직접 호출
    const aiEngine = getAIController();
    return (aiEngine as any).determineCategory?.(question) || '일반 질의';
  }, []);

  /**
   * 대화 네비게이션
   */
  const navigateToConversation = useCallback(
    (index: number) => {
      if (index >= 0 && index < conversations.length) {
        setCurrentIndex(index);
        currentConversationRef.current = conversations[index];
      }
    },
    [conversations]
  );

  /**
   * 상태 리셋
   */
  const resetState = useCallback(() => {
    setConversations([]);
    setCurrentIndex(-1);
    setIsProcessing(false);
    setCurrentThinkingSteps([]);
    setCurrentStepIndex(-1);
    setCurrentResponse('');
    setStreamPhase('idle');
    currentConversationRef.current = null;
  }, []);

  return {
    // 상태
    conversations,
    currentIndex,
    isProcessing,
    currentThinkingSteps,
    currentStepIndex,
    currentResponse,
    streamPhase,

    // 액션
    handleQuery,
    loadTabData,
    manageSettings,
    getStatus,

    // 유틸리티
    generateSystemLogs,
    determineCategory,

    // 네비게이션
    navigateToConversation,

    // 리셋
    resetState,
  };
}

/**
 * 헬퍼 함수들
 */

function generateThinkingSteps(question: string): ThinkingStep[] {
  return [
    {
      id: 'step1',
      title: '질문 분석 중...',
      content: '사용자의 질문을 분석하고 있습니다.',
      logs: [],
      progress: 25,
      completed: false,
      timestamp: Date.now(),
    },
    {
      id: 'step2',
      title: '데이터 수집 중...',
      content: '관련 데이터를 수집하고 있습니다.',
      logs: [],
      progress: 50,
      completed: false,
      timestamp: Date.now(),
    },
    {
      id: 'step3',
      title: '분석 중...',
      content: '수집된 데이터를 분석하고 있습니다.',
      logs: [],
      progress: 75,
      completed: false,
      timestamp: Date.now(),
    },
    {
      id: 'step4',
      title: '답변 생성 중...',
      content: '최적의 답변을 생성하고 있습니다.',
      logs: [],
      progress: 100,
      completed: true,
      timestamp: Date.now(),
    },
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
