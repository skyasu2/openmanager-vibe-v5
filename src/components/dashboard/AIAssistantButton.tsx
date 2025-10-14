'use client';

import React, { useEffect, useState, memo } from 'react';
import { Bot } from 'lucide-react';

/**
 * AI 어시스턴트 버튼 Props
 */
interface AIAssistantButtonProps {
  /** 사이드바 열림 상태 */
  isOpen: boolean;
  /** AI 에이전트 활성화 상태 */
  isEnabled: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
}

/**
 * AI 어시스턴트 토글 버튼 컴포넌트
 *
 * @description
 * - AI 사이드바 토글 기능
 * - 활성화 상태에 따른 시각적 피드백
 * - Hydration 불일치 방지
 * - ✨ 그라데이션 애니메이션 (gradient-shift 4초)
 *
 * @example
 * ```tsx
 * <AIAssistantButton
 *   isOpen={true}
 *   isEnabled={true}
 *   onClick={() => handleToggle()}
 * />
 * ```
 */
export const AIAssistantButton = memo(function AIAssistantButton({
  isOpen,
  isEnabled,
  onClick
}: AIAssistantButtonProps) {
  // 🔒 Hydration 불일치 방지를 위한 클라이언트 전용 상태
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative" suppressHydrationWarning>
      <button
        onClick={onClick}
        className={`group relative transform overflow-hidden rounded-xl p-3 transition-all duration-300 hover:scale-105 active:scale-95 ${
          isMounted && (isOpen || isEnabled)
            ? 'scale-105 text-white shadow-lg shadow-purple-500/50'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        } `}
        style={
          isMounted && (isOpen || isEnabled)
            ? {
                background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 4s ease-in-out infinite',
              }
            : undefined
        }
        title={
          isMounted && isOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
        }
        aria-label={
          isMounted && isOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
        }
        aria-pressed={isMounted ? isOpen : false}
        suppressHydrationWarning
      >
        {/* 호버 시 빛나는 효과 */}
        {isMounted && (isOpen || isEnabled) && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <div className={`h-5 w-5 ${isOpen || isEnabled ? 'text-white' : 'text-gray-600'}`}>
            <Bot className="h-5 w-5" />
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            AI 어시스턴트
          </span>
        </div>

        {/* 활성화 상태 표시 */}
        {isMounted && (isOpen || isEnabled) && (
          <div
            className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-green-400"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
});

AIAssistantButton.displayName = 'AIAssistantButton';
