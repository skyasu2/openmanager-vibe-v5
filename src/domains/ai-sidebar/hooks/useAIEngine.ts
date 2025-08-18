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
}

export function useAIEngine(
  initialEngine: AIMode = 'LOCAL'
): UseAIEngineReturn {
  const [selectedEngine, setSelectedEngine] = useState<AIMode>(initialEngine);
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const [isChangingEngine, setIsChangingEngine] = useState(false);

  // 엔진 정보 토글
  const toggleEngineInfo = useCallback(() => {
    setShowEngineInfo((prev) => !prev);
  }, []);

  // AI 모드 변경 핸들러
  const handleModeChange = useCallback(
    async (newMode: AIMode): Promise<ChatMessage | null> => {
      try {
        setIsChangingEngine(true);
        setSelectedEngine(newMode);

        // 모드 변경은 로컬 상태만 업데이트
        console.log(`🔄 AI 모드 변경: ${newMode}`);

        // 성공 메시지 반환
        const message: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `AI 모드가 ${newMode === 'LOCAL' ? '로컬' : 'Google AI'}로 변경되었습니다.`,
          timestamp: new Date(),
        };

        return message;
      } catch (error) {
        console.error('AI 모드 변경 실패:', error);

        // 에러 메시지 반환
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
    []
  );

  return {
    // 상태
    selectedEngine,
    showEngineInfo,
    isChangingEngine,

    // 액션
    setSelectedEngine,
    toggleEngineInfo,
    handleModeChange,
  };
}
