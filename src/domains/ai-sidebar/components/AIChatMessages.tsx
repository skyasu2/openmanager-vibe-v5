/**
 * AI 채팅 메시지 컴포넌트
 * 채팅 메시지 목록 렌더링 및 관리
 */

// React import 제거 - Next.js 15 자동 JSX Transform 사용
// framer-motion 제거 - CSS 애니메이션 사용
import { Bot, User } from 'lucide-react';
import { Fragment } from 'react';
import type { ChatMessage } from '@/stores/useAISidebarStore';
import { AIThinkingDisplay } from './AIThinkingDisplay';
import type { CompletedThinking } from '../hooks/useAIThinking';

interface AIChatMessagesProps {
  messages: ChatMessage[];
  completedThinkingSteps: Record<string, CompletedThinking>;
  onToggleCompletedThinking: (messageId: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export const AIChatMessages: FC<AIChatMessagesProps> = ({
  messages,
  completedThinkingSteps,
  onToggleCompletedThinking,
  messagesEndRef,
}) => {
  if (messages.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-600">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          안녕하세요! 👋
        </h3>
        <p className="mx-auto max-w-[280px] text-sm text-gray-500">
          아래 프리셋 질문을 선택하거나 직접 질문을 입력해보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message, index) => {
        // 메시지 ID로 완료된 사고 과정 찾기
        const thinkingForMessage = Object.entries(completedThinkingSteps).find(
          ([_, thinking]) =>
            thinking.query === message.content && message.role === 'user'
        );

        return (
          <Fragment key={message.id}>
            {/* 사용자 메시지 다음에 사고 과정 표시 */}
            {message.role === 'user' && thinkingForMessage && (
              <div className="mb-3">
                <AIThinkingDisplay
                  isThinking={false}
                  currentSteps={[]}
                  isExpanded={false}
                  startTime={null}
                  onToggleExpanded={() => {}}
                  completedThinking={thinkingForMessage[1]}
                  onToggleCompleted={() =>
                    onToggleCompletedThinking(thinkingForMessage[0])
                  }
                />
              </div>
            )}

            {/* 메시지 렌더링 */}
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    {message.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </p>
                    <span className="mt-1 block text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </>
  );
};
