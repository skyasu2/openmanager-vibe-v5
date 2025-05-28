'use client';

import { useState, useRef, useEffect } from 'react';
import QuestionInput from './QuestionInput';
import AnswerDisplay from './AnswerDisplay';
import PresetQuestions from './PresetQuestions';

interface LeftPanelProps {
  isLoading: boolean;
  currentQuestion: string;
  currentAnswer: string;
  responseMetadata?: any;
  setQuestion: (question: string) => void;
  sendQuestion: (question: string) => void;
  isMobile: boolean;
  onBackToPresets?: () => void;
}

export default function LeftPanel({
  isLoading,
  currentQuestion,
  currentAnswer,
  responseMetadata,
  setQuestion,
  sendQuestion,
  isMobile,
  onBackToPresets
}: LeftPanelProps) {
  const answerRef = useRef<HTMLDivElement>(null);

  // 새 답변이 올 때마다 스크롤 초기화
  useEffect(() => {
    if (answerRef.current && currentAnswer) {
      answerRef.current.scrollTop = 0;
    }
  }, [currentAnswer]);

  return (
    <div className={`
      flex flex-col
      ${isMobile ? 'w-full' : 'w-full'}
      h-full
    `}>
      {/* 질문 입력창 (상단 고정) */}
      <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
        <QuestionInput
          isLoading={isLoading}
          onSendQuestion={sendQuestion}
        />
      </div>

      {/* 답변 표시 영역 (스크롤 가능) - 여백 줄이고 효율적 공간 활용 */}
      <div 
        ref={answerRef}
        className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-gray-50 to-gray-100 custom-scrollbar"
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        {!currentQuestion && !currentAnswer ? (
          // 초기 상태 - 프리셋 질문 표시 (여백 줄임)
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                <i className="fas fa-robot text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">🤖 AI Assistant</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto leading-relaxed">
                서버 관리와 분석에 도움을 드립니다. 
                추천 질문을 선택하거나 직접 질문해보세요.
              </p>
            </div>
            
            {/* 프리셋 질문 컴포넌트 */}
            <PresetQuestions 
              onQuestionSelect={sendQuestion}
              currentServerData={{
                criticalServers: 0,
                warningServers: 2,
                totalServers: 12
              }}
            />
          </div>
        ) : (
          // 답변 표시 영역
          <AnswerDisplay
            question={currentQuestion}
            answer={currentAnswer}
            isLoading={isLoading}
            metadata={responseMetadata}
            onBackToPresets={onBackToPresets}
          />
        )}
      </div>
    </div>
  );
} 