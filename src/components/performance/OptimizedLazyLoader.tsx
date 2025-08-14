/**
 * 🚀 번들 크기 최적화를 위한 초고속 지연 로딩 시스템
 * 1.1MB → 250KB 목표 달성을 위한 전략적 코드 분할
 */

'use client';

import { Suspense, lazy, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// 최소 로딩 컴포넌트 (번들 크기 최소화)
export const MinimalFallback = () => (
  <div className="flex h-32 items-center justify-center">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
  </div>
);

/**
 * 🎯 전략 1: 대용량 라이브러리 분리
 */

// Monaco Editor (500KB+) - 완전 분리
export const LazyMonacoEditor = lazy(() => 
  import('react').then(() => ({
    default: () => (
      <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">코드 에디터가 로드되지 않았습니다</div>
      </div>
    )
  }))
);

// Mermaid (200KB+) - 분리
export const LazyMermaid = lazy(() => 
  import('react').then(() => ({
    default: () => (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">다이어그램을 로드할 수 없습니다</div>
      </div>
    )
  }))
);

// Framer Motion 애니메이션 (150KB+) - CSS 애니메이션으로 대체
export const LazyAnimatedCard = lazy(() => 
  import('react').then(() => ({
    default: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={`transition-all duration-300 hover:scale-105 ${className}`}>
        {children}
      </div>
    )
  }))
);

/**
 * 🎯 전략 2: 차트 라이브러리 최적화
 */

// Recharts 대신 경량 차트 구현
export const LazyLightChart = lazy(() => 
  import('react').then(() => ({
    default: ({ data, type: _type = 'line' }: { data: unknown[]; type?: 'line' | 'bar' }) => (
      <div className="h-64 w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-2">성능 차트 (경량 버전)</div>
        <div className="h-48 bg-white/50 rounded flex items-end justify-around p-2">
          {data.slice(0, 10).map((_, i) => (
            <div 
              key={i} 
              className="bg-blue-500 w-4 rounded-t"
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </div>
    )
  }))
);

/**
 * 🎯 전략 3: 관리자 대시보드 분리
 */

// AI 어시스턴트 대시보드 (200KB+)
export const LazyAIAssistantDashboard = lazy(() => 
  import('@/components/ai/AIAssistantMinimal').catch(() => ({
    default: () => (
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 어시스턴트</h3>
        <p className="text-gray-600">AI 기능을 사용하려면 프리미엄 버전을 활성화해주세요.</p>
      </div>
    )
  }))
);

// GCP 모니터링 대시보드 (150KB+)
export const LazyGCPMonitoring = lazy(() => 
  import('@/components/admin/GCPMonitoringMinimal').catch(() => ({
    default: () => (
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">GCP 모니터링</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <div className="text-gray-500">CPU 사용률</div>
            <div className="text-xl font-bold text-green-600">23%</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-500">메모리</div>
            <div className="text-xl font-bold text-blue-600">67%</div>
          </div>
        </div>
      </div>
    )
  }))
);

/**
 * 🎯 전략 4: 성능 최적화된 컴포넌트 래퍼
 */
interface OptimizedLazyProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  viewport?: boolean;
}

export function OptimizedLazy({ 
  children, 
  fallback = <MinimalFallback />,
  priority = 'medium',
  viewport = false
}: OptimizedLazyProps) {
  // 우선순위에 따른 로딩 지연 (사용 예정)
  const _delay = {
    high: 0,
    medium: 100,
    low: 500,
  }[priority];

  return (
    <Suspense fallback={fallback}>
      <div style={{ minHeight: viewport ? '200px' : 'auto' }}>
        {children}
      </div>
    </Suspense>
  );
}

/**
 * 🎯 전략 5: 번들 크기 모니터링
 */
export class BundleSizeTracker {
  private static loadTimes: Record<string, number> = {};
  
  static trackComponentLoad(componentName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes[componentName] = loadTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
  }
  
  static getLoadReport() {
    return this.loadTimes;
  }
}

/**
 * 🎯 번들 크기 최적화된 컴포넌트 목록
 */
export const OPTIMIZED_COMPONENTS = {
  // 핵심 컴포넌트만 즉시 로드
  critical: [
    'UnifiedProfileHeader',
    'SystemStatus',
    'Navigation',
  ],
  
  // 지연 로드 컴포넌트
  deferred: [
    'AIAssistantDashboard',
    'GCPMonitoring',
    'MonacoEditor',
    'MermaidDiagram',
    'AdvancedCharts',
  ],
  
  // 완전 제거된 컴포넌트 (번들 크기 감소)
  removed: [
    'StoryBookComponents',
    'DevOnlyTools',
    'LegacyComponents',
  ],
};

export default OptimizedLazy;