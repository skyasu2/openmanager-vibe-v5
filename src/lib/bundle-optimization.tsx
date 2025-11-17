/**
 * 🚀 번들 크기 최적화 유틸리티
 * 1.1MB → 250KB 목표를 위한 Tree Shaking 및 의존성 최적화
 */

/**
 * 🎯 전략 1: 라이브러리 경량화
 */

// Lodash 대신 네이티브 함수 사용
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// UUID 대신 간단한 ID 생성
export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// Date-fns 대신 네이티브 Date 사용
export const formatDate = (
  date: Date | string,
  format: 'short' | 'long' = 'short'
) => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { year: '2-digit', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('ko-KR', options);
};

/**
 * 🎯 전략 2: 아이콘 최적화 (Lucide React 선별적 import)
 */
export {
  BarChart3,
  Bot,
  Loader2,
  Play,
  X,
  LogIn,
  Settings,
  User,
  Home,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Shield,
  Zap,
  Globe,
  Clock,
} from 'lucide-react';

/**
 * 🎯 전략 3: CSS-in-JS 대신 TailwindCSS 사용
 */
export const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(' ');
};

// 자주 사용되는 스타일 조합
export const buttonVariants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors',
  secondary:
    'bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-colors',
  ghost:
    'hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors',
};

export const cardVariants = {
  default: 'bg-white shadow-sm border border-gray-200 rounded-lg p-6',
  elevated: 'bg-white shadow-md border border-gray-200 rounded-lg p-6',
  bordered: 'bg-white border-2 border-gray-300 rounded-lg p-6',
};

/**
 * 🎯 전략 4: 불필요한 polyfill 제거
 */
export const isClientSide = typeof window !== 'undefined';
export const isMobile = isClientSide && window.innerWidth <= 768;

/**
 * 🎯 전략 5: 성능 모니터링 (개발 모드만)
 */
export class BundleAnalyzer {
  private static readonly isDev = process.env.NODE_ENV === 'development';

  static measureComponentRender(componentName: string) {
    if (!this.isDev) return () => {};

    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(
        `⚡ ${componentName} rendered in ${(end - start).toFixed(2)}ms`
      );
    };
  }

  static trackBundleSize(chunkName: string) {
    if (!this.isDev) return;

    // 웹팩 청크 정보 로그
    console.log(`📦 Loading chunk: ${chunkName}`);
  }
}

import React from 'react';

/**
 * 🎯 전략 6: 에러 바운더리 경량화
 */
export class LightErrorBoundary {
  static createFallback(componentName: string) {
    const FallbackComponent = () => (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="font-medium text-red-800">오류 발생</h3>
        <p className="mt-1 text-sm text-red-600">
          {componentName} 컴포넌트를 로드할 수 없습니다.
        </p>
      </div>
    );

    FallbackComponent.displayName = 'LightErrorBoundaryFallback';

    return FallbackComponent;
  }
}

/**
 * 🎯 전략 7: 메모이제이션 최적화
 */
export const createMemoCache = <T,>() => {
  const cache = new Map<string, T>();

  return {
    get: (key: string): T | undefined => cache.get(key),
    set: (key: string, value: T): void => {
      // 캐시 크기 제한 (메모리 최적화)
      if (cache.size >= 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, value);
    },
    clear: (): void => cache.clear(),
    size: (): number => cache.size,
  };
};

/**
 * 🎯 전략 8: 번들 분석 보고서 생성
 */
export const getBundleReport = () => {
  if (typeof window === 'undefined') return null;

  const report = {
    timestamp: new Date().toISOString(),
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userAgent: navigator.userAgent,
    performance: {
      navigation: performance.navigation,
      timing: performance.timing,
    },
  };

  return report;
};

/**
 * 🎯 최종 번들 크기 목표 추적
 */
export const BUNDLE_SIZE_TARGETS = {
  current: '1.1MB',
  target: '250KB',
  reduction: '77%',
  strategies: [
    '사용되지 않는 의존성 제거: -300KB',
    'Monaco Editor 제거: -500KB',
    'Framer Motion → CSS 전환: -150KB',
    'Tree Shaking 최적화: -100KB',
    '기타 최적화: -50KB',
  ],
} as const;
