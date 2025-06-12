/**
 * 🤖 AI 사이드바 V5 - 프리셋 통합 및 동적 질문 카드
 *
 * ✨ 주요 개선사항:
 * - 프리셋 탭 제거, 채팅에 통합
 * - 질문창 위에 서버 상태 기반 동적 단축키 카드 배치
 * - 컴포넌트 분리로 유지보수성 개선
 * - 서버 상태에 따른 실시간 질문 생성
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Bell,
  Brain,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  Shield,
  Slack,
  Search,
  Database,
} from 'lucide-react';
import { useServerStatusQuestions } from './hooks/useServerStatusQuestions';
import QuickQuestionCards from './components/QuickQuestionCards';
import { IntegratedNotificationSettings } from '@/components/notifications/IntegratedNotificationSettings';
import { SlackNotificationPanel } from '@/components/notifications/SlackNotificationPanel';

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

interface FunctionMenuItem {
  id: string;
  icon: React.ComponentType<any>;
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

interface AISidebarV5Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function AISidebarV5({
  isOpen,
  onClose,
  className = '',
}: AISidebarV5Props) {
  const [activeTab, setActiveTab] = useState<string>('query');
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [thinkingCollapsed, setThinkingCollapsed] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<ThinkingStep[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  // 서버 상태 기반 동적 질문 사용
  const { questions, serverStatus, refreshQuestions, isLoading } =
    useServerStatusQuestions();

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsThinking(true);

    // 시뮬레이션된 AI 응답
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `${currentInput}에 대한 답변입니다. 현재 AI 어시스턴트가 모니터링 및 분석 기능으로 구현 예정입니다.`,
        timestamp: new Date(),
        pages: [
          `${currentInput}에 대한 답변입니다.`,
          '현재 AI 어시스턴트가 모니터링 및 분석 기능으로 구현 예정입니다.',
          '추가 정보나 상세한 분석이 필요하시면 말씀해 주세요.',
          '직접 서버 조작 기능은 향후 개발 계획에 포함되어 있습니다.',
        ],
      };

      setMessages(prev => [...prev, aiMessage]);
      setTotalPages(aiMessage.pages?.length || 1);
      setCurrentPage(0);
      setIsThinking(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuestionClick = (question: string) => {
    setCurrentInput(question);
    setActiveTab('query');
  };

  const renderFunctionContent = () => {
    if (activeTab === 'query') {
      return (
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* 빠른 질문 카드 - 질문창 위에 항상 표시 */}
          <QuickQuestionCards
            questions={questions}
            onQuestionClick={handleQuestionClick}
            onRefresh={refreshQuestions}
            isLoading={isLoading}
          />

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
                        onClick={() => setThinkingCollapsed(false)}
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
                              setCurrentPage(Math.max(0, currentPage - 1))
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
                                onClick={() => setCurrentPage(i)}
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
                              setCurrentPage(
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
                  <span className='text-sm'>
                    AI가 답변을 준비하고 있습니다...
                  </span>
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
                onChange={e => setCurrentInput(e.target.value)}
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
                onClick={handleSendMessage}
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

    if (activeTab === 'notification') {
      return (
        <div className='flex-1 overflow-y-auto'>
          <SlackNotificationPanel />
        </div>
      );
    }

    // 각 탭별 전용 콘텐츠
    const currentTab = FUNCTION_MENU.find(item => item.id === activeTab);
    const TabIcon = currentTab?.icon || Settings;

    const getTabContent = () => {
      switch (activeTab) {
        case 'notification':
          return 'slack-panel'; // 슬랙 알림 전용 패널 표시
        case 'report':
          return {
            title: '자동 장애 보고서',
            description:
              '시스템 장애를 자동으로 감지하고 상세한 보고서와 대응 가이드를 생성합니다.',
            features: [
              '실시간 장애 감지',
              'AI 분석 보고서',
              '단계별 대응 가이드',
              'RCA 분석',
            ],
          };
        case 'prediction':
          return {
            title: '이상감지 및 예측',
            description:
              'AI 모델을 통해 시스템 이상을 사전에 감지하고 미래 문제를 예측합니다.',
            features: [
              '예측 알고리즘',
              '패턴 분석',
              '임계값 모니터링',
              '트렌드 분석',
            ],
          };
        case 'logs':
          return {
            title: '로그 검색 및 분석',
            description:
              '시스템 로그를 빠르게 검색하고 패턴을 분석하여 문제를 신속하게 파악합니다.',
            features: [
              '전문 로그 검색',
              '패턴 매칭',
              '시간대별 필터링',
              '로그 상관관계 분석',
            ],
          };
        case 'admin':
          return {
            title: '관리자 페이지 및 AI 학습',
            description:
              'AI 에이전트의 학습 데이터를 관리하고 시스템 전체를 제어합니다.',
            features: [
              '학습 데이터 관리',
              '모델 성능 모니터링',
              '사용자 권한 관리',
              'AI 튜닝',
            ],
          };
        case 'ai-settings':
          return {
            title: 'AI 모델 및 API 설정',
            description:
              'AI 에이전트가 사용할 다양한 AI 모델과 API를 설정하고 관리합니다.',
            features: [
              'OpenAI API 설정',
              'Anthropic Claude 설정',
              '🧪 Google AI Studio (베타)',
              'MCP 프로토콜 설정',
              '모델 성능 비교',
              'API 사용량 모니터링',
            ],
          };
        default:
          return {
            title: currentTab?.label || '기능',
            description: '해당 기능이 구현 예정입니다.',
            features: [],
          };
      }
    };

    const content = getTabContent();

    // 슬랙 전용 패널 렌더링
    if (content === 'slack-panel') {
      return (
        <div className='flex-1 flex flex-col overflow-hidden p-4'>
          <SlackNotificationPanel />
        </div>
      );
    }

    // 기존 탭 콘텐츠 렌더링
    return (
      <div className='flex-1 flex items-center justify-center p-8'>
        <div className='text-center max-w-md'>
          <div
            className={`w-16 h-16 bg-gradient-to-br ${currentTab?.bgGradient || 'from-gray-100 to-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <TabIcon
              className={`w-8 h-8 ${currentTab?.color || 'text-gray-600'}`}
            />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {content.title}
          </h3>
          <p className='text-gray-600 text-sm mb-4 leading-relaxed'>
            {content.description}
          </p>

          {content.features && content.features.length > 0 && (
            <div className='bg-gray-50 rounded-lg p-4 mb-4'>
              <h4 className='text-sm font-medium text-gray-700 mb-2'>
                주요 기능
              </h4>
              <div className='space-y-1'>
                {content.features.map((feature, index) => (
                  <div
                    key={index}
                    className='flex items-center text-xs text-gray-600'
                  >
                    <div className='w-1 h-1 bg-gray-400 rounded-full mr-2'></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='text-xs text-gray-500'>
            🚧 모니터링 및 분석 기능으로 구현 예정
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className='fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex overflow-hidden'
    >
      {/* 메인 컨텐츠 영역 (왼쪽) */}
      <div className='flex-1 flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg'>
              <Sparkles className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                AI 어시스턴트
              </h2>
              <p className='text-sm text-gray-600'>
                {FUNCTION_MENU.find(item => item.id === activeTab)?.description}
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

        {/* 탭 컨텐츠 */}
        {renderFunctionContent()}
      </div>

      {/* 기능 메뉴 (오른쪽) */}
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
}
