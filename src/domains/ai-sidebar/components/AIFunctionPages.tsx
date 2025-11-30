/**
 * 🎯 AI 기능 페이지 컴포넌트
 *
 * 기능:
 * - 다양한 AI 기능 페이지 렌더링
 * - 기능 간 전환 관리
 * - 각 기능별 전용 UI 제공
 */

'use client';

// React import 제거 - Next.js 15 자동 JSX Transform 사용
import { type FC, lazy, Suspense } from 'react';
import type { AIAssistantFunction } from '@/components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '@/components/ai/AIAssistantIconPanel';

// 📦 동적 임포트로 초기 로딩 최적화
const AutoReportPage = lazy(
  () => import('@/components/ai/pages/AutoReportPage')
);
const IntelligentMonitoringPage = lazy(
  () => import('@/components/ai/pages/IntelligentMonitoringPage')
);
const MLLearningCenter = lazy(() =>
  import('@/components/ai/pages/MLLearningCenter').then((module) => ({
    default: module.MLLearningCenter,
  }))
);

// 🔄 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      <span className="text-sm text-white/70">로딩 중...</span>
    </div>
  </div>
);

interface AIFunctionPagesProps {
  selectedFunction: AIAssistantFunction;
  onFunctionChange: (func: AIAssistantFunction) => void;
  className?: string;
}

export const AIFunctionPages: FC<AIFunctionPagesProps> = ({
  selectedFunction,
  onFunctionChange,
  className = '',
}: AIFunctionPagesProps) => {
  const renderFunctionPage = () => {
    switch (selectedFunction) {
      case 'chat':
        return (
          <div
            className="p-4 text-center text-white/70"
            data-testid="chat-page"
          >
            💬 채팅 기능이 선택되었습니다.
            <br />
            <span className="text-sm">메인 채팅 인터페이스가 표시됩니다.</span>
          </div>
        );

      case 'auto-report':
        return (
          <div data-testid="auto-report-page">
            <Suspense fallback={<LoadingSpinner />}>
              <AutoReportPage />
            </Suspense>
          </div>
        );

      case 'intelligent-monitoring':
        return (
          <div data-testid="intelligent-monitoring-page">
            <Suspense fallback={<LoadingSpinner />}>
              <IntelligentMonitoringPage />
            </Suspense>
          </div>
        );

      case 'advanced-management':
        return (
          <div data-testid="advanced-management-page">
            <Suspense fallback={<LoadingSpinner />}>
              <MLLearningCenter />
            </Suspense>
          </div>
        );

      default:
        return (
          <div
            className="p-4 text-center text-white/70"
            data-testid="default-page"
          >
            🤖 AI 기능을 선택해주세요.
          </div>
        );
    }
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* AI 기능 아이콘 패널 */}
      <div className="flex-shrink-0" data-testid="ai-function-navigation">
        <AIAssistantIconPanel
          selectedFunction={selectedFunction}
          onFunctionChange={onFunctionChange}
        />
      </div>

      {/* 선택된 기능 페이지 */}
      <div className="flex-1 overflow-y-auto" data-testid="ai-function-content">
        {renderFunctionPage()}
      </div>
    </div>
  );
};
