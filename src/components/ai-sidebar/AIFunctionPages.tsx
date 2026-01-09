'use client';

import type { FC } from 'react';
import type { AIAssistantFunction } from '@/components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '@/components/ai/AIAssistantIconPanel';
import AIContentArea from '@/components/ai/AIContentArea';

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
  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* AI 기능 아이콘 패널 */}
      <div className="shrink-0" data-testid="ai-function-navigation">
        <AIAssistantIconPanel
          selectedFunction={selectedFunction}
          onFunctionChange={onFunctionChange}
        />
      </div>

      {/* 선택된 기능 페이지 (Chat은 Sidebar 부모에서 처리하므로 여기서는 플레이스홀더만 렌더링됨) */}
      <div className="flex-1 overflow-y-auto" data-testid="ai-function-content">
        {selectedFunction === 'chat' ? (
          <div
            className="p-4 text-center text-white/70"
            data-testid="chat-page"
          >
            💬 채팅 기능이 선택되었습니다.
            <br />
            <span className="text-sm">메인 채팅 인터페이스가 표시됩니다.</span>
          </div>
        ) : (
          <AIContentArea selectedFunction={selectedFunction} />
        )}
      </div>
    </div>
  );
};
