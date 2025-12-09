'use client';

import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
// Icons
import { Bot, User } from 'lucide-react';
import { type FC, memo, useEffect, useMemo, useRef, useState } from 'react';
import type { AIAssistantFunction } from '../../../components/ai/AIAssistantIconPanel';
import AIAssistantIconPanel from '../../../components/ai/AIAssistantIconPanel';
import ThinkingProcessVisualizer from '../../../components/ai/ThinkingProcessVisualizer';
import { isGuestFullAccessEnabled } from '../../../config/guestMode';
import { useUserPermissions } from '../../../hooks/useUserPermissions';
import type { EnhancedChatMessage } from '../../../stores/useAISidebarStore';
// Types
import type {
  AISidebarV3Props,
  AIThinkingStep,
} from '../types/ai-sidebar-types';
// Components
import { AIFunctionPages } from './AIFunctionPages';
import { AISidebarHeader } from './AISidebarHeader';
import { EnhancedAIChat } from './EnhancedAIChat';

// v2.x UIMessage에서 텍스트 콘텐츠 추출 헬퍼
function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }
  return message.parts
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    )
    .map((part) => part.text)
    .join('');
}

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
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs ${
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
            className={`rounded-2xl p-4 shadow-xs ${
              message.role === 'user'
                ? 'rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
            }`}
          >
            <div className="whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed">
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
            {/* 처리 시간 표시 (assistant 메시지만) */}
            {message.role === 'assistant' &&
              message.metadata?.processingTime && (
                <p className="text-xs text-gray-400">
                  {message.metadata.processingTime}ms
                </p>
              )}
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

  // 🔧 수동 입력 상태 관리 (@ai-sdk/react v2.x 마이그레이션)
  const [input, setInput] = useState('');

  // 🧠 Thinking 모드 상태 관리
  const [thinkingEnabled, setThinkingEnabled] = useState(false);

  // Vercel AI SDK useChat Hook (@ai-sdk/react v2.x)
  const { messages, sendMessage, status, setMessages } = useChat({
    // v2.x: transport 옵션으로 API 엔드포인트 설정
    transport: new DefaultChatTransport({
      api: '/api/ai/unified-stream', // ✨ 포트폴리오용 Tools 포함
    }),
    onFinish: () => {
      // Optional: Sync to global store if needed
      onMessageSend?.(input);
      setInput(''); // 입력 초기화
    },
  });

  // v2.x: 재생성 함수 (마지막 assistant 메시지 제거 후 재전송)
  const regenerateLastResponse = () => {
    if (messages.length < 2) return;
    // 마지막 assistant 메시지 찾아서 제거
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex];
    if (!lastUserMessage) return;
    // assistant 메시지들 제거하고 user 메시지 재전송
    const textContent = extractTextFromMessage(lastUserMessage);
    if (textContent) {
      setMessages(messages.slice(0, actualIndex));
      void sendMessage({ text: textContent });
    }
  };

  // isLoading 호환성 유지 (v2.x status values: 'ready' | 'submitted' | 'streaming' | 'error')
  const isLoading = status === 'streaming' || status === 'submitted';

  // Map Vercel v2.x UIMessage to EnhancedChatMessage
  const enhancedMessages = useMemo(() => {
    return messages
      .filter(
        (m) =>
          m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      )
      .map((m): EnhancedChatMessage => {
        // v2.x/v5.x: parts 배열에서 텍스트 추출
        const textContent = extractTextFromMessage(m);

        // v5.x: tool parts는 type이 'tool-${toolName}' 형태
        // state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
        const toolParts =
          m.parts?.filter(
            (part): part is typeof part & { toolCallId: string } =>
              part.type.startsWith('tool-') && 'toolCallId' in part
          ) ?? [];

        // tool parts를 thinking steps로 변환
        const thinkingSteps = toolParts.map((toolPart) => {
          // type에서 tool name 추출 (예: 'tool-getServerMetrics' -> 'getServerMetrics')
          const toolName = toolPart.type.slice(5);
          const state = (toolPart as { state?: string }).state;
          const output = (toolPart as { output?: unknown }).output;

          const isCompleted =
            state === 'output-available' || output !== undefined;
          const hasError = state === 'output-error';

          return {
            id: toolPart.toolCallId,
            step: toolName,
            status: hasError
              ? ('failed' as const)
              : isCompleted
                ? ('completed' as const)
                : ('processing' as const),
            description: hasError
              ? `Error: ${(toolPart as { errorText?: string }).errorText || 'Unknown error'}`
              : isCompleted
                ? `Completed: ${JSON.stringify(output)}`
                : `Executing ${toolName}...`,
            timestamp: new Date(),
          };
        });

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system' | 'thinking',
          content: textContent,
          timestamp: new Date(), // v2.x: createdAt 직접 없음, 현재 시간 사용
          isStreaming: isLoading && m.id === messages[messages.length - 1]?.id,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
        };
      });
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
          thinkingEnabled={thinkingEnabled}
          onThinkingToggle={setThinkingEnabled}
          autoReportTrigger={{ shouldGenerate: false }}
          allMessages={enhancedMessages}
          limitedMessages={enhancedMessages}
          messagesEndRef={messagesEndRef}
          MessageComponent={MessageComponent}
          inputValue={input}
          setInputValue={setInput}
          handleSendInput={() => {
            if (input.trim()) {
              // @ai-sdk/react v2.x: sendMessage API with thinking in metadata
              void sendMessage({
                text: input,
                metadata: { thinking: thinkingEnabled },
              });
            }
          }}
          isGenerating={isLoading}
          regenerateResponse={() => {
            regenerateLastResponse();
          }}
          currentEngine={thinkingEnabled ? 'Thinking Mode' : 'Vercel AI SDK'}
          routingReason={thinkingEnabled ? '심층 추론 활성화' : undefined}
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
