'use client';

import {
  AlertCircle,
  Bot,
  FileText,
  RefreshCw,
  Send,
  Square,
  X,
} from 'lucide-react';
import React, { memo, type RefObject } from 'react';
import { WelcomePromptCards } from '@/components/ai/WelcomePromptCards';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import type { AsyncQueryProgress } from '@/hooks/ai/useAsyncAIQuery';
import type { EnhancedChatMessage } from '@/stores/useAISidebarStore';
import type { SessionState } from '@/types/session';
import { JobProgressIndicator } from './JobProgressIndicator';

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
    onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
    isLastMessage?: boolean;
  }>;
  /** 피드백 핸들러 */
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
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
  /** ⏹️ 생성 중단 핸들러 */
  onStopGeneration?: () => void;
  /** 📊 Job Queue 진행 상태 */
  jobProgress?: AsyncQueryProgress | null;
  /** Job ID */
  jobId?: string | null;
  /** Job 취소 핸들러 */
  onCancelJob?: () => void;
  /** 현재 쿼리 모드 */
  queryMode?: 'streaming' | 'job-queue';
  /** 에러 메시지 */
  error?: string | null;
  /** 에러 초기화 핸들러 */
  onClearError?: () => void;
  /** 재시도 핸들러 */
  onRetry?: () => void;
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
  inputValue,
  setInputValue,
  handleSendInput,
  isGenerating,
  regenerateResponse,
  currentEngine: _currentEngine,
  routingReason: _routingReason,
  sessionState,
  onNewSession,
  onStopGeneration,
  onFeedback,
  jobProgress,
  jobId,
  onCancelJob,
  queryMode,
  error,
  onClearError,
  onRetry,
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

      {/* 메시지 영역 (중앙 정렬) */}
      <div className="flex-1 overflow-y-auto scroll-smooth will-change-scroll">
        <div className="mx-auto max-w-3xl space-y-3 p-3 sm:space-y-4 sm:p-4">
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

          {/* 🎯 웰컴 화면 (ChatGPT 스타일) - WelcomePromptCards 컴포넌트 사용 */}
          {allMessages.length === 0 && (
            <WelcomePromptCards onPromptClick={setInputValue} />
          )}

          {/* 채팅 메시지들 렌더링 (메모리 효율성 최적화) */}
          {limitedMessages.map((message, index) => {
            const isLastMessage = index === limitedMessages.length - 1;

            return (
              <MessageComponent
                key={message.id}
                message={message}
                onRegenerateResponse={regenerateResponse}
                onFeedback={onFeedback}
                isLastMessage={isLastMessage}
              />
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 📊 Job Queue 진행률 표시 */}
      {queryMode === 'job-queue' && isGenerating && (
        <JobProgressIndicator
          progress={jobProgress ?? null}
          isLoading={isGenerating}
          jobId={jobId}
          onCancel={onCancelJob}
        />
      )}

      {/* ⚠️ 인라인 에러 표시 */}
      {error && !isGenerating && (
        <div className="border-t border-red-200 bg-linear-to-r from-red-50 to-orange-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-800">
                  요청을 처리할 수 없습니다
                </p>
                <p className="mt-0.5 break-words text-xs text-red-600">
                  {error}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center space-x-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  aria-label="재시도"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>재시도</span>
                </button>
              )}
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* 🎯 입력 영역 (ChatGPT 스타일 - 중앙 정렬) */}
      <div className="shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {/* 메인 입력 컨테이너 */}
          <div className="relative flex items-end rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <AutoResizeTextarea
              value={inputValue}
              onValueChange={setInputValue}
              onKeyboardShortcut={() => handleSendInput()}
              placeholder={
                sessionState?.isLimitReached
                  ? '새 대화를 시작해주세요'
                  : '메시지를 입력하세요...'
              }
              className="flex-1 resize-none border-none bg-transparent px-4 py-3 pr-14 text-[15px] focus:outline-hidden focus:ring-0"
              minHeight={48}
              maxHeight={200}
              maxHeightVh={30}
              aria-label="AI 질문 입력"
              disabled={isGenerating || sessionState?.isLimitReached}
            />

            {/* 전송/중단 버튼 (우하단 내장) */}
            <div className="absolute bottom-2 right-2">
              {isGenerating && onStopGeneration ? (
                <button
                  onClick={onStopGeneration}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm transition-all hover:bg-red-600"
                  title="생성 중단"
                  aria-label="생성 중단"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    void handleSendInput();
                  }}
                  disabled={
                    !inputValue.trim() ||
                    isGenerating ||
                    sessionState?.isLimitReached
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="메시지 전송"
                  aria-label="메시지 전송"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 하단 힌트 */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              {sessionState && !sessionState.isWarning && (
                <span>대화 {sessionState.count}/20</span>
              )}
            </div>
            <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
          </div>
        </div>
      </div>
    </div>
  );
});

EnhancedAIChat.displayName = 'EnhancedAIChat';
