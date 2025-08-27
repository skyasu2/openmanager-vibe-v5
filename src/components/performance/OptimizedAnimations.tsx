/**
 * 🎭 최적화된 애니메이션 컴포넌트
 * Framer Motion 사용량 최적화 및 성능 개선
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import { useState, useEffect, CSSProperties } from 'react';
import type { ReactNode } from 'react';;

// 사용자 모션 설정 감지
const useOptimizedMotion = () => {
  const prefersReducedMotion = useReducedMotion();
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    // 성능 모드 감지 (저사양 기기, 배터리 절약 모드 등)
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === '2g') {
      setPerformanceMode(true);
    }
  }, []);

  return {
    shouldAnimate: !prefersReducedMotion && !performanceMode,
    reduceMotion: prefersReducedMotion,
    performanceMode,
  };
};

// 최적화된 애니메이션 variants
export const optimizedVariants = {
  // 페이지 전환 (GPU 가속 사용)
  pageTransition: {
    initial: {
      opacity: 0,
      transform: 'translate3d(0, 20px, 0)',
    },
    animate: {
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0, 1], // cubic-bezier 최적화
      },
    },
    exit: {
      opacity: 0,
      transform: 'translate3d(0, -20px, 0)',
      transition: { duration: 0.2 },
    },
  },

  // 카드 애니메이션 (transform 최적화)
  cardHover: {
    rest: {
      scale: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  },

  // 스케일 애니메이션 (composite layer 활용)
  scaleAnimation: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        scale: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.2 },
      },
    },
  },

  // 스태거 애니메이션 (메모리 효율적)
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  },
};

// 성능 최적화된 motion 컴포넌트들
interface OptimizedMotionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * 최적화된 페이지 전환 컴포넌트
 */
export function OptimizedPageTransition({
  children,
  className,
}: OptimizedMotionProps) {
  const { shouldAnimate } = useOptimizedMotion();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      variants={optimizedVariants.pageTransition}
      // GPU 가속 강제 활성화
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 최적화된 카드 호버 컴포넌트
 */
export function OptimizedHoverCard({
  children,
  className,
  onClick,
}: OptimizedMotionProps) {
  const { shouldAnimate } = useOptimizedMotion();

  if (!shouldAnimate) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}
      variants={optimizedVariants.cardHover}
      onClick={onClick}
      // 성능 최적화
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/**
 * 최적화된 스태거 애니메이션 컨테이너
 */
export function OptimizedStaggerContainer({
  children,
  className,
}: OptimizedMotionProps) {
  const { shouldAnimate } = useOptimizedMotion();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      variants={optimizedVariants.staggerContainer}
    >
      {children}
    </div>
  );
}

/**
 * 최적화된 스태거 아이템
 */
export function OptimizedStaggerItem({
  children,
  className,
}: OptimizedMotionProps) {
  const { shouldAnimate } = useOptimizedMotion();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      variants={optimizedVariants.staggerItem}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/**
 * 애니메이션 성능 모니터링
 */
export class AnimationPerformanceMonitor {
  private static animationCount = 0;
  private static maxConcurrentAnimations = 3;

  static startAnimation(name: string) {
    this.animationCount++;

    if (this.animationCount > this.maxConcurrentAnimations) {
      console.warn(`⚠️ Too many concurrent animations: ${this.animationCount}`);
    }

    console.log(
      `🎭 Animation started: ${name} (total: ${this.animationCount})`
    );
  }

  static endAnimation(name: string) {
    this.animationCount = Math.max(0, this.animationCount - 1);
    console.log(`✅ Animation ended: ${name} (total: ${this.animationCount})`);
  }

  static getActiveAnimations() {
    return this.animationCount;
  }
}

/**
 * CSS 애니메이션 대체 (더 가벼운 옵션)
 */
export const cssOnlyAnimations = {
  fadeIn: 'animate-fadeIn',
  slideUp: 'animate-slideUp',
  scaleIn: 'animate-scaleIn',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  wiggle: 'animate-wiggle',
};

/**
 * 조건부 애니메이션 래퍼
 */
interface ConditionalAnimationProps {
  condition: boolean;
  animation: ReactNode;
  fallback: ReactNode;
}

export function ConditionalAnimation({
  condition,
  animation,
  fallback,
}: ConditionalAnimationProps) {
  const { shouldAnimate } = useOptimizedMotion();

  if (shouldAnimate && condition) {
    return <>{animation}</>;
  }

  return <>{fallback}</>;
}

/**
 * 배치 애니메이션 (여러 요소를 효율적으로 애니메이션)
 */
export function BatchAnimation({
  children,
  delay = 0,
}: {
  children: ReactNode[];
  delay?: number;
}) {
  const { shouldAnimate } = useOptimizedMotion();

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <Fragment>
      {children.map((child, index) => (
        <div
          key={index}
          style={{ willChange: 'transform, opacity' }}
        >
          {child}
        </div>
      ))}
    </Fragment>
  );
}

export default {
  OptimizedPageTransition,
  OptimizedHoverCard,
  OptimizedStaggerContainer,
  OptimizedStaggerItem,
  ConditionalAnimation,
  BatchAnimation,
  AnimationPerformanceMonitor,
  cssOnlyAnimations,
};
