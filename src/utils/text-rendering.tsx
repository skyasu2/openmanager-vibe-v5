/**
 * 텍스트 렌더링 유틸리티
 *
 * AI 텍스트 그라데이션 등 공통 텍스트 렌더링 함수 제공
 */

import React from 'react';

/**
 * AI 단어에 그라데이션 애니메이션 적용
 *
 * @param text - 변환할 텍스트 (AI 포함)
 * @param isMounted - SSR 안전성을 위한 클라이언트 마운트 여부 (선택)
 * @returns React 엘리먼트 배열
 *
 * @example
 * renderTextWithAIGradient('AI 기반 모니터링')
 * // → 'AI'만 그라데이션, 나머지는 일반 텍스트
 */
export function renderTextWithAIGradient(
  text: string,
  isMounted: boolean = true
): React.ReactNode {
  if (!text.includes('AI')) return text;

  return text.split(/(AI)/g).map((part, index) => {
    if (part === 'AI') {
      return (
        <span
          key={index}
          className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text font-bold text-transparent"
          style={
            isMounted
              ? {
                  backgroundSize: '200% 200%',
                }
              : undefined
          }
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * 애니메이션이 포함된 AI 그라데이션 (FeatureCard용)
 *
 * @param text - 변환할 텍스트
 * @returns React 엘리먼트 배열
 */
export function renderAIGradientWithAnimation(text: string): React.ReactNode {
  if (!text.includes('AI')) return text;

  return text.split(/(AI)/g).map((part, index) => {
    if (part === 'AI') {
      return (
        <span
          key={index}
          className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-[length:200%_200%] animate-gradient-x bg-clip-text font-bold text-transparent"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
