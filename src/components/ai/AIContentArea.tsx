/**
 * 🎯 AI Content Area
 *
 * Renders the specific content page based on the selected AI function.
 * Extracted from AIFunctionPages to allow reuse in both Sidebar and Fullscreen modes.
 */

'use client';

import { Activity } from 'lucide-react';
import { lazy, Suspense } from 'react';
import type { AIAssistantFunction } from '@/components/ai/AIAssistantIconPanel';

// 📦 Dynamic imports for optimization
const AutoReportPage = lazy(
  () => import('@/components/ai/pages/AutoReportPage')
);
const IntelligentMonitoringPage = lazy(
  () => import('@/components/ai/pages/IntelligentMonitoringPage')
);

// 🔄 Loading Spinner (화이트 모드)
const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center bg-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span className="text-sm text-gray-600">로딩 중...</span>
    </div>
  </div>
);

interface AIContentAreaProps {
  selectedFunction: AIAssistantFunction;
}

export default function AIContentArea({
  selectedFunction,
}: AIContentAreaProps) {
  switch (selectedFunction) {
    // 🎨 화이트 모드 전환 (2025-12 업데이트)
    case 'chat':
      return (
        <div
          className="flex h-full items-center justify-center bg-white p-4 text-center text-gray-600"
          data-testid="chat-placeholder"
        >
          <div>
            <div className="mb-2 text-2xl">💬</div>
            <p className="text-gray-700">
              채팅 인터페이스가 여기에 표시됩니다.
            </p>
            <span className="text-sm text-gray-500">
              (AIWorkspace 또는 Sidebar에서 ChatInterface를 렌더링해야 함)
            </span>
          </div>
        </div>
      );

    case 'auto-report':
      return (
        <div className="h-full" data-testid="auto-report-page">
          <Suspense fallback={<LoadingSpinner />}>
            <AutoReportPage />
          </Suspense>
        </div>
      );

    case 'intelligent-monitoring':
      return (
        <div className="h-full" data-testid="intelligent-monitoring-page">
          <Suspense fallback={<LoadingSpinner />}>
            <IntelligentMonitoringPage />
          </Suspense>
        </div>
      );

    case 'ai-management':
      // FIX-003: Coming Soon placeholder (MVP 범위 외)
      return (
        <div
          className="flex h-full items-center justify-center bg-white"
          data-testid="ai-management-page"
        >
          <div className="text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <p className="text-lg font-medium text-gray-700">AI 상태관리</p>
            <p className="mt-2 text-sm text-gray-500">Coming Soon</p>
            <p className="mt-1 text-xs text-gray-400">
              Circuit Breaker, Failover, Rate Limit 모니터링
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div
          className="flex h-full items-center justify-center bg-white text-gray-600"
          data-testid="default-page"
        >
          🤖 기능을 선택해주세요.
        </div>
      );
  }
}
