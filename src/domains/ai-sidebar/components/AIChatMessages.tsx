/**
 * AI 채팅 메시지 컴포넌트
 * 채팅 메시지 목록 렌더링 및 관리
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/stores/useAISidebarStore';
import { AIThinkingDisplay } from './AIThinkingDisplay';
import type { CompletedThinking } from '../hooks/useAIThinking';

interface AIChatMessagesProps {
  messages: ChatMessage[];
  completedThinkingSteps: Record<string, CompletedThinking>;
  onToggleCompletedThinking: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const AIChatMessages: React.FC<AIChatMessagesProps> = ({
  messages,
  completedThinkingSteps,
  onToggleCompletedThinking,
  messagesEndRef,
}) => {
  if (messages.length === 0) {
    return (
      <div className='text-center py-8'>
        <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3'>
          <Bot className='w-6 h-6 text-white' />
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          안녕하세요! 👋
        </h3>
        <p className='text-sm text-gray-500 max-w-[280px] mx-auto'>
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
          ([_, thinking]) => thinking.query === message.content && message.role === 'user'
        );

        return (
          <React.Fragment key={message.id}>
            {/* 사용자 메시지 다음에 사고 과정 표시 */}
            {message.role === 'user' && thinkingForMessage && (
              <div className='mb-3'>
                <AIThinkingDisplay
                  isThinking={false}
                  currentSteps={[]}
                  isExpanded={false}
                  startTime={null}
                  onToggleExpanded={() => {}}
                  completedThinking={thinkingForMessage[1]}
                  onToggleCompleted={() => onToggleCompletedThinking(thinkingForMessage[0])}
                />
              </div>
            )}

            {/* 메시지 렌더링 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className='flex items-start space-x-2'>
                  <div className='mt-0.5'>
                    {message.role === 'user' ? (
                      <User className='w-3 h-3' />
                    ) : (
                      <Bot className='w-3 h-3' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm whitespace-pre-wrap break-words'>
                      {message.content}
                    </p>
                    <span className='text-xs opacity-70 mt-1 block'>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </>
  );
};