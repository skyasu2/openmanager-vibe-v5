/**
 * 🚀 컴포넌트 프리로딩 최적화 훅
 * 
 * Phase 7.2: 성능 최적화
 * - 사용자 상호작용 예측을 통한 컴포넌트 프리로딩
 * - 라우트 전환 성능 개선
 * - 지능형 코드 스플리팅 관리
 */

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// 🎯 프리로딩 대상 컴포넌트 맵
const COMPONENT_PRELOAD_MAP = {
  '/': [
    () => import('@/components/AdminDashboardCharts'),
    () => import('@/components/ai/AIAgentAdminDashboard'),
  ],
  '/admin': [
    () => import('@/components/AdminDashboardCharts'),
    () => import('@/components/ai/AIAgentAdminDashboard'),
  ],
  '/admin/charts': [
    () => import('@/components/AdminDashboardCharts'),
  ],
  '/admin/virtual-servers': [
    () => import('@/components/AdminDashboardCharts'),
  ],
  '/admin/ai-analysis': [
    () => import('@/components/ai/AIAgentAdminDashboard'),
  ],
} as const;

// 🕐 프리로딩 지연 시간 (ms)
const PRELOAD_DELAYS = {
  IMMEDIATE: 0,
  FAST: 100,
  NORMAL: 500,
  SLOW: 1000,
} as const;

interface PreloadOptions {
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
  condition?: () => boolean;
}

export function usePreloadComponents(options: PreloadOptions = {}) {
  const pathname = usePathname();
  const { delay = PRELOAD_DELAYS.NORMAL, priority = 'medium', condition } = options;

  // 🚀 컴포넌트 프리로딩 함수
  const preloadComponents = useCallback(async (routes: string[]) => {
    // 조건부 프리로딩
    if (condition && !condition()) {
      return;
    }

    // 네트워크 상태 확인
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === 'slow-2g') {
        return; // 느린 네트워크에서는 프리로딩 안함
      }
    }

    for (const route of routes) {
      const preloadFunctions = COMPONENT_PRELOAD_MAP[route as keyof typeof COMPONENT_PRELOAD_MAP];
      
      if (preloadFunctions) {
        // 우선순위에 따른 지연 시간 조정
        const actualDelay = priority === 'high' ? 0 : 
                           priority === 'medium' ? delay : 
                           delay * 2;

        setTimeout(async () => {
          try {
            await Promise.all(preloadFunctions.map(fn => fn()));
            console.log(`✅ 프리로드 완료: ${route}`);
          } catch (error) {
            console.warn(`⚠️ 프리로드 실패: ${route}`, error);
          }
        }, actualDelay);
      }
    }
  }, [delay, priority, condition]);

  // 🎯 현재 경로 기반 자동 프리로딩
  useEffect(() => {
    const preloadCandidates: string[] = [];

    // 현재 경로에 따른 추천 프리로딩
    switch (pathname) {
      case '/':
        preloadCandidates.push('/admin', '/admin/charts');
        break;
      case '/admin':
        preloadCandidates.push('/admin/charts', '/admin/virtual-servers');
        break;
      case '/admin/charts':
        preloadCandidates.push('/admin/ai-analysis');
        break;
      default:
        break;
    }

    if (preloadCandidates.length > 0) {
      preloadComponents(preloadCandidates);
    }
  }, [pathname, preloadComponents]);

  // 🖱️ 마우스 호버 프리로딩
  const preloadOnHover = useCallback((targetRoute: string) => {
    return {
      onMouseEnter: () => {
        preloadComponents([targetRoute]);
      },
    };
  }, [preloadComponents]);

  // 🔗 링크 클릭 예측 프리로딩
  const preloadOnLinkVisible = useCallback((routes: string[]) => {
    // Intersection Observer로 링크가 보이면 프리로딩
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadComponents(routes);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    return observer;
  }, [preloadComponents]);

  return {
    preloadComponents,
    preloadOnHover,
    preloadOnLinkVisible,
    currentPath: pathname,
  };
}

// 🎯 라우트별 프리로딩 제어
export function useRoutePreloader() {
  const { preloadComponents } = usePreloadComponents({
    priority: 'high',
    delay: PRELOAD_DELAYS.FAST,
  });

  // 📱 관리자 라우트 프리로딩
  const preloadAdminRoutes = useCallback(() => {
    preloadComponents(['/admin', '/admin/charts', '/admin/virtual-servers']);
  }, [preloadComponents]);

  // 🤖 AI 관련 라우트 프리로딩
  const preloadAIRoutes = useCallback(() => {
    preloadComponents(['/admin/ai-analysis']);
  }, [preloadComponents]);

  // 📊 차트 라우트 프리로딩
  const preloadChartRoutes = useCallback(() => {
    preloadComponents(['/admin/charts']);
  }, [preloadComponents]);

  return {
    preloadAdminRoutes,
    preloadAIRoutes,
    preloadChartRoutes,
  };
}

// 🧠 스마트 프리로딩 (사용자 행동 패턴 기반)
export function useSmartPreloader() {
  const { preloadComponents } = usePreloadComponents();

  useEffect(() => {
    // 사용자 행동 패턴 분석 (로컬 스토리지 기반)
    const getVisitPattern = () => {
      try {
        const visits = JSON.parse(localStorage.getItem('route_visits') || '{}');
        return visits;
      } catch {
        return {};
      }
    };

    const updateVisitPattern = (route: string) => {
      try {
        const visits = getVisitPattern();
        visits[route] = (visits[route] || 0) + 1;
        localStorage.setItem('route_visits', JSON.stringify(visits));
      } catch {
        // 로컬 스토리지 실패 시 무시
      }
    };

    // 자주 방문하는 라우트 프리로딩
    const visits = getVisitPattern();
    const frequentRoutes = Object.entries(visits)
      .filter(([_, count]) => (count as number) > 2)
      .map(([route]) => route)
      .slice(0, 3); // 상위 3개만

    if (frequentRoutes.length > 0) {
      setTimeout(() => {
        preloadComponents(frequentRoutes);
      }, 2000); // 2초 후 프리로딩
    }

    // 현재 방문 기록
    updateVisitPattern(window.location.pathname);
  }, [preloadComponents]);
}

// 📊 프리로딩 성능 메트릭
export function usePreloadMetrics() {
  const metrics = {
    preloadedComponents: 0,
    failedPreloads: 0,
    averagePreloadTime: 0,
  };

  const trackPreload = useCallback((route: string, success: boolean, time: number) => {
    if (success) {
      metrics.preloadedComponents++;
      metrics.averagePreloadTime = 
        (metrics.averagePreloadTime + time) / metrics.preloadedComponents;
    } else {
      metrics.failedPreloads++;
    }

    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 프리로드 메트릭 - ${route}: ${success ? '성공' : '실패'} (${time}ms)`);
    }
  }, []);

  return { metrics, trackPreload };
} 