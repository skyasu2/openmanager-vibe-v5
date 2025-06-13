/**
 * 🎨 AI Sidebar Presentation Component
 *
 * 새로운 아키텍처를 적용한 AI 사이드바 메인 컴포넌트
 * - 도메인 레이어와 분리된 순수한 프레젠테이션 로직
 * - useAIController 훅을 통한 비즈니스 로직 연결
 * - 컴포넌트 분리 및 재사용성 향상
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAIController } from '../hooks/useAIController';
import { FunctionMenuItem } from '@/domains/ai-engine/types';

// 기능 메뉴 정의 (UI 상수)
const FUNCTION_MENU: FunctionMenuItem[] = [
  {
    id: 'query',
    icon: require('lucide-react').MessageCircle,
    label: '자연어 질의',
    description: 'AI와 자연어로 시스템 질의',
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    id: 'report',
    icon: require('lucide-react').FileText,
    label: '장애 보고서',
    description: '자동 리포트 및 대응 가이드',
    color: 'text-orange-600',
    bgGradient: 'from-orange-50 to-red-50',
  },
  {
    id: 'prediction',
    icon: require('lucide-react').TrendingUp,
    label: '이상감지/예측',
    description: '시스템 이상 탐지 및 예측',
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-pink-50',
  },
  {
    id: 'anomaly',
    icon: require('lucide-react').AlertTriangle,
    label: '실시간 이상징후',
    description: '실시간 이상 징후 모니터링',
    color: 'text-red-600',
    bgGradient: 'from-red-50 to-orange-50',
  },
  {
    id: 'logs',
    icon: require('lucide-react').Search,
    label: '로그 검색',
    description: '시스템 로그 검색 및 분석',
    color: 'text-yellow-600',
    bgGradient: 'from-yellow-50 to-amber-50',
  },
  {
    id: 'notification',
    icon: require('lucide-react').Bell,
    label: '브라우저 알림',
    description: '브라우저 알림 설정 및 관리',
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  {
    id: 'settings',
    icon: require('lucide-react').Settings,
    label: 'AI 설정',
    description: 'AI 엔진 설정 및 관리',
    color: 'text-gray-600',
    bgGradient: 'from-gray-50 to-slate-50',
  },
];

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  // AI 컨트롤러 훅 사용
  const {
    conversations,
    currentIndex,
    isProcessing,
    currentThinkingSteps,
    currentResponse,
    streamPhase,
    handleQuery,
    loadTabData,
    navigateToConversation,
  } = useAIController();

  // UI 상태
  const [activeTab, setActiveTab] = useState('query');
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [tabData, setTabData] = useState<any>(null);

  /**
   * 탭 변경 처리
   */
  const handleTabChange = async (tabId: string) => {
    if (tabId === activeTab) return;

    setActiveTab(tabId);
    setIsLoadingTab(true);

    try {
      const data = await loadTabData(tabId);
      setTabData(data);
    } catch (error) {
      console.error('탭 데이터 로드 오류:', error);
    } finally {
      setIsLoadingTab(false);
    }
  };

  /**
   * 질의 처리
   */
  const handleQuestionSubmit = async (question: string) => {
    if (!question.trim() || isProcessing) return;
    await handleQuery(question);
  };

  /**
   * 네비게이션 처리
   */
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      navigateToConversation(currentIndex - 1);
    } else if (
      direction === 'next' &&
      currentIndex < conversations.length - 1
    ) {
      navigateToConversation(currentIndex + 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col ${className}`}
        >
          {/* 헤더 */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-white text-sm font-bold'>AI</span>
              </div>
              <h2 className='text-lg font-semibold text-gray-800'>
                OpenManager AI
              </h2>
            </div>

            {/* 네비게이션 버튼 */}
            {conversations.length > 0 && (
              <div className='flex items-center space-x-1'>
                <button
                  onClick={() => handleNavigate('prev')}
                  disabled={currentIndex <= 0}
                  className='p-1 rounded hover:bg-gray-100 disabled:opacity-50'
                  title='이전 대화'
                >
                  <ChevronLeft className='w-4 h-4' />
                </button>
                <span className='text-xs text-gray-500 px-2'>
                  {currentIndex + 1} / {conversations.length}
                </span>
                <button
                  onClick={() => handleNavigate('next')}
                  disabled={currentIndex >= conversations.length - 1}
                  className='p-1 rounded hover:bg-gray-100 disabled:opacity-50'
                  title='다음 대화'
                >
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title='사이드바 닫기'
            >
              <X className='w-5 h-5 text-gray-500' />
            </button>
          </div>

          {/* 기능 탭 메뉴 */}
          <div className='p-4 border-b border-gray-200'>
            <div className='grid grid-cols-2 gap-2'>
              {FUNCTION_MENU.map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`p-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === item.id
                        ? `bg-gradient-to-r ${item.bgGradient} border-2 border-blue-200`
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className='flex items-center space-x-2'>
                      <IconComponent
                        className={`w-4 h-4 ${
                          activeTab === item.id ? item.color : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          activeTab === item.id ? item.color : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className='flex-1 overflow-hidden'>
            {activeTab === 'query' ? (
              <QueryTab
                conversations={conversations}
                currentIndex={currentIndex}
                isProcessing={isProcessing}
                currentThinkingSteps={currentThinkingSteps}
                currentResponse={currentResponse}
                streamPhase={streamPhase}
                onQuestionSubmit={handleQuestionSubmit}
              />
            ) : (
              <TabContent
                tabId={activeTab}
                data={tabData}
                isLoading={isLoadingTab}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 질의 탭 컴포넌트
 */
interface QueryTabProps {
  conversations: any[];
  currentIndex: number;
  isProcessing: boolean;
  currentThinkingSteps: any[];
  currentResponse: string;
  streamPhase: string;
  onQuestionSubmit: (question: string) => void;
}

const QueryTab: React.FC<QueryTabProps> = ({
  conversations,
  currentIndex,
  isProcessing,
  currentThinkingSteps,
  currentResponse,
  streamPhase,
  onQuestionSubmit,
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuestionSubmit(question);
    setQuestion('');
  };

  return (
    <div className='h-full flex flex-col'>
      {/* 대화 영역 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {conversations.map((conversation, index) => (
          <div
            key={conversation.id}
            className={`${
              index === currentIndex ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {/* 사용자 질문 */}
            <div className='mb-2'>
              <div className='bg-blue-50 p-3 rounded-lg'>
                <p className='text-sm text-blue-800'>{conversation.question}</p>
              </div>
            </div>

            {/* AI 응답 */}
            <div className='bg-gray-50 p-3 rounded-lg'>
              <p className='text-sm text-gray-800'>{conversation.response}</p>
            </div>
          </div>
        ))}

        {/* 현재 처리 중인 질의 */}
        {isProcessing && (
          <div className='space-y-2'>
            {/* 사고 과정 */}
            {streamPhase === 'thinking' && currentThinkingSteps.length > 0 && (
              <div className='bg-yellow-50 p-3 rounded-lg'>
                <h4 className='text-sm font-medium text-yellow-800 mb-2'>
                  🤔 생각하는 중...
                </h4>
                {currentThinkingSteps.map((step, index) => (
                  <div key={step.id} className='text-xs text-yellow-700'>
                    {step.title}
                  </div>
                ))}
              </div>
            )}

            {/* 응답 생성 */}
            {streamPhase === 'responding' && currentResponse && (
              <div className='bg-gray-50 p-3 rounded-lg'>
                <p className='text-sm text-gray-800'>{currentResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 질문 입력 영역 */}
      <div className='p-4 border-t border-gray-200'>
        <form onSubmit={handleSubmit} className='space-y-2'>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder='AI에게 질문하세요...'
            className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            rows={3}
            disabled={isProcessing}
          />
          <button
            type='submit'
            disabled={!question.trim() || isProcessing}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isProcessing ? '처리 중...' : '질문하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * 탭 콘텐츠 컴포넌트
 */
interface TabContentProps {
  tabId: string;
  data: any;
  isLoading: boolean;
}

const TabContent: React.FC<TabContentProps> = ({ tabId, data, isLoading }) => {
  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
          <p className='text-sm text-gray-500'>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full p-4'>
      <h3 className='text-lg font-semibold mb-4'>
        {FUNCTION_MENU.find(item => item.id === tabId)?.label}
      </h3>

      {data ? (
        <pre className='text-xs bg-gray-100 p-3 rounded overflow-auto'>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className='text-gray-500'>데이터가 없습니다.</p>
      )}
    </div>
  );
};
