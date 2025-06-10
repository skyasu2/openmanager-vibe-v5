/**
 * 🚀 새로운 AI 사이드바 v2.0 - 간소화 버전
 *
 * - 상단 대시보드 안 가리는 레이아웃
 * - 컴팩트 질문 프리셋 (한줄 4개)
 * - 질문창 → 생각과정 → 답변 순서
 * - 답변 히스토리 및 네비게이션
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 새로운 UI 컴포넌트들 import
import { CompactQuestionTemplates } from './ui/CompactQuestionTemplates';
import { QuestionInput } from './ui/QuestionInput';
import { ResponseDisplay } from './ui/ResponseDisplay';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  isProcessing: boolean;
  timestamp: number;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general';
}

interface NewAISidebarSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NewAISidebarSimple: React.FC<NewAISidebarSimpleProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // 현재 처리 중인 QA 아이템
  const currentItem = qaItems[currentIndex];
  const isProcessing = currentItem?.isProcessing || false;

  // 질문 처리 함수
  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!question.trim()) {
      console.warn('⚠️ 빈 질문은 처리할 수 없습니다');
      return;
    }

    console.log('🤖 새로운 질문 처리 시작:', question);

    const category = determineCategory(question);

    // 새 QA 아이템 생성
    const newQA: QAItem = {
      id: `qa_${Date.now()}`,
      question: question.trim(),
      answer: '',
      isProcessing: true,
      timestamp: Date.now(),
      category,
    };

    // qaItems 배열에 추가하고 인덱스를 마지막으로 설정
    setQAItems(prev => {
      const updated = [...prev, newQA];
      setCurrentIndex(updated.length - 1);
      return updated;
    });

    try {
      // 시뮬레이션된 AI 응답 생성
      const answer = await generateSimulatedAnswer(question, category);

      // 답변 업데이트
      setQAItems(prev =>
        prev.map(item =>
          item.id === newQA.id ? { ...item, isProcessing: false, answer } : item
        )
      );

      // 타이핑 효과 시작
      setIsTyping(true);
    } catch (error) {
      console.error('❌ AI 질문 처리 실패:', error);

      // 에러 응답 설정
      setQAItems(prev =>
        prev.map(item =>
          item.id === newQA.id
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
  }, []);

  // 시뮬레이션된 AI 응답 생성
  const generateSimulatedAnswer = async (
    question: string,
    category: string
  ): Promise<string> => {
    // 2초 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));

    const answers = {
      monitoring: `현재 서버 상태를 분석한 결과:

📊 **전체 서버 현황**
- 총 서버: 12대
- 정상 운영: 10대 (83%)
- 주의 필요: 2대 (17%)
- 심각 상태: 0대

🔍 **주요 발견사항**
- web-server-01: CPU 사용률 75% (주의)
- db-server-02: 메모리 사용률 82% (주의)
- 전체적으로 안정적인 상태입니다.

💡 **권장사항**
- web-server-01의 CPU 사용률 모니터링 강화
- db-server-02의 메모리 최적화 검토`,

      incident: `현재 심각한 알림을 확인한 결과:

🚨 **긴급 알림 (0건)**
현재 긴급 대응이 필요한 알림은 없습니다.

⚠️ **주의 알림 (2건)**
1. web-server-01: 응답시간 지연 (3.2초)
2. db-server-02: 메모리 사용률 높음 (82%)

📈 **트렌드 분석**
- 지난 24시간 동안 전체적으로 안정적
- 피크 시간대(오후 2-4시) 성능 저하 패턴 관찰

🔧 **권장 조치**
- 응답시간 지연 원인 분석
- 메모리 사용량 최적화 검토`,

      analysis: `서버 성능 분석 결과:

📊 **리소스 사용률**
- 평균 CPU: 45%
- 평균 메모리: 62%
- 평균 디스크: 38%
- 평균 응답시간: 1.8초

🔍 **성능 분석**
- 전체적으로 양호한 성능 수준
- 메모리 사용률이 다소 높은 편
- 응답시간은 목표치(2초) 이내

⚡ **최적화 기회**
- 메모리 캐시 최적화로 10-15% 성능 향상 가능
- 데이터베이스 쿼리 최적화 권장
- CDN 활용으로 응답시간 단축 가능`,

      prediction: `AI 기반 장애 예측 분석:

🔮 **예측 결과**
- 향후 7일간 장애 확률: 낮음 (15%)
- 가장 위험한 서버: db-server-02 (35% 위험도)
- 예상 장애 시점: 없음

📈 **패턴 분석**
- 메모리 사용률 증가 추세 감지
- 주말 트래픽 패턴 변화 관찰
- 정기 백업 시간대 성능 저하

🛡️ **예방 조치**
- db-server-02 메모리 모니터링 강화
- 백업 스케줄 최적화 검토
- 용량 계획 수립 권장`,

      general: `질문에 대한 AI 분석 결과:

🤖 **AI 분석**
귀하의 질문을 분석하여 가장 적절한 정보를 제공해드립니다.

📋 **현재 시스템 상태**
- 전체적으로 안정적인 운영 중
- 주요 서비스 정상 동작
- 성능 지표 양호

💡 **추가 도움**
더 구체적인 질문이나 특정 영역에 대한 분석이 필요하시면 언제든 말씀해주세요.`,
    };

    return answers[category] || answers.general;
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
            {currentItem && (
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
                      {currentItem.question}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 생각하는 과정 (시뮬레이션) */}
            {currentItem && currentItem.isProcessing && (
              <div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg'>
                <div className='flex items-center space-x-2 mb-3'>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs'
                  >
                    🧠
                  </motion.div>
                  <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                    AI가 생각하고 있습니다...
                  </span>
                </div>
                <div className='space-y-2 text-sm text-purple-600 dark:text-purple-400'>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    • 질문 분석 중...
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    • 관련 데이터 수집 중...
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    • 답변 생성 중...
                  </motion.div>
                </div>
              </div>
            )}

            {/* 5. AI 답변 표시 */}
            {currentItem && currentItem.answer && (
              <ResponseDisplay
                answer={currentItem.answer}
                isProcessing={currentItem.isProcessing}
                isTyping={isTyping}
                onTypingComplete={handleTypingComplete}
              />
            )}

            {/* 6. 간단한 히스토리 네비게이션 */}
            {qaItems.length > 1 && (
              <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {currentIndex + 1} / {qaItems.length}
                </span>
                <div className='flex space-x-2'>
                  <motion.button
                    onClick={() => handleNavigate(currentIndex - 1)}
                    disabled={currentIndex === 0 || isTyping}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded ${
                      currentIndex === 0 || isTyping
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    ←
                  </motion.button>
                  <motion.button
                    onClick={() => handleNavigate(currentIndex + 1)}
                    disabled={currentIndex === qaItems.length - 1 || isTyping}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded ${
                      currentIndex === qaItems.length - 1 || isTyping
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    →
                  </motion.button>
                </div>
              </div>
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
