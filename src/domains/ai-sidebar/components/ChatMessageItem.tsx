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
        className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {/* 아바타 */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {message.type === 'user' ? (
            <User className='w-3 h-3' />
          ) : (
            <Bot className='w-3 h-3' />
          )}
        </div>

        {/* 메시지 내용 */}
        <div
          className={`rounded-lg px-3 py-2 ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          <p className='text-sm whitespace-pre-wrap'>{message.content}</p>

          {/* 메타데이터 */}
          <div className='flex items-center justify-between mt-2 text-xs opacity-70'>
            <span>
              {message.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.engine && <span className='ml-2'>{message.engine}</span>}
          </div>

          {/* 생각 과정 표시 */}
          {message.thinking && message.thinking.length > 0 && (
            <div className='mt-2 p-2 bg-gray-50 rounded border'>
              <div className='text-xs font-medium text-gray-700 mb-1'>
                💭 생각 과정
              </div>
              <div className='space-y-1'>
                {message.thinking.map(step => (
                  <div key={step.id} className='flex items-center space-x-2'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        step.status === 'completed'
                          ? 'bg-green-500'
                          : step.status === 'processing'
                            ? 'bg-blue-500 _animate-pulse'
                            : 'bg-gray-300'
                      }`}
                    />
                    <span className='text-xs text-gray-600'>{step.title}</span>
                    {step.duration && (
                      <span className='text-xs text-gray-500'>
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
            <div className='flex items-center space-x-2 mt-2'>
              <button
                onClick={() => onRegenerateResponse(message.id)}
                className='flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors'
              >
                <RotateCcw className='w-3 h-3' />
                <span>재생성</span>
              </button>
              {message.confidence && (
                <span className='text-xs text-gray-500'>
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
