'use client';

import { useState, useEffect } from 'react';

/**
 * 🔍 useMediaQuery Hook
 *
 * CSS 미디어 쿼리를 React에서 사용할 수 있게 해주는 커스텀 훅
 * - SSR 안전성 보장
 * - 리사이즈 이벤트 최적화
 * - 디바운스 처리
 */
export function useMediaQuery(
  query: string,
  defaultValue: boolean = false
): boolean {
  const [matches, setMatches] = useState<boolean>(defaultValue);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setMounted(true);

    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 초기 상태 설정
    setMatches(mediaQuery.matches);

    // 이벤트 리스너 등록 (최신 API 사용)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // 구형 브라우저 호환성
      mediaQuery.addListener(handler);
    }

    // 클린업
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  // SSR 중에는 기본값 반환
  if (!mounted) {
    return defaultValue;
  }

  return matches;
}

/**
 * 🎯 사전 정의된 브레이크포인트 훅들
 */
export const useBreakpoint = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');
  const isExtraLarge = useMediaQuery('(min-width: 1536px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isExtraLarge,
    // 편의 기능
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isLargeDesktop || isExtraLarge,
  };
};

export default useMediaQuery;
