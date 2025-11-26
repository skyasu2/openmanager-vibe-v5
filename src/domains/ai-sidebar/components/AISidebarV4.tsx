'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
  Fragment,
  type FC,
} from 'react';
import { useChat } from 'ai/react';
import { Message } from 'ai';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import {
  useAISidebarStore,
  EnhancedChatMessage,
} from '../../../stores/useAISidebarStore';

// Icons
import { Bot, User } from 'lucide-react';

// Components
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';
import ThinkingProcessVisualizer from '../../../components/ai/ThinkingProcessVisualizer';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';

// Types
import type {
  AISidebarV3Props,
  AIThinkingStep,
} from '../types/ai-sidebar-types';

// 🎯 ThinkingProcessVisualizer 성능 최적화
const MemoizedThinkingProcessVisualizer = memo(ThinkingProcessVisualizer);

// 🎯 메시지 컴포넌트 성능 최적화
const MessageComponent = memo<{
  message: EnhancedChatMessage;
  onRegenerateResponse?: (messageId: string) => void;
}>(({ message }) => {
  // thinking 메시지일 경우 ThinkingProcessVisualizer 사용
  if (message.role === 'thinking' && message.thinkingSteps) {
    return (
      <div className="my-4">
        <MemoizedThinkingProcessVisualizer
          steps={message.thinkingSteps as AIThinkingStep[]}
          isActive={message.isStreaming || false}
          className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4"
        />
      </div>
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
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {message.role === 'user' ? (
            <User className="h-3 w-3" />
          ) : (
            <Bot className="h-3 w-3" />
          )}
        </div>

        {/* 메시지 콘텐츠 */}
        <div className="flex-1">
          <div
            className={`rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <div className="whitespace-pre-wrap break-words text-sm">
              {message.content}
            </div>
          </div>

          {/* 타임스탬프 & 메타데이터 */}
          <div
            className={`mt-1 flex items-center justify-between ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <p className="text-xs text-gray-500">
              {typeof message.timestamp === 'string'
                ? new Date(message.timestamp).toLocaleTimeString()
                : message.timestamp.toLocaleTimeString()}
            </p>
          </div>

          {/* EnhancedChatMessage의 thinking steps 표시 (assistant 메시지에서) */}
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

// 🔒 완전 Client-Only AI 사이드바 컴포넌트 (V4 - Vercel AI SDK Integration)
export const AISidebarV4: FC<AISidebarV3Props> = ({
  isOpen,
  onClose,
  className = '',
  sessionId,
  enableRealTimeThinking = true,
  onMessageSend,
}) => {
  // 🔐 권한 확인
  const permissions = useUserPermissions();

  // 🔧 상태 관리
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');

  // Vercel AI SDK useChat Hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
  } = useChat({
    api: '/api/ai/chat',
    initialMessages: [], // TODO: Load from store if needed
    onFinish: (message) => {
      // Optional: Sync to global store if needed
      onMessageSend?.(input);
    },
  });

  // Map Vercel messages to EnhancedChatMessage
  const enhancedMessages = useMemo(() => {
    return messages.map(
      (m): EnhancedChatMessage => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt || new Date(),
        isStreaming: isLoading && m.id === messages[messages.length - 1].id,
        thinkingSteps: m.toolInvocations?.map((t) => ({
          id: t.toolCallId,
          step: t.toolName,
          status: t.state === 'result' ? 'completed' : 'processing',
          description:
            t.state === 'result'
              ? `Completed: ${JSON.stringify(t.result)}`
              : `Executing ${t.toolName}...`,
          timestamp: new Date(),
        })),
      })
    );
  }, [messages, isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enhancedMessages]);

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
          enableRealTimeThinking={enableRealTimeThinking}
          autoReportTrigger={{ shouldGenerate: false }}
          allMessages={enhancedMessages}
          limitedMessages={enhancedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          inputValue={input}
          setInputValue={(val) => {
            // Hack to set input value via handleInputChange event simulation
            const event = { target: { value: val } } as any;
            handleInputChange(event);
          }}
          handleSendInput={() => {
            // Create a synthetic event for handleSubmit
            const event = { preventDefault: () => {} } as any;
            handleSubmit(event);
          }}
          isGenerating={isLoading}
          regenerateResponse={() => reload()}
          currentEngine="Vercel AI SDK"
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
    <Fragment>
      <div
        role="dialog"
        aria-labelledby="ai-sidebar-v4-title"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-30 flex h-full w-full max-w-[90vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out will-change-transform sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[800px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <AISidebarHeader onClose={onClose} />
          <div className="flex-1 overflow-hidden pb-20 sm:pb-0">
            {renderFunctionPage()}
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
    </Fragment>
  );
};

export default memo(AISidebarV4) as FC<AISidebarV3Props>;
