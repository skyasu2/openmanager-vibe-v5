/**
 * 🎨 AI Sidebar V2 - 도메인 분리 아키텍처 + 아이콘 패널 통합
 *
 * ✅ 오른쪽 AI 기능 아이콘 패널 추가
 * ✅ 기능별 페이지 전환 시스템
 * ✅ 실시간 AI 로그 연동
 * ✅ 도메인 주도 설계(DDD) 적용
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Brain,
  Send,
  Server,
  Search,
  BarChart3,
  Target,
} from 'lucide-react';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { useAIThinking } from '@/modules/ai-sidebar/hooks/useAIThinking';
import { useAIChat } from '@/modules/ai-sidebar/hooks/useAIChat';
import { useRealTimeAILogs } from '@/hooks/useRealTimeAILogs';
import { RealAISidebarService } from '../services/RealAISidebarService';
import BasicTyping from '@/components/ui/BasicTyping';

// AI 기능 아이콘 패널 및 페이지 컴포넌트들
import AIAgentIconPanel, {
  AIAgentFunction,
} from '@/components/ai/AIAgentIconPanel';
import AIChatPage from '@/components/ai/pages/AIChatPage';
import AutoReportPage from '@/components/ai/pages/AutoReportPage';
import PredictionPage from '@/components/ai/pages/PredictionPage';
import InfrastructureOverviewPage from '@/components/ai/pages/InfrastructureOverviewPage';
import SystemAlertsPage from '@/components/ai/pages/SystemAlertsPage';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import { GoogleAIStatusCard } from '@/components/shared/GoogleAIStatusCard';

interface AISidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebarV2: React.FC<AISidebarV2Props> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  // 실제 AI 서비스 인스턴스
  const aiService = new RealAISidebarService();

  // UI 상태
  const [inputValue, setInputValue] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [selectedFunction, setSelectedFunction] =
    useState<AIAgentFunction>('chat');

  // 도메인 훅들 사용
  const { setOpen } = useAISidebarStore();
  const {
    isThinking,
    currentQuestion,
    logs,
    setThinking,
    setCurrentQuestion,
    addLog,
    clearLogs,
  } = useAIThinking();
  const { responses, addResponse, clearResponses } = useAIChat({
    apiEndpoint: '/api/ai/smart-fallback',
    sessionId: currentSessionId,
  });

  // 스크롤 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 실시간 AI 로그 훅
  const {
    logs: realTimeLogs,
    isConnected: isLogConnected,
    isProcessing: isRealTimeProcessing,
    currentEngine,
    techStack,
    connectionStatus,
  } = useRealTimeAILogs({
    sessionId: currentSessionId,
    mode: 'sidebar',
    maxLogs: 30,
  });

  // 빠른 질문 가져오기 (실제 서비스에서)
  const quickQuestions = aiService.getQuickQuestions();

  // 아이콘 매핑
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Server,
      Search,
      BarChart3,
      Target,
    };
    return icons[iconName] || Server;
  };

  // 빠른 질문 클릭 핸들러
  const handleQuickQuestionClick = async (question: string) => {
    const sessionId = `session-${Date.now()}`;
    setCurrentSessionId(sessionId);
    setCurrentQuestion(question);

    // AI 사고 과정 시작
    setThinking(true);
    clearLogs();

    try {
      // 실제 AI 서비스 호출
      const response = await aiService.processQuery(question, sessionId);

      // AI 응답 추가
      addResponse({
        success: true,
        response: response.response || '응답을 받지 못했습니다.',
        confidence: response.confidence || 0.5,
        metadata: {
          engineVersion: response.source || 'AI 시스템',
        },
      });
    } catch (error) {
      console.error('AI 질의 처리 실패:', error);
      addResponse({
        success: false,
        response:
          '죄송합니다. 현재 AI 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        confidence: 0,
        metadata: {
          engineVersion: 'Error Handler',
        },
      });
    } finally {
      setThinking(false);
    }
  };

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    await handleQuickQuestionClick(inputValue);
    setInputValue('');
  };

  // 기능별 페이지 렌더링
  const renderFunctionPage = () => {
    switch (selectedFunction) {
      case 'chat':
        return <AIChatPage />;
      case 'auto-report':
        return <AutoReportPage />;
      case 'prediction':
        return <PredictionPage />;
      case 'infrastructure-overview':
        return <InfrastructureOverviewPage />;
      case 'system-alerts':
        return <SystemAlertsPage />;
      case 'advanced-management':
        return (
          <div className='flex flex-col h-full p-4 bg-gray-50'>
            <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Brain className='w-6 h-6 text-purple-600' />
              AI 고급 관리
            </h2>
            <div className='grid grid-cols-1 gap-4 flex-1'>
              {/* AI 인사이트 섹션 */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3'>
                  AI 인사이트
                </h3>
                <AIInsightsCard
                  className='shadow-none border-0 p-0'
                  showRecommendations={true}
                />
              </div>

              {/* Google AI 상태 섹션 */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3'>
                  Google AI 연결 상태
                </h3>
                <GoogleAIStatusCard
                  className='shadow-none border-0 p-0'
                  showDetails={true}
                  variant='admin'
                />
              </div>
            </div>
          </div>
        );
      case 'pattern-analysis':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50'>
            <div className='text-center'>
              <BarChart3 className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                패턴 분석
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'log-analysis':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-yellow-50'>
            <div className='text-center'>
              <Search className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                로그 분석
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'thinking':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-pink-50 to-rose-50'>
            <div className='text-center'>
              <Brain className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                AI 사고과정
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'optimization':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-yellow-50 to-amber-50'>
            <div className='text-center'>
              <Target className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                성능 최적화
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      default:
        return <AIChatPage />;
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
          className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-30 flex ${className}`}
        >
          {/* 메인 콘텐츠 영역 */}
          <div className='flex-1 flex flex-col'>
            {/* 헤더 */}
            <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
                  <Brain className='w-5 h-5 text-white' />
                </div>
                <div>
                  <BasicTyping
                    text='AI 어시스턴트'
                    speed='fast'
                    className='text-lg font-bold text-gray-800'
                    showCursor={false}
                  />
                  <p className='text-sm text-gray-600'>
                    AI와 자연어로 시스템 질의
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                title='사이드바 닫기'
                aria-label='사이드바 닫기'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            {/* 기능별 페이지 콘텐츠 */}
            <div className='flex-1 overflow-hidden'>{renderFunctionPage()}</div>
          </div>

          {/* 오른쪽 AI 기능 아이콘 패널 */}
          <AIAgentIconPanel
            selectedFunction={selectedFunction}
            onFunctionChange={setSelectedFunction}
            className='w-20'
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
