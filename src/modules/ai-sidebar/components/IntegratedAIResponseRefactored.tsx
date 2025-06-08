/**
 * 🤖 통합 AI 응답 컴포넌트 v5.0 - 리팩토링된 버전
 *
 * Design Patterns Applied:
 * - Component Composition: UI 요소를 작은 컴포넌트로 분해
 * - Custom Hooks Pattern: 상태 로직을 별도 훅으로 분리
 * - Service Layer Pattern: AI 기능을 서비스 레이어로 분리
 * - Single Responsibility Principle: 각 컴포넌트가 하나의 역할만 담당
 * - Separation of Concerns: UI, 로직, 데이터가 명확히 분리
 */

'use client';

import React from 'react';
import { useAIResponse } from './hooks/useAIResponse';
import { IntegratedAIResponseProps } from './types/AIResponseTypes';
import { NavigationControls } from './ui/NavigationControls';
import { QuestionDisplay } from './ui/QuestionDisplay';
import { AnswerDisplay } from './ui/AnswerDisplay';
import { LogViewer } from './ui/LogViewer';

export const IntegratedAIResponseRefactored: React.FC<IntegratedAIResponseProps> = ({
  question,
  isProcessing,
  onComplete,
  className = '',
}) => {
  // 커스텀 훅을 통한 상태 관리와 로직 처리
  const {
    qaItems,
    currentItem,
    navigation,
    typing,
    isThinkingExpanded,
    setIsThinkingExpanded,
    goToPrev,
    goToNext,
    handleVerifyLog,
  } = useAIResponse(question, isProcessing, onComplete);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm ${className}`}
    >
      {/* 헤더 - 네비게이션 */}
      <div className='flex items-center justify-between p-3 border-b dark:border-gray-700'>
        <div className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold'>
            Q
          </div>
          <div>
            <span className='text-sm font-medium text-gray-900 dark:text-white'>
              {qaItems.length > 0
                ? `질문 ${Math.min(navigation.currentIndex + 1, qaItems.length)} / ${qaItems.length}`
                : '질문 대기 중...'}
            </span>
          </div>
        </div>

        {/* 네비게이션 컨트롤 */}
        <NavigationControls
          navigation={navigation}
          isTyping={typing.isTyping}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      </div>

      {/* 메인 콘텐츠 */}
      {currentItem && (
        <>
          {/* 질문 영역 */}
          <QuestionDisplay question={currentItem.question} />

          {/* 생각과정 (로그 뷰어) */}
          {(currentItem.isProcessing || currentItem.thinkingLogs.length > 0) && (
            <LogViewer
              logs={currentItem.thinkingLogs}
              isExpanded={isThinkingExpanded}
              onToggle={() => setIsThinkingExpanded(!isThinkingExpanded)}
              onVerifyLog={handleVerifyLog}
            />
          )}

          {/* 답변 영역 */}
          <AnswerDisplay
            answer={currentItem.answer}
            isProcessing={currentItem.isProcessing}
            typingText={typing.text}
          />
        </>
      )}

      {/* 질문이 없을 때의 대기 상태 */}
      {!currentItem && (
        <div className='p-8 text-center'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-blue-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            AI 어시스턴트 준비 완료
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            질문을 입력하면 AI가 분석하고 답변해드립니다.
          </p>
        </div>
      )}
    </div>
  );
};

// 기존 컴포넌트와의 호환성을 위한 기본 export
export default IntegratedAIResponseRefactored; 