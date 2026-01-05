'use client';

/**
 * 🤖 AI Workspace Controller (Unified Streaming Architecture)
 *
 * v4.0.0 - useAIChatCore 통합:
 * - AISidebarV4와 동일한 공통 훅 사용 (useAIChatCore)
 * - 세션 제한 (전체화면에서는 비활성화)
 * - 피드백 기능 통합
 */

import {
  ArrowLeftFromLine,
  Bot,
  Maximize2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useRef, useState } from 'react';
import { AIErrorBoundary } from '@/components/error/AIErrorBoundary';
import { useAIChatCore } from '@/hooks/ai/useAIChatCore';
import { AIFunctionPages } from '../../domains/ai-sidebar/components/AIFunctionPages';
import { EnhancedAIChat } from '../../domains/ai-sidebar/components/EnhancedAIChat';
import type { AIThinkingStep } from '../../domains/ai-sidebar/types/ai-sidebar-types';
import type { EnhancedChatMessage } from '../../stores/useAISidebarStore';
import { RealTimeDisplay } from '../dashboard/RealTimeDisplay';
import { OpenManagerLogo } from '../shared/OpenManagerLogo';
import UnifiedProfileHeader from '../shared/UnifiedProfileHeader';
import AIAssistantIconPanel, {
  type AIAssistantFunction,
} from './AIAssistantIconPanel';
import AIContentArea from './AIContentArea';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import SystemContextPanel from './SystemContextPanel';
import ThinkingProcessVisualizer from './ThinkingProcessVisualizer';

// 🔧 공통 로직은 useAIChatCore 훅에서 관리

const MemoizedThinkingProcessVisualizer = memo(ThinkingProcessVisualizer);

const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  isLastMessage?: boolean;
}>(({ message, onRegenerateResponse, onFeedback, isLastMessage = false }) => {
  if (message.role === 'thinking' && message.thinkingSteps) {
    return (
      <div className="my-4">
        <MemoizedThinkingProcessVisualizer
          steps={message.thinkingSteps as AIThinkingStep[]}
          isActive={message.isStreaming || false}
          className="rounded-lg border border-purple-200 bg-linear-to-r from-purple-50 to-blue-50 p-4"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
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

        <div className="flex-1">
          <div
            className={`rounded-2xl p-4 shadow-xs ${
              message.role === 'user'
                ? 'rounded-tr-sm bg-linear-to-br from-blue-500 to-blue-600 text-white'
                : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
            }`}
          >
            {/* 마크다운 렌더링 (AI 응답) 또는 일반 텍스트 (사용자) */}
            {message.role === 'assistant' ? (
              <MarkdownRenderer
                content={message.content}
                className="text-[15px] leading-relaxed"
              />
            ) : (
              <div className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed">
                {message.content}
              </div>
            )}
          </div>

          {/* 메시지 메타 정보 및 액션 버튼 */}
          <div
            className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {typeof message.timestamp === 'string'
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : message.timestamp.toLocaleTimeString()}
              </p>
              {message.role === 'assistant' &&
                message.metadata?.processingTime && (
                  <p className="text-xs text-gray-400">
                    · {message.metadata.processingTime}ms
                  </p>
                )}
            </div>

            {/* 메시지 액션 버튼 (복사, 피드백, 재생성) */}
            <MessageActions
              messageId={message.id}
              content={message.content}
              role={message.role}
              onRegenerate={onRegenerateResponse}
              onFeedback={onFeedback}
              showRegenerate={isLastMessage && message.role === 'assistant'}
            />
          </div>

          {message.role === 'assistant' &&
            message.thinkingSteps &&
            message.thinkingSteps.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <MemoizedThinkingProcessVisualizer
                  steps={message.thinkingSteps}
                  isActive={message.isStreaming || false}
                  className="rounded border border-gray-200 bg-gray-50"
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

interface AIWorkspaceProps {
  mode: 'sidebar' | 'fullscreen';
  onClose?: () => void;
}

export default function AIWorkspace({ mode, onClose }: AIWorkspaceProps) {
  const router = useRouter();
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // ============================================================================
  // 🎯 공통 AI 채팅 로직 (useAIChatCore 훅 사용)
  // 전체화면에서는 세션 제한 비활성화 (더 큰 화면에서 더 많은 대화 가능)
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
    // 에러 상태
    error,
    clearError,
    // 세션 관리
    sessionState,
    handleNewSession,
    // 액션
    handleFeedback,
    regenerateLastResponse,
    retryLastQuery,
    stop,
    cancel,
    // 통합 입력 핸들러
    handleSendInput,
  } = useAIChatCore({
    // 전체화면에서도 세션 제한 적용 (악의적 사용/폭주 방지)
    disableSessionLimit: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Render Logic ---

  // 📱 SIDEBAR LAYOUT (Mobile/Compact) - Only used if this component is used in sidebar mode (though AISidebarV4 is preferred)
  // 🎨 화이트 모드 전환 (2025-12 업데이트)
  if (mode === 'sidebar') {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">AI Assistant</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/ai')}
              className="text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-md p-1"
              title="전체 화면으로 보기"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-md p-1"
                title="닫기"
              >
                <ArrowLeftFromLine className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFunction === 'chat' ? (
            <EnhancedAIChat
              autoReportTrigger={{ shouldGenerate: false }}
              allMessages={enhancedMessages}
              limitedMessages={enhancedMessages}
              messagesEndRef={messagesEndRef}
              MessageComponent={MessageComponent}
              inputValue={input}
              setInputValue={setInput}
              handleSendInput={handleSendInput}
              sessionState={sessionState}
              onNewSession={handleNewSession}
              isGenerating={isLoading}
              regenerateResponse={regenerateLastResponse}
              currentEngine="Hybrid AI Query"
              onStopGeneration={stop}
              onFeedback={handleFeedback}
              jobProgress={hybridState.progress}
              jobId={hybridState.jobId}
              onCancelJob={cancel}
              queryMode={currentMode}
              error={error}
              onClearError={clearError}
              onRetry={retryLastQuery}
            />
          ) : (
            <AIFunctionPages
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
            />
          )}
        </div>
        {selectedFunction === 'chat' && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-2">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              isMobile
            />
          </div>
        )}
      </div>
    );
  }

  // 🖥️ FULLSCREEN LAYOUT (Unified)
  // 🎨 화이트 모드 전환 (2025-12 업데이트)
  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-gray-900">
      {/* LEFT SIDEBAR (Navigation) - Hidden on mobile */}
      <div className="hidden md:flex w-[280px] flex-col border-r border-gray-200 bg-gray-50">
        {/* Header with Logo + New Chat */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <OpenManagerLogo variant="light" showSubtitle={false} href="/" />
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            title="새 대화 시작"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>새 대화</span>
          </button>
        </div>

        {/* Chat History Section (상단) */}
        <div className="flex-1 px-3 overflow-y-auto">
          <div className="mb-4">
            <div className="mb-2 px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Recent Chats
            </div>
            {enhancedMessages.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700 border border-blue-100">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">현재 대화</span>
                  <span className="text-xs text-blue-500 shrink-0">
                    {enhancedMessages.filter((m) => m.role === 'user').length}개
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-6 text-center">
                <Bot className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">아직 대화가 없습니다</p>
                <p className="mt-1 text-xs text-gray-400">
                  AI에게 질문해보세요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section (하단) */}
        <div className="shrink-0 border-t border-gray-200 px-3 py-3">
          <div className="mb-2 px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Features
          </div>
          <AIAssistantIconPanel
            selectedFunction={selectedFunction}
            onFunctionChange={setSelectedFunction}
            className="w-full bg-transparent! border-none! p-0! items-start"
          />
        </div>

        {/* Bottom Status */}
        <div className="shrink-0 border-t border-gray-200 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Active</span>
            </div>
            <span className="text-gray-400">
              v{process.env.NEXT_PUBLIC_APP_VERSION || '5.83.14'}
            </span>
          </div>
        </div>
      </div>

      {/* CENTER & RIGHT (Main Content) */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* MOBILE HEADER - Only visible on small screens */}
        <div className="flex md:hidden h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              title="뒤로 가기"
            >
              <ArrowLeftFromLine className="h-5 w-5" />
            </button>
            <OpenManagerLogo variant="light" showSubtitle={false} href="/" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewSession}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              title="새 대화"
            >
              <Plus className="h-4 w-4" />
            </button>
            {/* 모바일 프로필 */}
            <UnifiedProfileHeader />
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className="flex flex-1 flex-col relative min-w-0">
          {/* 🎯 통합 헤더 (대시보드와 동일한 스타일) - Desktop Only */}
          <header className="hidden md:flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-xs">
            {/* 좌측: 브레드크럼 */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="font-medium text-gray-900">AI Workspace</span>
              <span>/</span>
              <span className="text-blue-600 capitalize font-medium">
                {selectedFunction === 'chat'
                  ? '대화'
                  : selectedFunction === 'auto-report'
                    ? '보고서'
                    : '모니터링'}
              </span>
            </div>

            {/* 중앙: 실시간 정보 (숨김 on mobile) */}
            <div className="hidden md:flex items-center">
              <RealTimeDisplay />
            </div>

            {/* 우측: 패널 토글 + 프로필 */}
            <div className="flex items-center gap-3">
              {/* 패널 토글 버튼 */}
              {selectedFunction === 'chat' && (
                <button
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  className="hidden lg:flex rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  title="시스템 컨텍스트 패널 토글"
                >
                  {isRightPanelOpen ? (
                    <PanelRightClose className="h-5 w-5" />
                  ) : (
                    <PanelRightOpen className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* 프로필 헤더 (대시보드와 동일) */}
              <UnifiedProfileHeader />
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            <AIErrorBoundary
              componentName="AIWorkspace"
              onReset={() => {
                setInput('');
                handleNewSession();
              }}
            >
              {selectedFunction === 'chat' ? (
                <EnhancedAIChat
                  autoReportTrigger={{ shouldGenerate: false }}
                  allMessages={enhancedMessages}
                  limitedMessages={enhancedMessages}
                  messagesEndRef={messagesEndRef}
                  MessageComponent={MessageComponent}
                  inputValue={input}
                  setInputValue={setInput}
                  handleSendInput={handleSendInput}
                  sessionState={sessionState}
                  onNewSession={handleNewSession}
                  isGenerating={isLoading}
                  regenerateResponse={regenerateLastResponse}
                  currentEngine="Hybrid AI Query"
                  onStopGeneration={stop}
                  onFeedback={handleFeedback}
                  jobProgress={hybridState.progress}
                  jobId={hybridState.jobId}
                  onCancelJob={cancel}
                  queryMode={currentMode}
                  error={error}
                  onClearError={clearError}
                  onRetry={retryLastQuery}
                />
              ) : (
                <div className="h-full p-0">
                  <AIContentArea selectedFunction={selectedFunction} />
                </div>
              )}
            </AIErrorBoundary>
          </div>
        </div>

        {/* RIGHT SIDEBAR (System Context) - 실시간 헬스 체크 연동 */}
        {selectedFunction === 'chat' && isRightPanelOpen && (
          <SystemContextPanel className="hidden lg:flex" />
        )}
      </div>
    </div>
  );
}
