'use client';

/**
 * 🎭 Typewriter Markdown Renderer
 *
 * AI 응답을 타이핑 효과로 표시하여 스트리밍 UX 시뮬레이션
 *
 * @created 2026-01-08 v5.85.0
 */

import { memo } from 'react';
import { useTypewriter } from '@/hooks/ui/useTypewriter';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypewriterMarkdownProps {
  /** 전체 마크다운 컨텐츠 */
  content: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 타이핑 효과 활성화 (기본값: true) */
  enableTypewriter?: boolean;
  /** 타이핑 속도 (ms per char, 기본값: 12) */
  speed?: number;
  /** 타이핑 완료 콜백 */
  onComplete?: () => void;
}

/**
 * 타이핑 효과가 적용된 마크다운 렌더러
 *
 * Cloud Run JSON 응답을 실시간 스트리밍처럼 표시
 * 완료된 메시지에는 타이핑 효과 없이 즉시 표시
 *
 * @example
 * <TypewriterMarkdown
 *   content={aiResponse}
 *   enableTypewriter={isNewMessage}
 *   speed={15}
 * />
 */
export const TypewriterMarkdown = memo(function TypewriterMarkdown({
  content,
  className = '',
  enableTypewriter = true,
  speed = 12,
  onComplete,
}: TypewriterMarkdownProps) {
  const { displayedText, isComplete } = useTypewriter(content, {
    speed,
    enabled: enableTypewriter,
    onComplete,
  });

  // 타이핑 효과 비활성화 또는 완료 시 전체 컨텐츠 표시
  const textToRender = enableTypewriter ? displayedText : content;

  return (
    <div className={`relative ${className}`}>
      <MarkdownRenderer
        content={textToRender}
        className="text-chat leading-relaxed"
      />
      {/* 타이핑 중 커서 표시 */}
      {enableTypewriter && !isComplete && (
        <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
});

export default TypewriterMarkdown;
