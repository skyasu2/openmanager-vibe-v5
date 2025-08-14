/**
 * 🤖 AI 강화 채팅 컴포넌트
 *
 * 기능:
 * - AI 엔진 선택
 * - 메시지 주고받기
 * - 생각 과정 시각화
 * - 자동 장애 보고서 연동
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Sparkles,
  StopCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// 타입 임포트
import type { AutoReportTrigger, ChatMessage } from '../types/ai-sidebar-types';

// 컴포넌트 임포트
import { AIEngineSelector } from './AIEngineSelector';
import { ChatMessageItem } from './ChatMessageItem';

interface AIEnhancedChatProps {
  selectedEngine: string;
  onEngineChange: (engine: string) => void;
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  autoReportTrigger: AutoReportTrigger;
  onAutoReportGenerate: () => void;
  onAutoReportDismiss: () => void;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onRegenerateResponse: (messageId: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  showPresets: boolean;
  onTogglePresets: () => void;
  currentPresetIndex: number;
  onPresetQuestion: (question: string) => void;
  onPreviousPresets: () => void;
  onNextPresets: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  className?: string;
}

export const AIEnhancedChat: React.FC<AIEnhancedChatProps> = ({
  selectedEngine,
  onEngineChange,
  chatMessages,
  isGenerating,
  autoReportTrigger,
  onAutoReportGenerate,
  onAutoReportDismiss,
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  inputValue,
  onInputChange,
  showPresets,
  onTogglePresets,
  currentPresetIndex,
  onPresetQuestion,
  onPreviousPresets,
  onNextPresets,
  canGoPrevious,
  canGoNext,
  className = '',
}) => {
  // 스크롤 관리를 위한 ref와 상태
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 스크롤 위치 확인 함수
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px 여유값
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const atBottom = isAtBottom();
    setIsUserScrolled(!atBottom);
  };

  // 새 메시지나 생성 상태 변경 시 자동 스크롤
  useEffect(() => {
    if (!isUserScrolled) {
      scrollToBottom();
    }
  }, [chatMessages, isGenerating, isUserScrolled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      // 메시지 전송 시 자동 스크롤 모드로 전환
      setIsUserScrolled(false);
      onSendMessage();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 ${className}`}
      data-testid='ai-enhanced-chat'
    >
      {/* 헤더 */}
      <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center'>
              <Sparkles className='w-4 h-4 text-white' />
            </div>
            <div>
              <h3 className='text-sm font-semibold text-gray-800'>
                자연어 질의
              </h3>
              <p className='text-xs text-gray-600'>
                AI와 대화하며 시스템을 관리하세요
              </p>
            </div>
          </div>

          {/* 엔진 선택 버튼 */}
          <AIEngineSelector
            selectedEngine={selectedEngine}
            onEngineChange={onEngineChange}
          />
        </div>
      </div>

      {/* 자동 장애 보고서 트리거 */}
      <AnimatePresence>
        {autoReportTrigger?.shouldGenerate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='flex-shrink-0 p-3 sm:p-4 bg-amber-50 border-b border-amber-200'
          >
            <div className='flex items-start space-x-3'>
              <div className='w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <FileText className='w-4 h-4 text-amber-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <h4 className='text-sm font-semibold text-amber-800'>
                  자동 장애 보고서 생성
                </h4>
                <p className='text-xs text-amber-700 mt-1'>
                  {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                  {autoReportTrigger.lastQuery &&
                    ` (쿼리: ${autoReportTrigger.lastQuery})`}
                </p>
                <div className='flex items-center space-x-2 mt-2'>
                  <button
                    onClick={onAutoReportGenerate}
                    className='px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors'
                  >
                    자동 생성
                  </button>
                  <button
                    onClick={onAutoReportDismiss}
                    className='px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors'
                  >
                    나중에
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메시지 영역 */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-4'
      >
        {chatMessages.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <Bot className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-sm text-gray-600 mb-2'>
                AI 어시스턴트와 대화를 시작하세요
              </p>
              <p className='text-xs text-gray-500'>
                시스템 상태, 로그 분석, 최적화 제안 등을 문의할 수 있습니다
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map(message => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onRegenerateResponse={onRegenerateResponse}
              />
            ))}

            {/* 생성 중 표시 */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex justify-start'
              >
                <div className='flex items-start space-x-2'>
                  <div className='w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0'>
                    <Bot className='w-3 h-3' />
                  </div>
                  <div className='bg-white border border-gray-200 rounded-lg px-3 py-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='flex space-x-1'>
                        <div className='w-2 h-2 bg-purple-500 rounded-full _animate-bounce'></div>
                        <div
                          className='w-2 h-2 bg-purple-500 rounded-full _animate-bounce'
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className='w-2 h-2 bg-purple-500 rounded-full _animate-bounce'
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className='text-xs text-gray-600'>
                        AI가 생각하고 있습니다...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        
        {/* 스크롤 타겟 - 항상 메시지 맨 아래에 위치 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 영역 */}
      {showPresets && (
        <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-t border-gray-200'>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='text-xs font-semibold text-gray-800'>
              💡 추천 질문
            </h4>
            <div className='flex items-center space-x-2'>
              <button
                onClick={onPreviousPresets}
                disabled={!canGoPrevious}
                className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                title='이전 프리셋 질문'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <span className='text-xs text-gray-500'>
                {currentPresetIndex + 1}
              </span>
              <button
                onClick={onNextPresets}
                disabled={!canGoNext}
                className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                title='다음 프리셋 질문'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-t border-gray-200'>
        <form onSubmit={handleSubmit} className='flex items-end space-x-2'>
          <div className='flex-1'>
            <textarea
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              placeholder='질문을 입력하세요... (Shift+Enter로 줄바꿈)'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm'
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isGenerating}
            />
          </div>

          <button
            type='button'
            onClick={onTogglePresets}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              showPresets
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💡
          </button>
          {isGenerating ? (
            <button
              type='button'
              onClick={onStopGeneration}
              className='px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1'
            >
              <StopCircle className='w-3 h-3' />
              <span>중지</span>
            </button>
          ) : (
            <button
              type='submit'
              disabled={!inputValue.trim()}
              className='px-3 py-2 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1'
            >
              <Send className='w-3 h-3' />
              <span>전송</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
