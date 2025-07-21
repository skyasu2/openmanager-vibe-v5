/**
 * 🎯 AI 기능 페이지 컴포넌트
 *
 * 기능:
 * - 다양한 AI 기능 페이지 렌더링
 * - 기능 간 전환 관리
 * - 각 기능별 전용 UI 제공
 */

'use client';

import type { AIAgentFunction } from '@/components/ai/AIAgentIconPanel';
import AIAgentIconPanel from '@/components/ai/AIAgentIconPanel';
import AutoReportPage from '@/components/ai/pages/AutoReportPage';
import IntelligentMonitoringPage from '@/components/ai/pages/IntelligentMonitoringPage';
import { MLLearningCenter } from '@/components/ai/pages/MLLearningCenter';
import React from 'react';

interface AIFunctionPagesProps {
  selectedFunction: AIAgentFunction;
  onFunctionChange: (func: AIAgentFunction) => void;
  className?: string;
}

export const AIFunctionPages: React.FC<AIFunctionPagesProps> = ({
  selectedFunction,
  onFunctionChange,
  className = '',
}) => {
  const renderFunctionPage = () => {
    switch (selectedFunction) {
      case 'chat':
        return (
          <div
            className='p-4 text-center text-white/70'
            data-testid='chat-page'
          >
            💬 채팅 기능이 선택되었습니다.
            <br />
            <span className='text-sm'>메인 채팅 인터페이스가 표시됩니다.</span>
          </div>
        );

      case 'auto-report':
        return (
          <div data-testid='auto-report-page'>
            <AutoReportPage />
          </div>
        );

      case 'intelligent-monitoring':
        return (
          <div data-testid='intelligent-monitoring-page'>
            <IntelligentMonitoringPage />
          </div>
        );

      case 'advanced-management':
        return (
          <div data-testid='advanced-management-page'>
            <MLLearningCenter />
          </div>
        );

      default:
        return (
          <div
            className='p-4 text-center text-white/70'
            data-testid='default-page'
          >
            🤖 AI 기능을 선택해주세요.
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* AI 기능 아이콘 패널 */}
      <div className='flex-shrink-0' data-testid='ai-function-navigation'>
        <AIAgentIconPanel
          selectedFunction={selectedFunction}
          onFunctionChange={onFunctionChange}
        />
      </div>

      {/* 선택된 기능 페이지 */}
      <div className='flex-1 overflow-y-auto' data-testid='ai-function-content'>
        {renderFunctionPage()}
      </div>
    </div>
  );
};
