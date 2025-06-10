/**
 * ChatInterface Component
 *
 * 💬 채팅 인터페이스 컴포넌트
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AISidebarConfig } from '../types';
import { useAIChat } from '../hooks/useAIChat';
import { usePowerStore } from '../../../stores/powerStore';
import { smartAIAgent } from '../../../services/aiAgent';

interface ChatInterfaceProps {
  config: AISidebarConfig;
  welcomeMessage?: string;
  className?: string;
}

// 간단한 메시지 버블 컴포넌트 (인라인)
const SimpleMessageBubble = ({ message }: { message: any }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-purple-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className='text-sm whitespace-pre-wrap'>{message.content}</div>
        <div className='text-xs opacity-70 mt-1'>
          {message.timestamp?.toLocaleTimeString() ||
            new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// 간단한 액션 버튼 컴포넌트 (인라인)
const SimpleActionButtons = ({ actions }: { actions: any[] }) => {
  return (
    <div className='flex gap-2 flex-wrap'>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => action.onClick?.()}
          className='px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  config,
  welcomeMessage,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [presetQuestions, setPresetQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 절전 모드 상태
  const { mode, updateActivity } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';

  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat({
    apiEndpoint: config.apiEndpoint,
    onMessage: config.onMessage,
    onResponse: config.onResponse,
    onError: config.onError,
  });

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 웰컴 메시지 및 프리셋 질문 업데이트
  const generateQuestions = useCallback(() => {
    if (isSystemActive) {
      return smartAIAgent.generatePresetQuestions();
    } else {
      return [
        '시스템을 활성화해주세요',
        '절전 모드에서는 AI 기능이 제한됩니다',
      ];
    }
  }, [isSystemActive]);

  useEffect(() => {
    if (welcomeMessage && messages.length === 0) {
      // 웰컴 메시지는 실제 메시지로 추가하지 않고 UI에서만 표시
    }

    // 시스템 상태에 따른 프리셋 질문 생성
    const questions = generateQuestions();
    setPresetQuestions(questions);
  }, [welcomeMessage, messages.length, generateQuestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      // 활동 업데이트
      updateActivity();

      // 시스템이 활성화된 경우 스마트 응답 생성
      if (isSystemActive) {
        const smartResponse = smartAIAgent.generateSmartResponse(
          inputValue.trim()
        );

        // 사용자 메시지 전송
        sendMessage(inputValue.trim());

        // AI 응답을 별도로 추가 (실제 구현에서는 useAIChat 훅을 수정해야 함)
        // 현재는 기본 sendMessage만 사용
      } else {
        // 절전 모드에서는 기본 메시지만 전송
        sendMessage(inputValue.trim());
      }

      setInputValue('');
    }
  };

  const handlePresetClick = (question: string) => {
    if (!isLoading && isSystemActive) {
      setInputValue(question);
      // 자동으로 전송
      setTimeout(() => {
        const event = new Event('submit') as any;
        handleSubmit(event);
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 메시지 영역 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {/* 웰컴 메시지 */}
        {welcomeMessage && messages.length === 0 && (
          <div className='text-center text-gray-500 dark:text-gray-400 text-sm'>
            {welcomeMessage}
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map(message => (
          <SimpleMessageBubble key={message.id} message={message} />
        ))}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className='flex justify-start'>
            <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-xs'>
              <div className='flex space-x-1'>
                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                <div
                  className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3'>
            <div className='flex items-center space-x-2'>
              <span className='text-red-500'>⚠️</span>
              <span className='text-red-700 dark:text-red-300 text-sm'>
                {error}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 영역 */}
      {presetQuestions.length > 0 && (
        <div className='px-4 py-2 border-t dark:border-gray-700'>
          <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
            {isSystemActive ? '추천 질문:' : '시스템 상태:'}
          </div>
          <div className='flex flex-wrap gap-2'>
            {presetQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(question)}
                disabled={!isSystemActive}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  isSystemActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {question.length > 30
                  ? `${question.substring(0, 30)}...`
                  : question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 영역 */}
      {config.customActions && config.customActions.length > 0 && (
        <div className='px-4 py-2 border-t dark:border-gray-700'>
          <SimpleActionButtons actions={config.customActions} />
        </div>
      )}

      {/* 입력 영역 */}
      <div className='p-4 border-t dark:border-gray-700'>
        <form onSubmit={handleSubmit} className='flex space-x-2'>
          <input
            aria-label='입력 필드'
            ref={inputRef}
            type='text'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            disabled={isLoading}
            className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed'
          />
          <button
            type='submit'
            disabled={!inputValue.trim() || isLoading}
            className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors'
          >
            {isLoading ? (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            )}
          </button>
        </form>

        {/* 유틸리티 버튼 */}
        <div className='flex justify-between items-center mt-2'>
          <button
            onClick={clearChat}
            className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          >
            대화 초기화
          </button>
          <span className='text-xs text-gray-400'>
            {messages.length}개 메시지
          </span>
        </div>
      </div>
    </div>
  );
};
