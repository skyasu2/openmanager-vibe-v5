/**
 * 🎯 AI Content Area
 *
 * Renders the specific content page based on the selected AI function.
 * Extracted from AIFunctionPages to allow reuse in both Sidebar and Fullscreen modes.
 */

'use client';

import { lazy, Suspense } from 'react';
import type { AIAssistantFunction } from '@/components/ai/AIAssistantIconPanel';

// 📦 Dynamic imports for optimization
const AutoReportPage = lazy(
  () => import('@/components/ai/pages/AutoReportPage')
);
const IntelligentMonitoringPage = lazy(
  () => import('@/components/ai/pages/IntelligentMonitoringPage')
);

// 🔄 Loading Spinner
const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      <span className="text-sm text-white/70">로딩 중...</span>
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
    case 'chat':
      return (
        <div
          className="p-4 text-center text-white/70 flex h-full items-center justify-center"
          data-testid="chat-placeholder"
        >
          <div>
            <div className="mb-2 text-2xl">💬</div>
            <p>채팅 인터페이스가 여기에 표시됩니다.</p>
            <span className="text-sm text-white/50">
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

    default:
      return (
        <div
          className="flex h-full items-center justify-center text-white/70"
          data-testid="default-page"
        >
          🤖 기능을 선택해주세요.
        </div>
      );
  }
}
