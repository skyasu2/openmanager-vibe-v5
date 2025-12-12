/**
 * 텍스트 렌더링 유틸리티
 *
 * AI 텍스트 그라데이션 등 공통 텍스트 렌더링 함수 제공
 */

import type React from 'react';

import {
  AI_GRADIENT_CLASSES,
  AI_ICON_GRADIENT_CLASSES,
  AI_ICON_GRADIENT_COLORS,
  AI_ICON_GRADIENT_ID,
} from '@/styles/design-constants';

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
          className={`${AI_GRADIENT_CLASSES} bg-clip-text font-bold text-transparent`}
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
          className={`${AI_GRADIENT_CLASSES} animate-gradient-x bg-size-[200%_200%] bg-clip-text font-bold text-transparent`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * SVG 그라데이션 정의 컴포넌트
 *
 * SVG 아이콘에 그라데이션을 적용하기 위한 defs 요소
 * 페이지에 한 번만 렌더링하면 됨
 *
 * @example
 * <AIIconGradientDefs />
 * <Icon className="[&>*]:fill-[url(#ai-icon-gradient)]" />
 */
export function AIIconGradientDefs(): React.ReactElement {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient
          id={AI_ICON_GRADIENT_ID}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={AI_ICON_GRADIENT_COLORS.start} />
          <stop offset="50%" stopColor={AI_ICON_GRADIENT_COLORS.mid} />
          <stop offset="100%" stopColor={AI_ICON_GRADIENT_COLORS.end} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 아이콘에 그라데이션 적용을 위한 래퍼 컴포넌트
 *
 * Lucide React 아이콘 등에 AI 그라데이션 효과 적용
 * CSS mask-image 기법 사용 (크로스 브라우저 호환)
 *
 * @param children - 아이콘 컴포넌트
 * @param className - 추가 클래스
 * @param animate - 애니메이션 적용 여부 (기본: true)
 *
 * @example
 * <GradientIconWrapper>
 *   <Sparkles className="h-8 w-8" />
 * </GradientIconWrapper>
 */
export function GradientIconWrapper({
  children,
  className = '',
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`inline-flex items-center justify-center ${
        animate
          ? AI_ICON_GRADIENT_CLASSES
          : 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
      } ${className}`}
      style={{
        WebkitMaskImage: 'linear-gradient(white, white)',
        maskImage: 'linear-gradient(white, white)',
        WebkitMaskComposite: 'destination-in',
        maskComposite: 'intersect',
        backgroundSize: animate ? '200% 200%' : undefined,
      }}
    >
      <div
        className="[&>svg]:text-transparent"
        style={{
          background: `linear-gradient(135deg, ${AI_ICON_GRADIENT_COLORS.start}, ${AI_ICON_GRADIENT_COLORS.mid}, ${AI_ICON_GRADIENT_COLORS.end})`,
          backgroundSize: animate ? '200% 200%' : undefined,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 아이콘 그라데이션 클래스 반환 (간단한 경우)
 *
 * @returns Tailwind 클래스 문자열
 */
export function getIconGradientClasses(): string {
  return `${AI_ICON_GRADIENT_CLASSES} bg-clip-text text-transparent`;
}
