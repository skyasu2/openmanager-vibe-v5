/**
 * 💬 채팅 메시지 아이템 컴포넌트
 *
 * AIEnhancedChat에서 분리된 개별 메시지 렌더링
 */

'use client';

import { motion } from 'framer-motion';
import { Bot, RotateCcw, User } from 'lucide-react';
import React from 'react';

// 타입 임포트
import type { ChatMessage } from '../types/ai-sidebar-types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerateResponse: (messageId: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRegenerateResponse,
}) => {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message?.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[90%] items-start space-x-2 sm:max-w-[85%] ${
          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {/* 아바타 */}
        <div
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {message.type === 'user' ? (
            <User className="h-3 w-3" />
          ) : (
            <Bot className="h-3 w-3" />
          )}
        </div>

        {/* 메시지 내용 */}
        <div
          className={`rounded-lg px-3 py-2 ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'border border-gray-200 bg-white text-gray-800'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>

          {/* 메타데이터 */}
          <div className="mt-2 flex items-center justify-between text-xs opacity-70">
            <span>
              {message.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.engine && <span className="ml-2">{message.engine}</span>}
          </div>

          {/* 생각 과정 표시 */}
          {message.thinking && message.thinking.length > 0 && (
            <div className="mt-2 rounded border bg-gray-50 p-2">
              <div className="mb-1 text-xs font-medium text-gray-700">
                💭 생각 과정
              </div>
              <div className="space-y-1">
                {message.thinking.map((step) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        step.status === 'completed'
                          ? 'bg-green-500'
                          : step.status === 'processing'
                            ? '_animate-pulse bg-blue-500'
                            : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-xs text-gray-600">{step.title}</span>
                    {step.duration && (
                      <span className="text-xs text-gray-500">
                        ({step.duration}ms)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 메시지 액션 버튼 */}
          {message.type === 'ai' && (
            <div className="mt-2 flex items-center space-x-2">
              <button
                onClick={() => onRegenerateResponse(message.id)}
                className="flex items-center space-x-1 rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
                <span>재생성</span>
              </button>
              {message.confidence && (
                <span className="text-xs text-gray-500">
                  신뢰도: {Math.round(message.confidence * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
