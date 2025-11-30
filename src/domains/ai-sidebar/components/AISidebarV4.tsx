/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useChat } from '@ai-sdk/react';
// Icons
import { Bot, User } from 'lucide-react';
import { type FC, memo, useEffect, useMemo, useRef, useState } from 'react';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';
import ThinkingProcessVisualizer from '../../../components/ai/ThinkingProcessVisualizer';
import { EnhancedChatMessage } from '../../../stores/useAISidebarStore';
// Types
import type {
  AISidebarV3Props,
  AIThinkingStep,
} from '../types/ai-sidebar-types';
// Components
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';

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
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
            message.role === 'user'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
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
          <div
            className={`rounded-2xl p-4 shadow-sm ${
              message.role === 'user'
                ? 'rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
            }`}
          >
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionId: _sessionId,
  enableRealTimeThinking = true,
  onMessageSend,
}) => {
  // 🔐 권한 확인
  const permissions = useUserPermissions();

  // 🔧 상태 관리
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');

  // Vercel AI SDK useChat Hook (@ai-sdk/react v1.2.12)
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
  } = useChat({
    api: '/api/ai/unified-stream', // ✨ 포트폴리오용 Tools 포함
    onFinish: (message) => {
      // Optional: Sync to global store if needed
      onMessageSend?.(input);
      console.log('AI response finished:', message);
    },
  });

  // Map Vercel messages to EnhancedChatMessage
  const enhancedMessages = useMemo(() => {
    return messages.map(
      (m: any): EnhancedChatMessage => ({
        id: m.id,
        role: m.role,
        content:
          m.content || m.parts?.find((p: any) => p.type === 'text')?.text || '',
        timestamp: m.createdAt || new Date(),
        isStreaming: isLoading && m.id === messages[messages.length - 1]?.id,
        thinkingSteps: m.toolInvocations?.map((t: any) => ({
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
          enableRealTimeThinking={enableRealTimeThinking}
          autoReportTrigger={{ shouldGenerate: false }}
          allMessages={enhancedMessages}
          limitedMessages={enhancedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          inputValue={input}
          setInputValue={(val) => {
            // Simulate event for handleInputChange
            const event = { target: { value: val } } as any;
            handleInputChange(event);
          }}
          handleSendInput={() => {
            // Simulate event for handleSubmit
            const event = { preventDefault: () => {} } as any;
            void handleSubmit(event); // void operator to ignore Promise return
          }}
          isGenerating={isLoading}
          regenerateResponse={() => {
            void reload();
          }}
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
  );
};

export default memo(AISidebarV4) as FC<AISidebarV3Props>;
