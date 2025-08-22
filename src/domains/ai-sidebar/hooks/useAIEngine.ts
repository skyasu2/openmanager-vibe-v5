/**
 * AI 엔진 관리 Custom Hook
 * AI 모드 선택 및 엔진 상태 관리
 */

import { useCallback, useState } from 'react';
import type { AIMode } from '@/types/ai-types';
import type { ChatMessage } from '@/stores/useAISidebarStore';

export interface UseAIEngineReturn {
  // 상태
  selectedEngine: AIMode;
  showEngineInfo: boolean;
  isChangingEngine: boolean;

  // 액션
  setSelectedEngine: (engine: AIMode) => void;
  toggleEngineInfo: () => void;
  handleModeChange: (newMode: AIMode) => Promise<ChatMessage | null>;
  
  // 테스트 호환성을 위한 추가 메서드
  setEngine: (engine: AIMode) => void;
  isEngineAvailable: (engine: AIMode) => boolean;
}

/**
 * AI 엔진 관리 Custom Hook
 * AI 모드 선택 및 엔진 상태 관리
 */

import { useCallback, useState, useEffect } from 'react';
import type { AIMode } from '@/types/ai-types';
import type { ChatMessage } from '@/stores/useAISidebarStore';

// 테스트 호환성을 위한 엔진 타입 확장
type ExtendedAIMode = AIMode | 'UNIFIED' | 'GOOGLE_ONLY';

export interface UseAIEngineReturn {
  // 상태 (테스트 호환성)
  currentEngine: ExtendedAIMode;
  selectedEngine: ExtendedAIMode; // 기존 코드 호환성
  showEngineInfo: boolean;
  isChangingEngine: boolean;

  // 액션
  setSelectedEngine: (engine: ExtendedAIMode) => void;
  toggleEngineInfo: () => void;
  handleModeChange: (newMode: AIMode) => Promise<ChatMessage | null>;
  
  // 테스트 호환성을 위한 메서드
  setEngine: (engine: ExtendedAIMode) => void;
  isEngineAvailable: (engine: ExtendedAIMode) => boolean;
  getEngineDisplayName: (engine: ExtendedAIMode) => string;
  getEngineDescription: (engine: ExtendedAIMode) => string;
  getEngineEndpoint: (engine: ExtendedAIMode) => string;
}

const STORAGE_KEY = 'selected-ai-engine';

// 엔진 설정 맵
const ENGINE_CONFIG = {
  UNIFIED: {
    displayName: '통합 AI 엔진',
    description: '모든 AI 엔진 통합 - 최적의 성능과 유연성 제공',
    endpoint: '/api/ai/edge-v2'
  },
  GOOGLE_ONLY: {
    displayName: 'Google AI Only', 
    description: 'Google AI만 사용 - 고급 자연어 처리와 추론 능력',
    endpoint: '/api/ai/google-ai/generate'
  },
  LOCAL: {
    displayName: '로컬 MCP',
    description: '로컬 MCP 서버 - 프라이버시 보장과 오프라인 동작',
    endpoint: '/api/mcp/query'
  },
  GOOGLE_AI: {
    displayName: 'Google AI',
    description: 'Google AI 모드 - 클라우드 기반 AI 처리',
    endpoint: '/api/ai/google-ai/generate'
  }
} as const;

// 엔진 유효성 검사 - useState 초기화 전에 정의
function isEngineValid(engine: string): engine is ExtendedAIMode {
  return Object.keys(ENGINE_CONFIG).includes(engine);
}

export function useAIEngine(
  initialEngine: ExtendedAIMode = 'UNIFIED'
): UseAIEngineReturn {
  // localStorage에서 저장된 엔진 복원
  const [currentEngine, setCurrentEngine] = useState<ExtendedAIMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ExtendedAIMode;
      if (saved && isEngineValid(saved)) {
        return saved;
      }
    }
    return initialEngine;
  });

  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const [isChangingEngine, setIsChangingEngine] = useState(false);

  // localStorage에 엔진 선택 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, currentEngine);
    }
  }, [currentEngine]);



  // 엔진 가용성 확인
  const isEngineAvailable = useCallback((engine: ExtendedAIMode): boolean => {
    return Object.keys(ENGINE_CONFIG).includes(engine);
  }, []);

  // 엔진 표시 이름 가져오기
  const getEngineDisplayName = useCallback((engine: ExtendedAIMode): string => {
    return ENGINE_CONFIG[engine]?.displayName || engine;
  }, []);

  // 엔진 설명 가져오기  
  const getEngineDescription = useCallback((engine: ExtendedAIMode): string => {
    return ENGINE_CONFIG[engine]?.description || `${engine} 엔진`;
  }, []);

  // 엔진 API 엔드포인트 가져오기
  const getEngineEndpoint = useCallback((engine: ExtendedAIMode): string => {
    return ENGINE_CONFIG[engine]?.endpoint || '/api/ai/query';
  }, []);

  // 엔진 설정 (localStorage 포함)
  const setEngine = useCallback((engine: ExtendedAIMode) => {
    if (!isEngineAvailable(engine)) {
      console.warn(`Invalid engine: ${engine}, falling back to UNIFIED`);
      setCurrentEngine('UNIFIED');
      return;
    }
    setCurrentEngine(engine);
  }, [isEngineAvailable]);

  // 기존 호환성을 위한 setSelectedEngine
  const setSelectedEngine = useCallback((engine: ExtendedAIMode) => {
    setEngine(engine);
  }, [setEngine]);

  // 엔진 정보 토글
  const toggleEngineInfo = useCallback(() => {
    setShowEngineInfo((prev) => !prev);
  }, []);

  // AI 모드 변경 핸들러 (기존 호환성)
  const handleModeChange = useCallback(
    async (newMode: AIMode): Promise<ChatMessage | null> => {
      try {
        setIsChangingEngine(true);
        
        // AIMode를 ExtendedAIMode로 매핑
        let mappedEngine: ExtendedAIMode = newMode;
        if (newMode === 'GOOGLE_AI') {
          mappedEngine = 'GOOGLE_ONLY';
        }
        
        setEngine(mappedEngine);

        console.log(`🔄 AI 모드 변경: ${mappedEngine}`);

        const message: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `AI 모드가 ${getEngineDisplayName(mappedEngine)}로 변경되었습니다.`,
          timestamp: new Date(),
        };

        return message;
      } catch (error) {
        console.error('AI 모드 변경 실패:', error);

        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `AI 모드 변경에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };

        return errorMessage;
      } finally {
        setIsChangingEngine(false);
        setShowEngineInfo(false);
      }
    },
    [setEngine, getEngineDisplayName]
  );

  return {
    // 상태 (테스트 호환성)
    currentEngine,
    selectedEngine: currentEngine, // 기존 코드 호환성
    showEngineInfo,
    isChangingEngine,

    // 액션
    setSelectedEngine,
    toggleEngineInfo,
    handleModeChange,
    
    // 테스트 호환성 메서드
    setEngine,
    isEngineAvailable,
    getEngineDisplayName,
    getEngineDescription,
    getEngineEndpoint,
  };
}
