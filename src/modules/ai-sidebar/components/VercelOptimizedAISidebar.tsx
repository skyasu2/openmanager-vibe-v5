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
import {
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Search,
  Slack,
  Brain,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { CompactQuestionTemplates } from './ui/CompactQuestionTemplates';
import { QuestionInput } from './ui/QuestionInput';

// 🎨 기능 메뉴 아이템 정의 (AISidebarV5에서 복원)
interface FunctionMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
}

const FUNCTION_MENU: FunctionMenuItem[] = [
  {
    id: 'query',
    icon: MessageCircle,
    label: '자연어 질의',
    description: 'AI와 자연어로 시스템 질의',
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    id: 'report',
    icon: FileText,
    label: '장애 보고서',
    description: '자동 리포트 및 대응 가이드',
    color: 'text-orange-600',
    bgGradient: 'from-orange-50 to-red-50',
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    label: '이상감지/예측',
    description: '시스템 이상 탐지 및 예측',
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-pink-50',
  },
  {
    id: 'logs',
    icon: Search,
    label: '로그 검색',
    description: '시스템 로그 검색 및 분석',
    color: 'text-yellow-600',
    bgGradient: 'from-yellow-50 to-amber-50',
  },
  {
    id: 'notification',
    icon: Slack,
    label: '슬랙 알림',
    description: '자동 알림 및 슬랙 연동',
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  {
    id: 'admin',
    icon: Brain,
    label: '관리자/학습',
    description: '관리자 페이지 및 AI 학습',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-50 to-blue-50',
  },
  {
    id: 'ai-settings',
    icon: Database,
    label: 'AI 설정',
    description: 'AI 모델 및 API 설정 관리',
    color: 'text-rose-600',
    bgGradient: 'from-rose-50 to-pink-50',
  },
];

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

  // 🎛️ 기능 탭 상태 (복원된 기능)
  const [activeTab, setActiveTab] = useState('query');

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
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex overflow-hidden w-[480px] ${className}`}
    >
      {/* 메인 컨텐츠 영역 (왼쪽) */}
      <div className='flex-1 flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg'>
              <span className='text-white text-sm font-bold'>AI</span>
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                AI 어시스턴트
              </h2>
              <p className='text-sm text-gray-600'>
                {FUNCTION_MENU.find(item => item.id === activeTab)
                  ?.description || 'AI와 자연어로 시스템 질의'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
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
          <div className='p-3 border-t border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between text-xs text-gray-500'>
              <span>Powered by OpenManager AI</span>
              <span>{conversations.length}개 대화</span>
            </div>
          </div>
        </div>
      </div>

      {/* 기능 메뉴 (오른쪽) - AISidebarV5에서 복원 */}
      <div className='w-16 bg-gradient-to-b from-purple-500 to-pink-500 flex flex-col items-center py-2 gap-0.5'>
        {FUNCTION_MENU.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative group p-2.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-lg transform scale-110'
                  : 'hover:bg-white/20 hover:scale-105'
              }`}
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? item.color : 'text-white'
                }`}
              />

              {/* 툴팁 (왼쪽에 표시) */}
              <div className='absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
