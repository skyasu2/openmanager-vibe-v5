'use client';

import React, { memo, type RefObject } from 'react';
import { Bot, FileText, Send } from 'lucide-react';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import type { AIMode } from '@/types/ai-types';
import { CompactModeSelector } from '@/components/ui/CompactModeSelector';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';

/**
 * Enhanced AI Chat Props
 */
interface EnhancedAIChatProps {
  /** Real-time thinking 활성화 여부 */
  enableRealTimeThinking: boolean;
  /** 자동 장애 보고서 트리거 상태 */
  autoReportTrigger: {
    shouldGenerate: boolean;
    lastQuery?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  /** 모든 메시지 배열 */
  allMessages: EnhancedChatMessage[];
  /** 제한된 메시지 배열 (최대 개수 적용) */
  limitedMessages: EnhancedChatMessage[];
  /** 메시지 끝 참조 (자동 스크롤용) */
  messagesEndRef: RefObject<HTMLDivElement>;
  /** 메시지 컴포넌트 */
  MessageComponent: React.ComponentType<{
    message: EnhancedChatMessage;
    onRegenerateResponse?: (messageId: string) => void;
  }>;
  /** 입력 값 */
  inputValue: string;
  /** 입력 값 변경 핸들러 */
  setInputValue: (value: string) => void;
  /** 메시지 전송 핸들러 */
  handleSendInput: () => void;
  /** 생성 중 여부 */
  isGenerating: boolean;
  /** 응답 재생성 핸들러 */
  regenerateResponse: (messageId: string) => void;
}

/**
 * Enhanced AI Chat 컴포넌트
 *
 * @description
 * - AI 채팅 UI (헤더 + 메시지 영역 + 입력 영역)
 * - 자동 장애 보고서 알림 표시
 * - Real-time thinking 지원 표시
 * - 메시지 렌더링 및 스크롤 관리
 * - 키보드 단축키 (Ctrl+Enter)
 *
 * @example
 * ```tsx
 * <EnhancedAIChat
 *   enableRealTimeThinking={true}
 *   autoReportTrigger={{shouldGenerate: false}}
 *   allMessages={messages}
 *   limitedMessages={limitedMessages}
 *   messagesEndRef={messagesEndRef}
 *   MessageComponent={MessageComponent}
 *   inputValue={inputValue}
 *   setInputValue={setInputValue}
 *   handleSendInput={handleSendInput}
 *   isGenerating={false}
 *   selectedEngine="LOCAL"
 *   handleModeChange={handleModeChange}
 *   regenerateResponse={regenerateResponse}
 * />
 * ```
 */
export const EnhancedAIChat = memo(function EnhancedAIChat({
  enableRealTimeThinking,
  autoReportTrigger,
  allMessages,
  limitedMessages,
  messagesEndRef,
  MessageComponent,
  inputValue,
  setInputValue,
  handleSendInput,
  isGenerating,
  regenerateResponse,
}: EnhancedAIChatProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 - 모델 선택 */}
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">자연어 질의</h3>
              <p className="text-xs text-gray-600">
                {enableRealTimeThinking
                  ? '실시간 thinking 지원'
                  : 'AI 기반 대화형 인터페이스'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-3 [will-change:scroll-position] sm:space-y-4 sm:p-4">
        {/* 자동장애보고서 알림 */}
        {autoReportTrigger.shouldGenerate && (
          <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-red-600" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    자동장애보고서 생성 준비
                  </h4>
                  <p className="text-xs text-red-600">
                    &quot;{autoReportTrigger.lastQuery}&quot;에서{' '}
                    {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 빈 메시지 상태 */}
        {allMessages.length === 0 && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-600">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              안녕하세요! AI 어시스턴트입니다 👋
            </h3>
            <p className="mx-auto max-w-[280px] text-sm text-gray-500">
              {enableRealTimeThinking
                ? '실시간 thinking process를 지원하는 AI 사이드바입니다.'
                : '질문을 입력하시면 AI가 도움을 드리겠습니다.'}
            </p>
          </div>
        )}

        {/* 채팅 메시지들 렌더링 (메모리 효율성 최적화) */}
        {limitedMessages.map((message) => (
          <MessageComponent
            key={message.id}
            message={message}
            onRegenerateResponse={regenerateResponse}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 bg-white/80 p-3 backdrop-blur-sm">
        <div className="flex items-end space-x-2">
          {/* 텍스트 입력 */}
          <div className="relative flex-1">
            <AutoResizeTextarea
              value={inputValue}
              onValueChange={setInputValue}
              onKeyboardShortcut={() => handleSendInput()}
              placeholder="시스템에 대해 질문해보세요..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              minHeight={56}
              maxHeight={300}
              maxHeightVh={40}
              aria-label="AI 질문 입력"
              disabled={isGenerating}
            />
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={() => {
              void handleSendInput();
            }}
            disabled={!inputValue.trim() || isGenerating}
            className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="메시지 전송"
            aria-label="메시지 전송"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* 하단 컨트롤 영역 */}
        <div className="mt-2 flex items-center justify-between">
          {/* 왼쪽: AI 모드 선택기 (Cursor 스타일) */}
          <div />

          {/* 오른쪽: 키보드 단축키 힌트 */}
          <div className="text-xs text-gray-500">
            <span>Ctrl+Enter로 전송</span>
            {enableRealTimeThinking && (
              <span className="ml-2 text-emerald-600">• Thinking 활성</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

EnhancedAIChat.displayName = 'EnhancedAIChat';
