/**
 * 📜 Virtual Scrolling: 대용량 데이터 렌더링 최적화
 * 
 * Phase 7.4: 고급 패턴 구현
 * - 가상화 스크롤 기본 구조
 * - 동적 높이 지원
 * - 무한 스크롤 통합
 * - 향후 확장 대비 아키텍처
 */

import { useState, useCallback, useMemo, useRef } from 'react';

// 📏 가상화 설정 타입
interface VirtualScrollConfig {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number; // 버퍼 아이템 수
  threshold?: number; // 로딩 트리거 임계값
}

// 📋 가상화 아이템 타입
interface VirtualItem {
  index: number;
  start: number;
  end: number;
  height: number;
}

// 📊 가상화 범위 타입
interface VirtualRange {
  startIndex: number;
  endIndex: number;
  visibleItems: VirtualItem[];
}

// 🎯 Virtual Scrolling 기본 훅 (향후 확장 대비)
export const useVirtualScrolling = <T>(
  items: T[],
  config: VirtualScrollConfig
) => {
  const { itemHeight, containerHeight, overscan = 5, threshold = 0.8 } = config;
  
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | undefined>(undefined);
  
  // 📏 아이템 높이 계산
  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 📊 가상화 범위 계산
  const virtualRange = useMemo((): VirtualRange => {
    const totalHeight = items.reduce((acc, _, index) => acc + getItemHeight(index), 0);
    
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    
    // 시작 인덱스 찾기
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }
    
    // 끝 인덱스 찾기
    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      accumulatedHeight += getItemHeight(i);
      if (accumulatedHeight > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }
    
    if (endIndex === 0) endIndex = items.length - 1;
    
    // 가시 아이템 생성
    const visibleItems: VirtualItem[] = [];
    let currentTop = 0;
    
    for (let i = 0; i < startIndex; i++) {
      currentTop += getItemHeight(i);
    }
    
    for (let i = startIndex; i <= endIndex; i++) {
      const height = getItemHeight(i);
      visibleItems.push({
        index: i,
        start: currentTop,
        end: currentTop + height,
        height,
      });
      currentTop += height;
    }
    
    return {
      startIndex,
      endIndex,
      visibleItems,
    };
  }, [items.length, scrollTop, containerHeight, overscan, getItemHeight]);

  // 🔄 스크롤 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
    scrollElementRef.current = target;
  }, []);

  // 📏 전체 높이 계산
  const totalHeight = useMemo(() => {
    return items.reduce((acc, _, index) => acc + getItemHeight(index), 0);
  }, [items.length, getItemHeight]);

  // 🔄 무한 스크롤 감지
  const shouldLoadMore = useMemo(() => {
    if (!scrollElementRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElementRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    return scrollPercentage >= threshold;
  }, [scrollTop, threshold]);

  // 📍 특정 인덱스로 스크롤
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return;
    
    let targetScrollTop = 0;
    for (let i = 0; i < index; i++) {
      targetScrollTop += getItemHeight(i);
    }
    
    if (align === 'center') {
      targetScrollTop -= containerHeight / 2 - getItemHeight(index) / 2;
    } else if (align === 'end') {
      targetScrollTop -= containerHeight - getItemHeight(index);
    }
    
    scrollElementRef.current.scrollTop = Math.max(0, targetScrollTop);
  }, [getItemHeight, containerHeight]);

  return {
    virtualRange,
    totalHeight,
    handleScroll,
    shouldLoadMore,
    scrollToIndex,
    scrollElementRef,
  };
};

// 🎯 동적 높이 Virtual Scrolling (고급 기능 준비)
export const useDynamicVirtualScrolling = <T>(
  items: T[],
  config: Omit<VirtualScrollConfig, 'itemHeight'> & {
    estimatedItemHeight: number;
    getItemId: (item: T, index: number) => string;
  }
) => {
  const { estimatedItemHeight, getItemId, ...restConfig } = config;
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());
  const measurementCacheRef = useRef<Map<string, number>>(new Map());

  // 📏 아이템 높이 조회 (측정된 값 우선, 없으면 추정값)
  const getItemHeight = useCallback((index: number): number => {
    if (index >= items.length) return estimatedItemHeight;
    
    const item = items[index];
    const itemId = getItemId(item, index);
    
    return measurementCacheRef.current.get(itemId) || estimatedItemHeight;
  }, [items, getItemId, estimatedItemHeight]);

  // 📐 아이템 높이 측정
  const measureItem = useCallback((itemId: string, height: number) => {
    measurementCacheRef.current.set(itemId, height);
    setMeasuredHeights(new Map(measurementCacheRef.current));
  }, []);

  const virtualScrolling = useVirtualScrolling(items, {
    ...restConfig,
    itemHeight: getItemHeight,
  });

  return {
    ...virtualScrolling,
    measureItem,
    measuredHeights,
    getItemHeight,
  };
};

// 🎯 Virtual List 컴포넌트 타입 정의 (향후 구현 대비)
export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (props: {
    item: T;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  onLoadMore?: () => void;
  loading?: boolean;
  overscan?: number;
  className?: string;
}

// 🛠️ Virtual Scrolling 유틸리티
export const virtualScrollingUtils = {
  // 📊 성능 메트릭 계산
  calculatePerformanceMetrics: (
    totalItems: number,
    renderedItems: number,
    scrollTop: number,
    containerHeight: number
  ) => ({
    renderRatio: renderedItems / totalItems,
    scrollPercentage: scrollTop / Math.max(1, containerHeight),
    memoryReduction: Math.round((1 - renderedItems / totalItems) * 100),
  }),

  // 🔄 스크롤 위치 정규화
  normalizeScrollPosition: (
    scrollTop: number,
    totalHeight: number,
    containerHeight: number
  ) => {
    const maxScroll = Math.max(0, totalHeight - containerHeight);
    return Math.min(maxScroll, Math.max(0, scrollTop));
  },

  // 📏 아이템 인덱스로 스크롤 위치 계산
  getScrollTopForIndex: (
    index: number,
    getItemHeight: (index: number) => number,
    align: 'start' | 'center' | 'end' = 'start',
    containerHeight: number = 0
  ) => {
    let scrollTop = 0;
    for (let i = 0; i < index; i++) {
      scrollTop += getItemHeight(i);
    }

    if (align === 'center') {
      scrollTop -= containerHeight / 2 - getItemHeight(index) / 2;
    } else if (align === 'end') {
      scrollTop -= containerHeight - getItemHeight(index);
    }

    return Math.max(0, scrollTop);
  },
};

// 🎯 Virtual Scrolling 상태 관리 (향후 확장)
export interface VirtualScrollingState {
  isVirtualizationEnabled: boolean;
  itemsPerPage: number;
  totalItemsRendered: number;
  averageItemHeight: number;
  scrollPosition: number;
  performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
    scrollFps: number;
  };
}

// 🔧 Virtual Scrolling 설정 프리셋
export const VIRTUAL_SCROLLING_PRESETS = {
  // 📋 로그 리스트용
  logs: {
    itemHeight: 60,
    overscan: 5,
    threshold: 0.8,
  },
  
  // 📊 메트릭 차트용
  metrics: {
    itemHeight: 120,
    overscan: 3,
    threshold: 0.9,
  },
  
  // 🔮 예측 결과용
  predictions: {
    itemHeight: 80,
    overscan: 4,
    threshold: 0.85,
  },
  
  // 📱 모바일 최적화
  mobile: {
    itemHeight: 50,
    overscan: 3,
    threshold: 0.75,
  },
} as const;

// 📝 향후 구현 예정 기능들의 타입 정의
export interface FutureVirtualScrollingFeatures {
  // 🎨 동적 스타일링
  dynamicStyling?: {
    oddRowStyle?: React.CSSProperties;
    evenRowStyle?: React.CSSProperties;
    hoverStyle?: React.CSSProperties;
  };
  
  // 🔍 검색 및 필터링
  search?: {
    query: string;
    highlightMatch?: boolean;
    filterFunction?: (item: any, query: string) => boolean;
  };
  
  // 📌 고정 헤더/푸터
  stickyElements?: {
    header?: React.ReactNode;
    footer?: React.ReactNode;
  };
  
  // 🎯 선택 및 다중 선택
  selection?: {
    mode: 'single' | 'multiple';
    selectedItems: Set<string>;
    onSelectionChange: (selected: Set<string>) => void;
  };
} 