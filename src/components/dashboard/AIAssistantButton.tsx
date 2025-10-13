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
 * - 그라데이션 애니메이션 (Stage 1 통일)
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
        className={`relative transform rounded-xl p-3 transition-all duration-300 hover:scale-105 active:scale-95 ${
          isMounted && (isOpen || isEnabled)
            ? 'scale-105 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        } `}
        title={
          isMounted && isOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
        }
        aria-label={
          isMounted && isOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
        }
        aria-pressed={isMounted ? isOpen : false}
        suppressHydrationWarning
      >
        {/* AI 활성화 시 그라데이션 테두리 애니메이션 */}
        {isEnabled && (
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-75 animate-gradient"
            style={{
              background:
                'conic-gradient(from 0deg, #a855f7, #ec4899, #06b6d4, #a855f7)',
              padding: '2px',
              borderRadius: '0.75rem',
            }}
          >
            <div className="h-full w-full rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <div
            className={`h-5 w-5 ${isOpen || isEnabled ? 'text-white' : 'text-gray-600'}`}
          >
            <Bot className="h-5 w-5" />
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            {isEnabled ? (
              <span
                className="bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 bg-clip-text font-bold text-transparent animate-gradient"
              >
                AI 어시스턴트
              </span>
            ) : (
              'AI 어시스턴트'
            )}
          </span>
        </div>

        {/* 활성화 상태 표시 */}
        {(isOpen || isEnabled) && (
          <div
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-400"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
});

AIAssistantButton.displayName = 'AIAssistantButton';
