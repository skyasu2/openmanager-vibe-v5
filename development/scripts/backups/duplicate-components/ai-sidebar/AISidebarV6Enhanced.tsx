/**
 * 🤖 AI 사이드바 V6 Enhanced - 고도화된 UX/UI
 *
 * ✨ 새로운 기능:
 * - 오른쪽 세로 기능 메뉴 (항상 표시)
 * - 채팅 중심 UI (기본 탭)
 * - 페이지네이션 답변 시스템
 * - 실시간 생각 과정 애니메이션
 * - 접이식 생각 과정 패널
 * - 프리셋 질문 카드 UI
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  Brain,
  MessageSquare,
  Lightbulb,
  Settings,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Search,
  BarChart3,
  Database,
  Cog,
  RefreshCw,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface AISidebarV6Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// 🎨 기능 메뉴 아이템
const FUNCTION_MENU = [
  { id: 'chat', icon: MessageSquare, label: '채팅', active: true },
  { id: 'presets', icon: Lightbulb, label: '프리셋' },
  { id: 'analysis', icon: BarChart3, label: '분석' },
  { id: 'search', icon: Search, label: '검색' },
  { id: 'database', icon: Database, label: '데이터' },
  { id: 'settings', icon: Cog, label: '설정' },
];

// 🎯 프리셋 질문 카드
const PRESET_CARDS = [
  {
    id: 1,
    keyword: '서버 상태',
    question: '현재 서버들의 전체 상태는 어떤가요?',
    icon: Activity,
  },
  {
    id: 2,
    keyword: '성능 분석',
    question: '성능에 문제가 있는 서버를 찾아주세요',
    icon: BarChart3,
  },
  {
    id: 3,
    keyword: '예측 분석',
    question: '향후 리소스 사용량을 예측해주세요',
    icon: TrendingUp,
  },
  {
    id: 4,
    keyword: '최적화',
    question: '시스템 최적화 방안을 제안해주세요',
    icon: Zap,
  },
];

// 💭 생각 과정 단계
interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  progress: number;
  completed: boolean;
}

// 📄 채팅 메시지 타입
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  pages?: string[];
}

export default function AISidebarV6Enhanced({
  isOpen,
  onClose,
  className = '',
}: AISidebarV6Props) {
  // 🎛️ UI 상태
  const [activeFunction, setActiveFunction] = useState('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  // 📄 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingCollapsed, setThinkingCollapsed] = useState(true);
  const [currentThinking, setCurrentThinking] = useState<ThinkingStep[]>([]);

  // 📜 스크롤 참조
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  // 🔄 메시지 추가 시 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]); // 메시지 개수가 변경될 때만 스크롤

  // 🔄 생각 과정 시뮬레이션
  const simulateThinking = useCallback(
    async (question: string) => {
      setIsThinking(true);
      setThinkingCollapsed(false); // 사고과정 시작 시 펼치기

      const steps: ThinkingStep[] = [
        {
          id: '1',
          title: '질문 분석',
          content: '사용자의 질문을 파싱하고 의도를 파악중...',
          progress: 0,
          completed: false,
        },
        {
          id: '2',
          title: '컨텍스트 수집',
          content: '관련 서버 데이터와 메트릭을 수집중...',
          progress: 0,
          completed: false,
        },
        {
          id: '3',
          title: '데이터 분석',
          content: '수집된 데이터를 분석하고 패턴을 찾는중...',
          progress: 0,
          completed: false,
        },
        {
          id: '4',
          title: '추론 과정',
          content: '논리적 추론을 통해 답변을 구성중...',
          progress: 0,
          completed: false,
        },
        {
          id: '5',
          title: '응답 생성',
          content: '최종 답변을 생성하고 검증중...',
          progress: 0,
          completed: false,
        },
      ];

      setCurrentThinking(steps);

      for (let i = 0; i < steps.length; i++) {
        // 단계별 진행
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setCurrentThinking(prev =>
            prev.map((step, index) =>
              index === i ? { ...step, progress } : step
            )
          );
        }

        // 단계 완료
        setCurrentThinking(prev =>
          prev.map((step, index) =>
            index === i ? { ...step, completed: true, progress: 100 } : step
          )
        );

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setIsThinking(false);

      // 답변 완료 후 잠시 기다린 다음 사고과정 접기
      setTimeout(() => {
        setThinkingCollapsed(true);
      }, 1000); // 1초 후 자동으로 접기

      // 답변 생성 (페이지별로)
      const responsePages = [
        '현재 서버 상태를 분석한 결과, 전체 10대의 서버 중 8대가 정상 운영중입니다.',
        'CPU 사용률은 평균 45%로 안정적이며, 메모리 사용률은 62%로 적정 수준을 유지하고 있습니다.',
        '네트워크 트래픽은 일일 패턴을 따라 정상 범위 내에서 변동하고 있으며, 현재 시점에서는 특별한 이상 징후가 발견되지 않았습니다.',
        '다만, WEB-03 서버의 디스크 사용률이 85%에 도달하여 주의가 필요한 상황입니다. 곧 정리 작업을 권장합니다.',
      ];

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: question,
        timestamp: new Date(),
        thinking: currentThinking,
        pages: responsePages,
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentPage(0);
    },
    [currentThinking]
  );

  // 💬 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    // AI 응답 시뮬레이션
    await simulateThinking(currentInput);
  }, [currentInput, simulateThinking]);

  // 🎯 프리셋 질문 클릭
  const handlePresetClick = useCallback(
    (question: string) => {
      setCurrentInput(question);
      setTimeout(() => handleSendMessage(), 100);
    },
    [handleSendMessage]
  );

  // 📄 현재 AI 메시지의 페이지 가져오기
  const getCurrentAIMessage = () => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.type === 'ai' ? lastMessage : null;
  };

  const currentAIMessage = getCurrentAIMessage();
  const totalPages = currentAIMessage?.pages?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex ${className}`}
          style={{ width: isMinimized ? '80px' : '500px' }}
        >
          {/* 🎨 오른쪽 세로 기능 메뉴 */}
          <div className='w-16 bg-gradient-to-b from-purple-600 to-pink-600 flex flex-col items-center py-4 space-y-3'>
            {/* 헤더 버튼들 */}
            <div className='space-y-2'>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className='p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all'
                title={isMinimized ? '확장' : '최소화'}
              >
                {isMinimized ? (
                  <Maximize2 className='w-4 h-4' />
                ) : (
                  <Minimize2 className='w-4 h-4' />
                )}
              </button>
              <button
                onClick={onClose}
                className='p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all'
                title='닫기'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* 구분선 */}
            <div className='w-8 h-px bg-white/20' />

            {/* 기능 메뉴 */}
            {FUNCTION_MENU.map(item => {
              const Icon = item.icon;
              const isActive = activeFunction === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFunction(item.id)}
                  className={`p-3 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <Icon className='w-5 h-5' />

                  {/* 툴팁 */}
                  {!isMinimized && (
                    <div className='absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 📱 메인 컨텐츠 영역 */}
          {!isMinimized && (
            <div className='flex-1 flex flex-col'>
              {/* 🎯 헤더 */}
              <div className='p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg'>
                    <Sparkles className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h2 className='font-bold text-gray-900'>AI 어시스턴트</h2>
                    <p className='text-sm text-gray-600'>스마트 서버 관리</p>
                  </div>
                </div>
              </div>

              {/* 💬 채팅 영역 */}
              {activeFunction === 'chat' && (
                <div className='flex-1 flex flex-col overflow-hidden'>
                  {/* 메시지 컨테이너 - 상단 스크롤 영역 */}
                  <div
                    ref={chatContainerRef}
                    className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0'
                  >
                    {/* 빈 채팅 상태 메시지 */}
                    {messages.length === 0 && (
                      <div className='flex flex-col items-center justify-center h-full text-center'>
                        <MessageSquare className='w-12 h-12 text-gray-300 mb-4' />
                        <p className='text-gray-500 mb-2'>
                          AI와 대화를 시작해보세요!
                        </p>
                        <p className='text-xs text-gray-400'>
                          아래 빠른 질문을 클릭하거나 직접 입력하세요
                        </p>
                      </div>
                    )}

                    {/* 메시지 목록 */}
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className='space-y-3'
                        >
                          {/* 사용자 메시지 */}
                          <div className='flex justify-end'>
                            <div className='bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%] shadow-sm'>
                              <p className='text-sm'>{message.content}</p>
                              <p className='text-xs text-blue-100 mt-1'>
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* AI 응답 */}
                          <div className='flex justify-start'>
                            <div className='bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] shadow-sm'>
                              {/* 사고과정 - 진행 중일 때는 펼치고, 완료되면 접기 */}
                              {message.thinking && (
                                <div className='space-y-2'>
                                  {/* 현재 진행 중인 사고과정 - 항상 펼쳐서 표시 */}
                                  {isThinking && (
                                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4'>
                                      <div className='flex items-center gap-2 mb-3'>
                                        <Brain className='w-4 h-4 text-blue-600 animate-pulse' />
                                        <span className='text-sm font-medium text-blue-800'>
                                          생각 중...
                                        </span>
                                      </div>
                                      <div className='space-y-3'>
                                        {message.thinking.map(
                                          (step, stepIndex) => (
                                            <div
                                              key={step.id}
                                              className='space-y-2'
                                            >
                                              <div className='flex items-center justify-between'>
                                                <span className='text-xs font-medium text-blue-700'>
                                                  {stepIndex + 1}. {step.title}
                                                </span>
                                                <span className='text-xs text-blue-600'>
                                                  {step.progress}%
                                                </span>
                                              </div>
                                              <div className='w-full bg-blue-100 rounded-full h-1.5'>
                                                <div
                                                  className='bg-blue-600 h-1.5 rounded-full transition-all duration-300'
                                                  style={{
                                                    width: `${step.progress}%`,
                                                  }}
                                                />
                                              </div>
                                              <p className='text-xs text-blue-600'>
                                                {step.content}
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* 완료된 사고과정 - 접힌 상태로 표시 */}
                                  {!isThinking && (
                                    <div className='mb-3'>
                                      <button
                                        onClick={() =>
                                          setThinkingCollapsed(
                                            !thinkingCollapsed
                                          )
                                        }
                                        className='flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors'
                                      >
                                        {thinkingCollapsed ? (
                                          <ChevronRight className='w-3 h-3' />
                                        ) : (
                                          <ChevronDown className='w-3 h-3' />
                                        )}
                                        <Brain className='w-3 h-3' />
                                        사고과정 ({message.thinking.length}단계)
                                      </button>

                                      <AnimatePresence>
                                        {!thinkingCollapsed && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                              height: 'auto',
                                              opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className='mt-2 space-y-2 bg-gray-50 rounded-lg p-3'
                                          >
                                            {message.thinking.map(
                                              (step, stepIndex) => (
                                                <div
                                                  key={step.id}
                                                  className='text-xs'
                                                >
                                                  <div className='font-medium text-gray-700'>
                                                    {stepIndex + 1}.{' '}
                                                    {step.title}
                                                  </div>
                                                  <div className='text-gray-600 mt-1'>
                                                    {step.content}
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* AI 응답 내용 */}
                              <div className='text-sm leading-relaxed'>
                                {message.pages && message.pages[currentPage]}
                              </div>

                              <p className='text-xs text-gray-500 mt-2'>
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* 로딩 상태 */}
                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='flex justify-start'
                      >
                        <div className='bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce' />
                            <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100' />
                            <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200' />
                            <span className='text-sm text-gray-600 ml-2'>
                              AI가 답변을 생성하고 있습니다...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* 하단 고정 영역 - 프리셋 질문과 입력창 */}
                  <div className='border-t border-gray-200 bg-white'>
                    {/* 프리셋 질문 영역 - 하단 고정 */}
                    {messages.length === 0 && (
                      <div className='p-4 border-b border-gray-100'>
                        <h3 className='text-sm font-medium text-gray-700 mb-3 flex items-center gap-2'>
                          <Lightbulb className='w-4 h-4 text-yellow-500' />
                          빠른 질문
                        </h3>
                        <div className='grid grid-cols-2 gap-2'>
                          {PRESET_CARDS.map(card => (
                            <button
                              key={card.id}
                              onClick={() => handlePresetClick(card.question)}
                              disabled={isThinking}
                              className='p-3 text-left bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 disabled:opacity-50 rounded-lg border border-gray-200 transition-colors group'
                            >
                              <div className='flex items-start gap-2'>
                                <card.icon className='w-4 h-4 text-blue-600 mt-0.5 group-hover:text-blue-700' />
                                <div>
                                  <div className='text-xs font-medium text-gray-800 mb-1'>
                                    {card.keyword}
                                  </div>
                                  <div className='text-xs text-gray-600 leading-relaxed'>
                                    {card.question}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 입력 영역 - 하단 고정 */}
                    <div className='p-4'>
                      <div className='flex gap-2'>
                        <input
                          type='text'
                          value={currentInput}
                          onChange={e => setCurrentInput(e.target.value)}
                          onKeyPress={e =>
                            e.key === 'Enter' && handleSendMessage()
                          }
                          placeholder='AI에게 질문하세요...'
                          disabled={isThinking}
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-50 text-sm'
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={isThinking || !currentInput.trim()}
                          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2'
                        >
                          {isThinking ? (
                            <RefreshCw className='w-4 h-4 animate-spin' />
                          ) : (
                            <Send className='w-4 h-4' />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔧 다른 기능 탭들 */}
              {activeFunction !== 'chat' && (
                <div className='flex-1 flex items-center justify-center p-8'>
                  <div className='text-center'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Cog className='w-8 h-8 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {
                        FUNCTION_MENU.find(item => item.id === activeFunction)
                          ?.label
                      }{' '}
                      기능
                    </h3>
                    <p className='text-gray-600'>곧 구현될 예정입니다.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
