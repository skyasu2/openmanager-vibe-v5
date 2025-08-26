/**
 * 🚀 지연 로딩 컴포넌트 래퍼
 * LCP 개선을 위한 동적 임포트 최적화
 */

'use client';

import { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';;
import { Loader2 } from 'lucide-react';

interface LazyLoadConfig {
  // 로딩 딜레이 (ms)
  delay?: number;
  // 뷰포트 진입 시 로드
  viewport?: boolean;
  // 사용자 상호작용 시 로드
  interaction?: boolean;
  // 우선순위 (낮을수록 먼저 로드)
  priority?: number;
}

interface LazyComponentProps {
  fallback?: ReactNode;
  config?: LazyLoadConfig;
  children?: ReactNode;
}

// 기본 로딩 컴포넌트
const DefaultFallback = ({ message = '로딩 중...' }: { message?: string }) => (
  <div className="flex min-h-[200px] items-center justify-center">
    <div className="flex items-center space-x-2 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{message}</span>
    </div>
  </div>
);

// 큰 컴포넌트들을 지연 로딩으로 변환
export const LazyDashboardContent = lazy(
  () => import('@/components/dashboard/DashboardContent')
);

export const LazyAIAssistantDashboard = lazy(
  () => import('@/components/ai/AIAssistantAdminDashboard')
);

export const LazyPerformanceDashboard = lazy(
  () => import('@/components/admin/PerformanceDashboard.charts')
);

export const LazyLogAnalyticsDashboard = lazy(
  () => import('@/components/admin/LogAnalyticsDashboard')
);

export const LazyGCPQuotaMonitoring = lazy(
  () => import('@/components/admin/GCPQuotaMonitoringDashboard')
);

export const LazyFeatureCardModal = lazy(
  () => import('@/components/shared/FeatureCardModal')
);

// 차트 컴포넌트들 (recharts는 크기가 큼)
export const LazyChart = lazy(() =>
  import('recharts').then((module) => ({
    default: module.ResponsiveContainer,
  }))
);

// Monaco Editor (500KB+)
export const LazyMonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((module) => ({
    default: module.default,
  }))
);

// Mermaid 다이어그램 (애니메이션 라이브러리)
export const LazyMermaid = lazy(() =>
  import('@/components/shared/MermaidDiagram').then((module) => ({
    default: module.default,
  }))
);

/**
 * 지연 로딩 래퍼 컴포넌트
 */
export function LazyComponentWrapper({
  children,
  fallback,
  config = {},
}: LazyComponentProps) {
  const { delay = 0, priority = 5 } = config;

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>
  );
}

/**
 * 뷰포트 기반 지연 로딩 훅
 */
import { useState, useEffect, useRef } from 'react';

export function useIntersectionLoader(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, hasLoaded]);

  return { ref, isVisible, hasLoaded };
}

/**
 * 상호작용 기반 지연 로딩 훅
 */
export function useInteractionLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  const triggerLoad = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  return { shouldLoad, triggerLoad };
}

/**
 * 성능 우선순위 기반 로더
 */
export class PriorityLoader {
  private static loadQueue: Array<{
    component: () => Promise<any>;
    priority: number;
    name: string;
  }> = [];

  private static isLoading = false;

  static addToQueue(
    component: () => Promise<any>,
    priority: number,
    name: string
  ) {
    this.loadQueue.push({ component, priority, name });
    this.loadQueue.sort((a, b) => a.priority - b.priority);

    if (!this.isLoading) {
      this.processQueue();
    }
  }

  private static async processQueue() {
    if (this.loadQueue.length === 0 || this.isLoading) {
      return;
    }

    this.isLoading = true;

    while (this.loadQueue.length > 0) {
      const { component, name } = this.loadQueue.shift();

      try {
        console.log(`🚀 Loading component: ${name}`);
        await component();
        console.log(`✅ Loaded component: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to load component: ${name}`, error);
      }

      // 메인 스레드 블로킹 방지
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    this.isLoading = false;
  }
}

/**
 * 컴포넌트별 최적화된 로딩 설정
 */
export const COMPONENT_LOAD_CONFIG = {
  // 즉시 필요한 컴포넌트 (우선순위 1-3)
  critical: {
    UnifiedProfileHeader: { priority: 1, delay: 0 },
    SystemBootstrap: { priority: 2, delay: 0 },
    FeatureCardsGrid: { priority: 3, delay: 100 },
  },

  // 중요한 컴포넌트 (우선순위 4-6)
  important: {
    DashboardContent: { priority: 4, delay: 500 },
    AIAssistantSidebar: { priority: 5, delay: 1000 },
  },

  // 일반 컴포넌트 (우선순위 7-9)
  normal: {
    PerformanceDashboard: { priority: 7, delay: 2000 },
    LogAnalyticsDashboard: { priority: 8, delay: 3000 },
  },

  // 지연 가능한 컴포넌트 (우선순위 10+)
  deferred: {
    GCPQuotaMonitoring: { priority: 10, delay: 5000 },
    MonacoEditor: { priority: 15, delay: 10000 },
    MermaidDiagram: { priority: 20, delay: 15000 },
  },
};

export default LazyComponentWrapper;
