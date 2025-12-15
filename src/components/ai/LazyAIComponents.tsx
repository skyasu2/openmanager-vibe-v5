'use client';

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load AI components
const AIWorkspace = lazy(() => import('./AIWorkspace'));
const IntelligentMonitoringPage = lazy(
  () => import('./pages/IntelligentMonitoringPage')
);
const AutoReportPage = lazy(() => import('./pages/AutoReportPage'));
const ThinkingProcessVisualizer = lazy(
  () => import('./ThinkingProcessVisualizer')
);

// Loading fallback component
const AILoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner />
    <span className="ml-2 text-sm text-gray-600">AI 컴포넌트 로딩 중...</span>
  </div>
);

// Wrapped components with Suspense
export const LazyAIWorkspace = (props: Record<string, unknown>) => (
  <Suspense fallback={<AILoadingFallback />}>
    <AIWorkspace mode="sidebar" {...props} />
  </Suspense>
);

export const LazyIntelligentMonitoringPage = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<AILoadingFallback />}>
    <IntelligentMonitoringPage {...props} />
  </Suspense>
);

export const LazyAutoReportPage = (props: Record<string, unknown>) => (
  <Suspense fallback={<AILoadingFallback />}>
    <AutoReportPage {...props} />
  </Suspense>
);

export const LazyThinkingProcessVisualizer = (
  props: Record<string, unknown>
) => (
  <Suspense fallback={<AILoadingFallback />}>
    <ThinkingProcessVisualizer steps={[]} {...props} />
  </Suspense>
);
