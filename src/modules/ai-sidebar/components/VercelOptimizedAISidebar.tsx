/**
 * 🚀 Vercel 최적화 AI 사이드바
 *
 * - Streaming Response 처리
 * - ChatGPT 스타일 UX
 * - 실시간 생각하기 과정 표시
 * - 타이핑 효과 구현
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { CompactQuestionTemplates } from './ui/CompactQuestionTemplates';
import { QuestionInput } from './ui/QuestionInput';

interface StreamEvent {
  type: 'thinking' | 'response_start' | 'response_chunk' | 'complete' | 'error';
  step?: string;
  index?: number;
  chunk?: string;
  error?: string;
}

interface ConversationItem {
  id: string;
  question: string;
  thinkingSteps: string[];
  response: string;
  isComplete: boolean;
  timestamp: number;
  category: string;
}

interface VercelOptimizedAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const VercelOptimizedAISidebar: React.FC<
  VercelOptimizedAISidebarProps
> = ({ isOpen, onClose, className = '' }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  // 현재 스트리밍 상태
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<string[]>(
    []
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentResponse, setCurrentResponse] = useState('');
  const [streamPhase, setStreamPhase] = useState<
    'idle' | 'thinking' | 'responding'
  >('idle');

  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // 카테고리 결정
  const determineCategory = (question: string): string => {
    const keywords = {
      monitoring: ['상태', '모니터', '헬스체크', '서버', '시스템'],
      analysis: ['분석', '성능', '리소스', '사용률', '트렌드'],
      prediction: ['예측', '장애', '패턴', 'AI', '이상징후'],
      incident: ['알림', '경고', '심각', '긴급', '장애'],
    };

    const lowerQuestion = question.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerQuestion.includes(word))) {
        return category;
      }
    }
    return 'general';
  };

  // 스트리밍 요청 처리
  const handleStreamingRequest = async (question: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStreamPhase('thinking');
    setCurrentThinkingSteps([]);
    setCurrentStepIndex(-1);
    setCurrentResponse('');

    const category = determineCategory(question);
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 새 대화 아이템 생성
    const newConversation: ConversationItem = {
      id: conversationId,
      question,
      thinkingSteps: [],
      response: '',
      isComplete: false,
      timestamp: Date.now(),
      category,
    };

    setConversations(prev => [...prev, newConversation]);
    setCurrentIndex(conversations.length);
    scrollToBottom();

    try {
      const response = await fetch('/api/ai-agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question, category }),
      });

      if (!response.body) {
        throw new Error('스트리밍 응답을 받을 수 없습니다');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamEvent = JSON.parse(line.slice(6));
              await handleStreamEvent(data, conversationId);
            } catch (e) {
              console.error('스트리밍 데이터 파싱 에러:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('스트리밍 요청 에러:', error);
      setStreamPhase('idle');
      setIsProcessing(false);

      // 에러 메시지 표시
      setCurrentResponse(
        '❌ 죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.'
      );

      // 대화 아이템 업데이트
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, response: '❌ 오류가 발생했습니다.', isComplete: true }
            : conv
        )
      );
    }
  };

  // 스트리밍 이벤트 처리
  const handleStreamEvent = async (
    event: StreamEvent,
    conversationId: string
  ) => {
    switch (event.type) {
      case 'thinking':
        if (event.step && event.index !== undefined) {
          setCurrentThinkingSteps(prev => {
            const newSteps = [...prev];
            newSteps[event.index!] = event.step!;
            return newSteps;
          });
          setCurrentStepIndex(event.index);

          // 대화 아이템 업데이트
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    thinkingSteps: [...conv.thinkingSteps, event.step!],
                  }
                : conv
            )
          );
          scrollToBottom();
        }
        break;

      case 'response_start':
        setStreamPhase('responding');
        setCurrentResponse('');
        scrollToBottom();
        break;

      case 'response_chunk':
        if (event.chunk) {
          setCurrentResponse(prev => prev + event.chunk);

          // 대화 아이템 실시간 업데이트
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, response: conv.response + event.chunk! }
                : conv
            )
          );
          scrollToBottom();
        }
        break;

      case 'complete':
        setStreamPhase('idle');
        setIsProcessing(false);

        // 대화 완료 처리
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId ? { ...conv, isComplete: true } : conv
          )
        );
        scrollToBottom();
        break;

      case 'error':
        console.error('스트리밍 에러:', event.error);
        setStreamPhase('idle');
        setIsProcessing(false);
        setCurrentResponse(
          '❌ 오류가 발생했습니다: ' + (event.error || '알 수 없는 오류')
        );
        break;
    }
  };

  // 히스토리 네비게이션
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < conversations.length && !isProcessing) {
      setCurrentIndex(index);
    }
  };

  // 현재 대화 아이템
  const currentConversation =
    currentIndex >= 0 ? conversations[currentIndex] : null;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700 z-40 ${className}`}
    >
      <div className='flex flex-col h-full'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
              <span className='text-white text-sm font-bold'>AI</span>
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                AI Assistant
              </h2>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Vercel Optimized
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
          >
            <svg
              className='w-5 h-5 text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </motion.button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className='flex-1 overflow-hidden flex flex-col'>
          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
            {/* 컴팩트 질문 프리셋 */}
            <CompactQuestionTemplates
              onQuestionSelect={handleStreamingRequest}
              isProcessing={isProcessing}
            />

            {/* 질문 입력창 */}
            <QuestionInput
              onSubmit={handleStreamingRequest}
              isProcessing={isProcessing}
              placeholder='AI에게 서버 관리에 대해 질문해보세요...'
            />

            {/* 대화 히스토리 */}
            {conversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`space-y-3 ${index === currentIndex ? 'ring-2 ring-blue-200 dark:ring-blue-800 rounded-lg p-2' : ''}`}
              >
                {/* 질문 */}
                <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-white text-sm font-medium'>Q</span>
                    </div>
                    <div className='flex-1'>
                      <p className='text-blue-900 dark:text-blue-100 font-medium mb-1'>
                        질문
                      </p>
                      <p className='text-blue-700 dark:text-blue-300 text-sm'>
                        {conversation.question}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 생각하기 과정 */}
                {(conversation.thinkingSteps.length > 0 ||
                  (index === currentIndex && streamPhase === 'thinking')) && (
                  <div className='border-b dark:border-gray-700'>
                    <button
                      onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                      className='w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                    >
                      <div className='flex items-center space-x-2'>
                        <motion.div
                          animate={
                            index === currentIndex && streamPhase === 'thinking'
                              ? { rotate: [0, 360], scale: [1, 1.1, 1] }
                              : {}
                          }
                          transition={{
                            duration: 2,
                            repeat:
                              index === currentIndex &&
                              streamPhase === 'thinking'
                                ? Infinity
                                : 0,
                          }}
                          className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs'
                        >
                          🧠
                        </motion.div>
                        <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                          사고 과정{' '}
                          {index === currentIndex && streamPhase === 'thinking'
                            ? '(진행 중)'
                            : '(완료)'}
                        </span>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                          ({conversation.thinkingSteps.length}개 단계)
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isThinkingExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className='w-4 h-4 text-gray-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                          />
                        </svg>
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isThinkingExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className='overflow-hidden'
                        >
                          <div className='px-4 pb-3'>
                            <div className='bg-gray-900 dark:bg-black rounded-lg p-3'>
                              <div className='space-y-1.5 font-mono text-xs'>
                                {conversation.thinkingSteps.map(
                                  (step, stepIndex) => (
                                    <motion.div
                                      key={stepIndex}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: stepIndex * 0.1 }}
                                      className={`text-cyan-400 ${
                                        index === currentIndex &&
                                        stepIndex === currentStepIndex
                                          ? 'animate-pulse'
                                          : ''
                                      }`}
                                    >
                                      {step}
                                    </motion.div>
                                  )
                                )}

                                {index === currentIndex &&
                                  streamPhase === 'thinking' && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                      }}
                                      className='flex items-center gap-2 text-gray-400'
                                    >
                                      <div className='flex space-x-1'>
                                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                                      </div>
                                      <span className='text-xs'>
                                        AI가 생각하고 있습니다...
                                      </span>
                                    </motion.div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* AI 응답 */}
                {(conversation.response ||
                  (index === currentIndex && streamPhase === 'responding')) && (
                  <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg'>
                    <div className='flex items-start gap-3'>
                      <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
                        <span className='text-white text-sm font-medium'>
                          AI
                        </span>
                      </div>
                      <div className='flex-1'>
                        <p className='text-green-900 dark:text-green-100 font-medium mb-2'>
                          답변
                        </p>
                        <div className='text-green-700 dark:text-green-300 text-sm'>
                          <div className='whitespace-pre-wrap'>
                            {index === currentIndex
                              ? currentResponse
                              : conversation.response}
                          </div>
                          {index === currentIndex &&
                            streamPhase === 'responding' && (
                              <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className='ml-1'
                              >
                                ▋
                              </motion.span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 히스토리 네비게이션 */}
          {conversations.length > 1 && (
            <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <button
                  onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex <= 0 || isProcessing}
                  className='p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                >
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
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                </button>

                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {currentIndex + 1} / {conversations.length}
                </span>

                <button
                  onClick={() =>
                    handleNavigate(
                      Math.min(conversations.length - 1, currentIndex + 1)
                    )
                  }
                  disabled={
                    currentIndex >= conversations.length - 1 || isProcessing
                  }
                  className='p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                >
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
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 푸터 */}
          <div className='p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
            <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
              <span>Powered by OpenManager AI (Vercel)</span>
              <span>{conversations.length}개 대화</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
