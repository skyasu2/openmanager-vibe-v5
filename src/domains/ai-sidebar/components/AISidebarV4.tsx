'use client';

// Icons
import { Bot, User } from 'lucide-react';
import { type FC, memo, useEffect, useRef, useState } from 'react';
// Components
import { AIErrorBoundary } from '@/components/error/AIErrorBoundary';
import {
  convertThinkingStepsToUI,
  useAIChatCore,
} from '@/hooks/ai/useAIChatCore';
import type { ApprovalRequest } from '@/types/hitl';
import { RenderMarkdownContent } from '@/utils/markdown-parser';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';
import { MessageActions } from '../../../components/ai/MessageActions';
import { isGuestFullAccessEnabled } from '../../../config/guestMode';
import { useUserPermissions } from '../../../hooks/useUserPermissions';
import type { EnhancedChatMessage } from '../../../stores/useAISidebarStore';
// Types
import type {
  AISidebarV3Props,
  AIThinkingStep,
} from '../types/ai-sidebar-types';
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';
import { type AgentStep, InlineAgentStatus } from './InlineAgentStatus';

// 🔧 공통 로직은 useAIChatCore 훅에서 관리
// - HITL 승인/거부
// - 세션 제한
// - 피드백
// - 메시지 변환

/**
 * ThinkingSteps를 AgentStep 형식으로 변환 (UI 표시용)
 */
function convertToAgentSteps(thinkingSteps?: AIThinkingStep[]): AgentStep[] {
  return convertThinkingStepsToUI(thinkingSteps) as AgentStep[];
}

// 🎯 메시지 컴포넌트 성능 최적화 (Cursor/Copilot 스타일)
const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  isLastMessage?: boolean;
  approvalRequest?: ApprovalRequest;
}>(
  ({
    message,
    onRegenerateResponse,
    onFeedback,
    isLastMessage,
    approvalRequest,
  }) => {
    // thinking 메시지일 경우 간소화된 인라인 상태 표시
    if (message.role === 'thinking' && message.thinkingSteps) {
      const agentSteps = convertToAgentSteps(message.thinkingSteps);
      return (
        <InlineAgentStatus
          steps={agentSteps}
          isComplete={!message.isStreaming}
          approvalRequest={approvalRequest}
        />
      );
    }

    // 일반 메시지 렌더링
    return (
      <div
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
          }`}
        >
          {/* 아바타 */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs ${
              message.role === 'user'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-linear-to-br from-purple-500 to-pink-500 text-white'
            }`}
          >
            {message.role === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>

          {/* 메시지 콘텐츠 */}
          <div className="flex-1">
            {/* 스트리밍 중 인라인 Agent 상태 표시 (자연어 승인 대기 표시) */}
            {message.role === 'assistant' &&
              message.isStreaming &&
              message.thinkingSteps &&
              message.thinkingSteps.length > 0 && (
                <InlineAgentStatus
                  steps={convertToAgentSteps(message.thinkingSteps)}
                  isComplete={false}
                  approvalRequest={approvalRequest}
                />
              )}

            {/* 메시지 내용 (콘텐츠가 있을 때만 표시) */}
            {message.content && (
              <div
                className={`rounded-2xl p-4 shadow-xs ${
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-linear-to-br from-blue-500 to-blue-600 text-white'
                    : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <RenderMarkdownContent
                    content={message.content}
                    className="text-[15px] leading-relaxed"
                  />
                ) : (
                  <div className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed">
                    {message.content}
                  </div>
                )}
              </div>
            )}

            {/* 타임스탬프 & 메타데이터 */}
            <div
              className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <p className="text-xs text-gray-500">
                {typeof message.timestamp === 'string'
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : message.timestamp.toLocaleTimeString()}
              </p>
              {/* 처리 시간 표시 (assistant 메시지만) */}
              {message.role === 'assistant' &&
                message.metadata?.processingTime && (
                  <p className="text-xs text-gray-400">
                    {message.metadata.processingTime}ms
                  </p>
                )}
            </div>

            {/* 메시지 액션 (복사, 피드백, 재생성) */}
            {message.content && (
              <MessageActions
                messageId={message.id}
                content={message.content}
                role={message.role}
                onRegenerate={onRegenerateResponse}
                onFeedback={onFeedback}
                showRegenerate={isLastMessage && message.role === 'assistant'}
                className="mt-2"
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageComponent.displayName = 'MessageComponent';

// 🔒 완전 Client-Only AI 사이드바 컴포넌트 (V4 - useAIChatCore 통합)
export const AISidebarV4: FC<AISidebarV3Props> = ({
  isOpen,
  onClose,
  className = '',
  sessionId: propSessionId,
  onMessageSend,
}) => {
  // 🔐 권한 확인
  const permissions = useUserPermissions();

  // 🔧 UI 상태 관리 (사이드바 전용)
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');

  // ============================================================================
  // 🎯 공통 AI 채팅 로직 (useAIChatCore 훅 사용)
  // ============================================================================
  const {
    // 입력 상태
    input,
    setInput,
    // 메시지
    messages: enhancedMessages,
    // 로딩/진행 상태
    isLoading,
    hybridState,
    currentMode,
    // HITL 승인
    pendingApproval,
    // 세션 관리
    sessionState,
    handleNewSession,
    // 액션
    handleFeedback,
    regenerateLastResponse,
    stop,
    cancel,
    // 통합 입력 핸들러
    handleSendInput,
  } = useAIChatCore({
    sessionId: propSessionId,
    onMessageSend,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const canRenderSidebar =
    permissions.canToggleAI || isGuestFullAccessEnabled();
  if (!canRenderSidebar) {
    return null;
  }

  const renderFunctionPage = () => {
    if (selectedFunction === 'chat') {
      return (
        <EnhancedAIChat
          autoReportTrigger={{ shouldGenerate: false }}
          allMessages={enhancedMessages}
          limitedMessages={enhancedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          pendingApproval={pendingApproval}
          inputValue={input}
          setInputValue={setInput}
          handleSendInput={handleSendInput}
          // 🔒 세션 상태 전달
          sessionState={sessionState}
          onNewSession={handleNewSession}
          isGenerating={isLoading}
          regenerateResponse={regenerateLastResponse}
          currentEngine="Vercel AI SDK"
          // 👍👎 피드백 핸들러
          onFeedback={handleFeedback}
          // ⏹️ 생성 중단 핸들러
          onStopGeneration={stop}
          // 📊 Job Queue 진행률
          jobProgress={hybridState.progress}
          jobId={hybridState.jobId}
          onCancelJob={cancel}
          queryMode={currentMode}
        />
      );
    }
    return (
      <AIFunctionPages
        selectedFunction={selectedFunction}
        onFunctionChange={setSelectedFunction}
      />
    );
  };

  return (
    <div
      data-testid="ai-sidebar"
      role="dialog"
      aria-labelledby="ai-sidebar-v4-title"
      aria-modal="true"
      aria-hidden={!isOpen}
      className={`gpu-sidebar-slide-in fixed right-0 top-0 z-30 flex h-full w-full max-w-[90vw] bg-white shadow-2xl sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[800px] ${
        isOpen ? '' : 'gpu-sidebar-slide-out'
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <AISidebarHeader onClose={onClose} />
        <div className="flex-1 overflow-hidden pb-20 sm:pb-0">
          <AIErrorBoundary
            componentName="AISidebar"
            onReset={() => {
              // 에러 발생 시 세션 리셋
              setInput('');
            }}
          >
            {renderFunctionPage()}
          </AIErrorBoundary>
        </div>
      </div>

      <div className="hidden sm:block">
        <AIAssistantIconPanel
          selectedFunction={selectedFunction}
          onFunctionChange={setSelectedFunction}
          className="w-16 sm:w-20"
        />
      </div>
    </div>
  );
};

export default memo(AISidebarV4) as FC<AISidebarV3Props>;
