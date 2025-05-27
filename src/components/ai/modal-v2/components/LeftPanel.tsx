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
}

export default function LeftPanel({
  isLoading,
  currentQuestion,
  currentAnswer,
  responseMetadata,
  setQuestion,
  sendQuestion,
  isMobile
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
      ${isMobile ? 'w-full' : 'w-3/5 border-r border-gray-200'}
      h-full
    `}>
      {/* 질문 입력창 (상단 고정) */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <QuestionInput
          isLoading={isLoading}
          onSendQuestion={sendQuestion}
        />
      </div>

      {/* 답변 표시 영역 (스크롤 가능) */}
      <div 
        ref={answerRef}
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
      >
        {!currentQuestion && !currentAnswer ? (
          // 초기 상태 - 프리셋 질문 표시
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-robot text-purple-600 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">AI 에이전트에게 물어보세요</h3>
              <p className="text-gray-600 mb-6">
                서버 상태, 성능 분석, 문제 해결 등 다양한 질문에 답변해 드립니다.
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
          />
        )}
      </div>
    </div>
  );
} 