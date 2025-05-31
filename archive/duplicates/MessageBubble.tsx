/**
 * MessageBubble Component
 * 
 * 💬 메시지 버블 컴포넌트
 */

'use client';

import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  className = ''
}) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const getBubbleClasses = () => {
    if (isUser) {
      return 'bg-blue-500 text-white ml-auto';
    }
    if (isSystem) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 mx-auto';
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'} ${className}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getBubbleClasses()}`}>
        {/* 메시지 내용 */}
        <div className="whitespace-pre-wrap text-sm">
          {message.content}
        </div>

        {/* 액션 버튼들 */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.actions.map((action, index) => (
              <button
                key={index}
                className="px-2 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 
                         rounded border border-white border-opacity-30 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* 메타데이터 */}
        {message.metadata && (
          <div className="mt-1 text-xs opacity-70">
            {message.metadata.confidence && (
              <span>신뢰도: {Math.round(message.metadata.confidence * 100)}%</span>
            )}
            {message.metadata.processingTime && (
              <span className="ml-2">
                처리시간: {message.metadata.processingTime}ms
              </span>
            )}
          </div>
        )}

        {/* 타임스탬프 */}
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : isSystem ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}; 