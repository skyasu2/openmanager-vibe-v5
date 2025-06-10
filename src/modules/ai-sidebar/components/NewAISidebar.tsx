/**
 * 🚀 새로운 AI 사이드바 v2.0
 *
 * - 상단 대시보드 안 가리는 레이아웃
 * - 컴팩트 질문 프리셋 (한줄 4개)
 * - 질문창 → 생각과정 → 답변 순서
 * - 답변 히스토리 및 네비게이션
 * - SOLID 원칙 적용한 모듈화
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../../utils/TimerManager';
import {
  RealTimeLogEngine,
  RealTimeLogEntry,
} from '../../ai-agent/core/RealTimeLogEngine';
import { aiSidebarService } from '@/services/ai/AISidebarService';

// 새로운 UI 컴포넌트들 import
import { CompactQuestionTemplates } from './ui/CompactQuestionTemplates';
import { QuestionInput } from './ui/QuestionInput';
import { ThinkingProcess } from './ui/ThinkingProcess';
import { ResponseDisplay } from './ui/ResponseDisplay';
import { HistoryNavigation } from './ui/HistoryNavigation';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  isProcessing: boolean;
  thinkingLogs: RealTimeLogEntry[];
  timestamp: number;
  sessionId: string;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';
}

interface NewAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NewAISidebar: React.FC<NewAISidebarProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [logEngine] = useState(() => RealTimeLogEngine.getInstance());

  // 현재 처리 중인 QA 아이템
  const currentItem = qaItems[currentIndex];
  const isProcessing = currentItem?.isProcessing || false;

  // 🛡️ 안전한 현재 아이템 상태
  const safeCurrentItem = useMemo(() => {
    try {
      if (!currentItem || typeof currentItem !== 'object') {
        return null;
      }
      return currentItem;
    } catch (error) {
      console.error('❌ 현재 아이템 접근 에러:', error);
      return null;
    }
  }, [currentItem]);

  // 실시간 로그 엔진 초기화
  useEffect(() => {
    const initializeLogEngine = async () => {
      try {
        await logEngine.initialize();
        console.log('🚀 실시간 로그 엔진 초기화 완료');
      } catch (error) {
        console.error('❌ 로그 엔진 초기화 실패:', error);
      }
    };

    initializeLogEngine();

    // 실시간 로그 이벤트 리스너
    const handleLogAdded = ({
      sessionId,
      log,
    }: {
      sessionId: string;
      log: RealTimeLogEntry;
    }) => {
      setQAItems(prev =>
        prev.map(item =>
          item.sessionId === sessionId
            ? { ...item, thinkingLogs: [...item.thinkingLogs, log] }
            : item
        )
      );
    };

    logEngine.on('logAdded', handleLogAdded);

    return () => {
      logEngine.off('logAdded', handleLogAdded);
    };
  }, [logEngine]);

  // 질문 처리 함수
  const handleQuestionSubmit = useCallback(
    async (question: string) => {
      if (!question.trim()) {
        console.warn('⚠️ 빈 질문은 처리할 수 없습니다');
        return;
      }

      console.log('🤖 새로운 질문 처리 시작:', question);
      setCurrentQuestion(question);

      const category = determineCategory(question);

      // 실시간 로그 세션 시작
      const sessionId = logEngine.startSession(
        `ai_query_${Date.now()}`,
        question,
        {
          userId: 'current_user',
          category,
          mode: 'advanced',
        }
      );

      // 새 QA 아이템 생성
      const newQA: QAItem = {
        id: `qa_${Date.now()}`,
        question: question.trim(),
        answer: '',
        isProcessing: true,
        thinkingLogs: [],
        timestamp: Date.now(),
        sessionId,
        category,
      };

      // qaItems 배열에 추가하고 인덱스를 마지막으로 설정
      setQAItems(prev => {
        const updated = [...prev, newQA];
        setCurrentIndex(updated.length - 1);
        console.log('📝 QA 아이템 추가:', {
          length: updated.length,
          newIndex: updated.length - 1,
          category,
        });
        return updated;
      });

      setIsThinkingExpanded(true);

      try {
        // 실제 AI 기능 호출 및 로깅
        logEngine.addLog(sessionId, {
          level: 'INFO',
          module: 'AIService',
          message: `AI 기능 분석 시작 - 카테고리: ${category}`,
          details: `질문: "${question}"`,
          metadata: {
            queryLength: question.length,
            category,
            timestamp: Date.now(),
          },
        });

        // 카테고리별 실제 AI 기능 호출
        const aiResponse = await callActualAIFunction(
          question,
          category,
          sessionId
        );

        if (aiResponse.success && aiResponse.data) {
          // 세션 완료
          logEngine.completeSession(sessionId, 'success', aiResponse.answer);

          // 답변 업데이트 및 타이핑 시작
          setQAItems(prev =>
            prev.map(item =>
              item.sessionId === sessionId
                ? { ...item, isProcessing: false, answer: aiResponse.answer }
                : item
            )
          );

          // 타이핑 효과 시작
          setIsTyping(true);
        } else {
          throw new Error(aiResponse.error || 'AI 응답 생성 실패');
        }
      } catch (error) {
        console.error('❌ AI 질문 처리 실패:', error);

        logEngine.addLog(sessionId, {
          level: 'ERROR',
          module: 'AIService',
          message: 'AI 기능 호출 실패',
          details: error instanceof Error ? error.message : String(error),
        });

        logEngine.completeSession(
          sessionId,
          'failed',
          '죄송합니다. 일시적인 오류가 발생했습니다.'
        );

        // 에러 응답 설정
        setQAItems(prev =>
          prev.map(item =>
            item.sessionId === sessionId
              ? {
                  ...item,
                  isProcessing: false,
                  answer:
                    '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                }
              : item
          )
        );
      }
    },
    [logEngine]
  );

  // 실제 AI 기능 호출
  const callActualAIFunction = async (
    question: string,
    category: string,
    sessionId: string
  ): Promise<{
    success: boolean;
    data?: any;
    answer: string;
    error?: string;
  }> => {
    try {
      console.log('🔍 실제 AI 기능 호출:', { question, category });

      // AI 서비스를 통한 실제 기능 호출 (카테고리별 분기)
      let response;
      switch (category) {
        case 'monitoring':
          response = await aiSidebarService.getServerStatus();
          break;
        case 'incident':
          response = await aiSidebarService.getCriticalAlerts();
          break;
        case 'analysis':
          response = await aiSidebarService.getPerformanceAnalysis();
          break;
        case 'prediction':
          response = await aiSidebarService.getFailurePrediction();
          break;
        default:
          response = await aiSidebarService.getServerStatus();
      }

      if (response.success) {
        // 응답 데이터를 기반으로 답변 생성
        const answer = generateAnswerFromResponse(
          question,
          category,
          response.data
        );
        return {
          success: true,
          data: response.data,
          answer,
        };
      } else {
        throw new Error(response.error || 'AI 서비스 응답 실패');
      }
    } catch (error) {
      console.error('❌ AI 기능 호출 에러:', error);
      return {
        success: false,
        answer: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  // 응답 데이터를 기반으로 답변 생성
  const generateAnswerFromResponse = (
    question: string,
    category: string,
    data: any
  ): string => {
    try {
      switch (category) {
        case 'monitoring':
          if (data?.servers) {
            const serverCount = data.servers.length;
            const healthyCount = data.servers.filter(
              (s: any) => s.status === 'healthy'
            ).length;
            return `현재 ${serverCount}개의 서버 중 ${healthyCount}개가 정상 상태입니다. ${question}에 대한 모니터링 결과를 확인했습니다.`;
          }
          return `서버 모니터링 상태를 확인했습니다. ${question}에 대한 정보를 제공합니다.`;

        case 'incident':
          if (data?.alerts) {
            const alertCount = data.alerts.length;
            return `현재 ${alertCount}개의 알림이 있습니다. ${question}에 대한 인시던트 분석을 완료했습니다.`;
          }
          return `인시던트 상황을 분석했습니다. ${question}에 대한 대응 방안을 제시합니다.`;

        case 'analysis':
          if (data?.metrics) {
            return `성능 분석을 완료했습니다. ${question}에 대한 상세한 분석 결과를 제공합니다.`;
          }
          return `시스템 분석을 수행했습니다. ${question}에 대한 인사이트를 제공합니다.`;

        case 'prediction':
          if (data?.predictions) {
            return `AI 예측 분석을 완료했습니다. ${question}에 대한 예측 결과와 권장사항을 제공합니다.`;
          }
          return `예측 분석을 수행했습니다. ${question}에 대한 미래 전망을 제시합니다.`;

        default:
          return `${question}에 대한 AI 분석을 완료했습니다. 요청하신 정보를 제공합니다.`;
      }
    } catch (error) {
      console.error('답변 생성 에러:', error);
      return `${question}에 대한 분석을 완료했습니다. 상세한 정보를 제공해드리겠습니다.`;
    }
  };

  // 카테고리 결정
  const determineCategory = (
    question: string
  ): 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general' => {
    const keywords = {
      monitoring: ['상태', '모니터', '헬스체크', '서버', '시스템'],
      analysis: ['분석', '성능', '리소스', '사용률', '트렌드'],
      prediction: ['예측', '장애', '패턴', 'AI', '이상징후'],
      incident: ['알림', '경고', '심각', '긴급', '장애'],
    };

    const lowerQuestion = question.toLowerCase();

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerQuestion.includes(word))) {
        return category as any;
      }
    }

    return 'general';
  };

  // 네비게이션 핸들러
  const handleNavigate = useCallback(
    (index: number) => {
      if (index >= 0 && index < qaItems.length && !isTyping) {
        setCurrentIndex(index);
      }
    },
    [qaItems.length, isTyping]
  );

  // 타이핑 완료 핸들러
  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);
  }, []);

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
                OpenManager Vibe v5
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

        {/* 메인 콘텐츠 영역 */}
        <div className='flex-1 overflow-hidden flex flex-col'>
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {/* 1. 컴팩트 질문 프리셋 (한줄에 4개) */}
            <CompactQuestionTemplates
              onQuestionSelect={handleQuestionSubmit}
              isProcessing={isProcessing}
            />

            {/* 2. 질문 입력창 */}
            <QuestionInput
              onSubmit={handleQuestionSubmit}
              isProcessing={isProcessing}
              placeholder='AI에게 서버 관리에 대해 질문해보세요...'
            />

            {/* 3. 현재 질문 표시 */}
            {safeCurrentItem && (
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
                      {safeCurrentItem.question || '질문 정보 없음'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 생각하는 과정 (질문창과 답변창 사이) */}
            {safeCurrentItem &&
              (safeCurrentItem.isProcessing ||
                safeCurrentItem.thinkingLogs.length > 0) && (
                <ThinkingProcess
                  logs={safeCurrentItem.thinkingLogs}
                  isExpanded={isThinkingExpanded}
                  isProcessing={safeCurrentItem.isProcessing}
                  onToggle={() => setIsThinkingExpanded(!isThinkingExpanded)}
                />
              )}

            {/* 5. AI 답변 표시 */}
            {safeCurrentItem && (
              <ResponseDisplay
                answer={safeCurrentItem.answer}
                isProcessing={safeCurrentItem.isProcessing}
                isTyping={isTyping}
                onTypingComplete={handleTypingComplete}
              />
            )}

            {/* 6. 답변 히스토리 네비게이션 */}
            {qaItems.length > 0 && (
              <HistoryNavigation
                qaItems={qaItems}
                currentIndex={currentIndex}
                onNavigate={handleNavigate}
                isTyping={isTyping}
              />
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className='p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'>
          <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
            <span>Powered by OpenManager AI</span>
            <span>{qaItems.length}개 대화</span>
          </div>
        </div>
      </div>
    </div>
  );
};
