/**
 * AI 엔진 관리 Custom Hook (v4.0 - UNIFIED 전용)
 *
 * @since v4.0 - AI 모드 선택 UI 제거, UNIFIED 모드로 통합
 * @deprecated 이 Hook은 하위 호환성을 위해 유지됨. 직접 '/api/ai/supervisor' 사용 권장
 * @author Claude Code
 * @created 2025-11-26
 */

import { useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/stores/useAISidebarStore';

export interface UseAIEngineReturn {
  // 상태 (하위 호환성)
  currentEngine: 'UNIFIED';
  selectedEngine: 'UNIFIED';
  showEngineInfo: false;
  isChangingEngine: false;

  // 액션 (하위 호환성 - 더 이상 아무것도 하지 않음)
  setSelectedEngine: (engine: string) => void;
  toggleEngineInfo: () => void;
  handleModeChange: (newMode: string) => Promise<ChatMessage | null>;

  // 유틸리티 메서드
  setEngine: (engine: string) => void;
  isEngineAvailable: (engine: string) => boolean;
  getEngineDisplayName: (engine?: string) => string;
  getEngineDescription: (engine?: string) => string;
  getEngineEndpoint: (engine?: string) => string;
}

const STORAGE_KEY = 'selected-ai-engine';

/**
 * useAIEngine Hook (v4.0 - UNIFIED 전용)
 *
 * ⚠️ 중요: 이 Hook은 하위 호환성을 위해 유지됩니다.
 * - 모든 엔진 선택은 무시되고 UNIFIED로 자동 전환됩니다.
 * - localStorage에 저장된 레거시 모드는 자동으로 UNIFIED로 마이그레이션됩니다.
 *
 * @returns {UseAIEngineReturn} UNIFIED 엔진 정보
 */
export function useAIEngine(): UseAIEngineReturn {
  // localStorage 마이그레이션 (한 번만 실행)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'UNIFIED') {
      console.info(`🔄 AI 모드 자동 마이그레이션: ${saved} → UNIFIED`);
      localStorage.setItem(STORAGE_KEY, 'UNIFIED');
    }
  }, []);

  // 엔진 설정 (더 이상 아무것도 하지 않음)
  const setEngine = useCallback((engine: string) => {
    if (engine !== 'UNIFIED') {
      console.warn(
        `⚠️ AI 모드 "${engine}"는 더 이상 지원되지 않습니다. UNIFIED 사용.`
      );
    }
  }, []);

  // setSelectedEngine (하위 호환성)
  const setSelectedEngine = useCallback(
    (engine: string) => {
      setEngine(engine);
    },
    [setEngine]
  );

  // toggleEngineInfo (더 이상 아무것도 하지 않음)
  const toggleEngineInfo = useCallback(() => {
    // No-op for backward compatibility
  }, []);

  // handleModeChange (하위 호환성 - 항상 UNIFIED로 변경)
  const handleModeChange = useCallback(
    async (newMode: string): Promise<ChatMessage | null> => {
      if (newMode !== 'UNIFIED') {
        console.warn(
          `⚠️ AI 모드 "${newMode}"는 더 이상 지원되지 않습니다. UNIFIED 사용.`
        );
      }

      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'AI 엔진은 UNIFIED 모드로 고정되어 있습니다. (자동 라우팅)',
        timestamp: new Date(),
      };

      return message;
    },
    []
  );

  // isEngineAvailable (UNIFIED만 사용 가능)
  const isEngineAvailable = useCallback((engine: string): boolean => {
    return engine === 'UNIFIED';
  }, []);

  // getEngineDisplayName
  const getEngineDisplayName = useCallback((_engine?: string): string => {
    return 'AI Supervisor';
  }, []);

  // getEngineDescription
  const getEngineDescription = useCallback((_engine?: string): string => {
    return 'Supabase RAG + ML + Cloud Run AI (자동 라우팅)';
  }, []);

  // getEngineEndpoint
  const getEngineEndpoint = useCallback((_engine?: string): string => {
    return '/api/ai/supervisor';
  }, []);

  return {
    // 상태 (모두 고정값)
    currentEngine: 'UNIFIED',
    selectedEngine: 'UNIFIED',
    showEngineInfo: false,
    isChangingEngine: false,

    // 액션 (하위 호환성)
    setSelectedEngine,
    toggleEngineInfo,
    handleModeChange,

    // 유틸리티 메서드
    setEngine,
    isEngineAvailable,
    getEngineDisplayName,
    getEngineDescription,
    getEngineEndpoint,
  };
}
