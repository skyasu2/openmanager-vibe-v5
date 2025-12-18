'use client';

import { Bot, FileText, RefreshCw, Send } from 'lucide-react';
import React, { memo, type RefObject } from 'react';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import type { ApprovalRequest, SessionState } from '@/types/hitl';

/**
 * Enhanced AI Chat Props
 */
interface EnhancedAIChatProps {
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
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** 메시지 컴포넌트 */
  MessageComponent: React.ComponentType<{
    message: EnhancedChatMessage;
    onRegenerateResponse?: (messageId: string) => void;
    approvalRequest?: ApprovalRequest;
  }>;
  /** Human-in-the-Loop 승인 요청 (자연어 응답 대기 표시용) */
  pendingApproval?: ApprovalRequest | null;
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
  /** 현재 사용 중인 엔진 */
  currentEngine?: string;
  /** 라우팅 사유 */
  routingReason?: string;
  /** 🔒 세션 상태 (무료 티어 보호) */
  sessionState?: SessionState;
  /** 🔄 새 세션 시작 핸들러 */
  onNewSession?: () => void;
}

/**
 * Enhanced AI Chat 컴포넌트
 *
 * @description
 * - AI 채팅 UI (헤더 + 메시지 영역 + 입력 영역)
 * - 자동 장애 보고서 알림 표시
 * - 메시지 렌더링 및 스크롤 관리
 * - 키보드 단축키 (Ctrl+Enter)
 * - AI 엔진 상태 표시 (AIEngineIndicator)
 */
export const EnhancedAIChat = memo(function EnhancedAIChat({
  autoReportTrigger,
  allMessages,
  limitedMessages,
  messagesEndRef,
  MessageComponent,
  pendingApproval,
  inputValue,
  setInputValue,
  handleSendInput,
  isGenerating,
  regenerateResponse,
  currentEngine,
  routingReason,
  sessionState,
  onNewSession,
}: EnhancedAIChatProps) {
  return (
    <div className="flex h-full flex-col bg-linear-to-br from-slate-50 to-blue-50">
      {/* 헤더 - 모델 선택 */}
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">자연어 질의</h3>
              <p className="text-xs text-gray-600">AI 기반 대화형 인터페이스</p>
            </div>
          </div>

          {/* AI 엔진 표시기 */}
          {/* AI 엔진 표시기 (Removed) */}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-3 will-change-scroll sm:space-y-4 sm:p-4">
        {/* 자동장애보고서 알림 */}
        {autoReportTrigger.shouldGenerate && (
          <div className="rounded-lg border border-red-200 bg-linear-to-r from-red-50 to-orange-50 p-3">
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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-600">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              안녕하세요! AI 어시스턴트입니다 👋
            </h3>
            <p className="mx-auto max-w-[280px] text-sm text-gray-500">
              질문을 입력하시면 AI가 도움을 드리겠습니다.
            </p>
          </div>
        )}

        {/* 채팅 메시지들 렌더링 (메모리 효율성 최적화) */}
        {limitedMessages.map((message, index) => {
          // 마지막 스트리밍 중인 assistant 메시지에만 승인 요청 표시
          const isLastStreamingAssistant =
            message.role === 'assistant' &&
            message.isStreaming &&
            index === limitedMessages.length - 1;

          return (
            <MessageComponent
              key={message.id}
              message={message}
              onRegenerateResponse={regenerateResponse}
              approvalRequest={
                isLastStreamingAssistant
                  ? (pendingApproval ?? undefined)
                  : undefined
              }
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 🔒 세션 제한 안내 */}
      {sessionState?.isLimitReached && (
        <div className="border-t border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  대화가 길어졌습니다
                </p>
                <p className="text-xs text-blue-600">
                  더 정확한 AI 응답을 위해 새 대화를 시작해주세요
                </p>
              </div>
            </div>
            {onNewSession && (
              <button
                onClick={onNewSession}
                className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>새 대화</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔔 세션 경고 (곧 새 대화 권장) */}
      {sessionState?.isWarning && !sessionState.isLimitReached && (
        <div className="border-t border-slate-200 bg-linear-to-r from-slate-50 to-gray-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">
                💬 대화 {sessionState.count}/20
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                새 주제는 새 대화에서 더 정확해요
              </span>
            </div>
            {onNewSession && (
              <button
                onClick={onNewSession}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                새 대화
              </button>
            )}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-end space-x-2">
          {/* 텍스트 입력 */}
          <div className="relative flex-1">
            <AutoResizeTextarea
              value={inputValue}
              onValueChange={setInputValue}
              onKeyboardShortcut={() => handleSendInput()}
              placeholder={
                sessionState?.isLimitReached
                  ? '새 대화를 시작해주세요'
                  : '시스템에 대해 질문해보세요...'
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] shadow-xs transition-all focus:border-blue-500 focus:outline-hidden focus:ring-4 focus:ring-blue-500/10"
              minHeight={56}
              maxHeight={300}
              maxHeightVh={40}
              aria-label="AI 질문 입력"
              disabled={isGenerating || sessionState?.isLimitReached}
            />
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={() => {
              void handleSendInput();
            }}
            disabled={
              !inputValue.trim() || isGenerating || sessionState?.isLimitReached
            }
            className="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            title="메시지 전송"
            aria-label="메시지 전송"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* 하단 컨트롤 영역 */}
        <div className="mt-2 flex items-center justify-between">
          {/* 세션 정보 */}
          {sessionState && !sessionState.isWarning && (
            <div className="text-xs text-gray-400">
              대화 {sessionState.count}/20
            </div>
          )}
          {!sessionState && <div />}

          {/* 키보드 단축키 힌트 */}
          <div className="text-xs text-gray-500">
            <span>Ctrl+Enter로 전송</span>
          </div>
        </div>
      </div>
    </div>
  );
});

EnhancedAIChat.displayName = 'EnhancedAIChat';
