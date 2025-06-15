import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
} from 'lucide-react';

interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  progress: number;
  completed: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  pages?: string[];
}

interface ChatAreaProps {
  messages: ChatMessage[];
  currentInput: string;
  isThinking: boolean;
  currentPage: number;
  totalPages: number;
  thinkingCollapsed: boolean;
  currentThinking: ThinkingStep[];
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onPageChange: (page: number) => void;
  onThinkingToggle: (collapsed: boolean) => void;
}

export default function ChatArea({
  messages,
  currentInput,
  isThinking,
  currentPage,
  totalPages,
  thinkingCollapsed,
  currentThinking,
  onInputChange,
  onSendMessage,
  onPageChange,
  onThinkingToggle,
}: ChatAreaProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className='flex-1 flex flex-col overflow-hidden'>
      {/* 메시지 컨테이너 */}
      <div
        ref={chatContainerRef}
        className='flex-1 overflow-y-auto p-4 space-y-4'
      >
        {messages.map(message => (
          <div key={message.id} className='space-y-3'>
            {/* 사용자 메시지 */}
            {message.type === 'user' && (
              <div className='flex justify-end'>
                <div className='max-w-[80%] p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-md shadow-sm'>
                  {message.content}
                </div>
              </div>
            )}

            {/* AI 생각 과정 */}
            {message.type === 'ai' && message.thinking && (
              <div className='space-y-2'>
                {isThinking && !thinkingCollapsed && (
                  <div
                    ref={thinkingRef}
                    className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4'
                  >
                    <div className='flex items-center gap-2 mb-3'>
                      <Brain className='w-4 h-4 text-blue-600 animate-pulse' />
                      <span className='text-sm font-medium text-blue-800'>
                        생각 중...
                      </span>
                    </div>

                    <div className='space-y-3'>
                      {currentThinking.map(step => (
                        <div key={step.id} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs font-medium text-gray-700'>
                              {step.title}
                            </span>
                            {step.completed && (
                              <div className='w-2 h-2 bg-green-500 rounded-full' />
                            )}
                          </div>

                          {/* 진행률 바 */}
                          <div className='w-full bg-gray-200 rounded-full h-1.5'>
                            <motion.div
                              className='bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full'
                              initial={{ width: 0 }}
                              animate={{ width: `${step.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>

                          <p className='text-xs text-gray-600'>
                            {step.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 접힌 생각 과정 */}
                {thinkingCollapsed && (
                  <button
                    onClick={() => onThinkingToggle(false)}
                    className='w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-all'
                  >
                    <div className='flex items-center gap-2'>
                      <Brain className='w-4 h-4 text-blue-600' />
                      <span className='text-sm font-medium text-blue-800'>
                        생각 과정 보기
                      </span>
                    </div>
                    <ChevronDown className='w-4 h-4 text-blue-600' />
                  </button>
                )}
              </div>
            )}

            {/* AI 응답 (페이지네이션) */}
            {message.type === 'ai' && message.pages && !isThinking && (
              <div className='space-y-3'>
                <div className='bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md p-4'>
                  <div className='text-gray-800 leading-relaxed'>
                    {message.pages[currentPage]}
                  </div>

                  {/* 페이지네이션 컨트롤 */}
                  {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-200'>
                      <button
                        onClick={() =>
                          onPageChange(Math.max(0, currentPage - 1))
                        }
                        disabled={currentPage === 0}
                        className='p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <ChevronLeft className='w-4 h-4' />
                      </button>

                      <div className='flex items-center gap-1'>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => onPageChange(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === currentPage
                                ? 'bg-purple-500'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          onPageChange(
                            Math.min(totalPages - 1, currentPage + 1)
                          )
                        }
                        disabled={currentPage === totalPages - 1}
                        className='p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <ChevronRight className='w-4 h-4' />
                      </button>
                    </div>
                  )}
                </div>

                {/* 페이지 인디케이터 */}
                {totalPages > 1 && (
                  <div className='text-center'>
                    <span className='text-xs text-gray-500'>
                      {currentPage + 1} / {totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 로딩 상태 */}
        {isThinking && (
          <div className='flex justify-center'>
            <div className='flex items-center gap-2 text-gray-500'>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span className='text-sm'>AI가 답변을 준비하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* 빈 상태 메시지 */}
        {messages.length === 0 && !isThinking && (
          <div className='flex-1 flex items-center justify-center p-8'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Brain className='w-8 h-8 text-purple-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                AI 어시스턴트와 대화해보세요
              </h3>
              <p className='text-gray-600 text-sm'>
                위의 빠른 질문을 클릭하거나
                <br />
                직접 질문을 입력해보세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className='p-4 border-t border-gray-200 bg-white'>
        <div className='flex gap-2'>
          <textarea
            value={currentInput}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder='서버 관리에 대해 질문하세요... (Shift+Enter로 줄바꿈)'
            className='flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[44px] max-h-32'
            disabled={isThinking}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '44px',
            }}
            ref={textarea => {
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height =
                  Math.min(textarea.scrollHeight, 128) + 'px';
              }
            }}
          />
          <button
            onClick={onSendMessage}
            disabled={!currentInput.trim() || isThinking}
            className='p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end'
          >
            <Send className='w-5 h-5' />
          </button>
        </div>

        {/* 입력 힌트 */}
        <div className='mt-2 text-xs text-gray-500 text-center'>
          💡 Shift+Enter로 줄바꿈, Enter로 전송
        </div>
      </div>
    </div>
  );
}
