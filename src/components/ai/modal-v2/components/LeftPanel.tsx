'use client';

import { useState, useRef, useEffect } from 'react';
import QuestionInput from './QuestionInput';
import AnswerDisplay from './AnswerDisplay';

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
          // 초기 상태 - 사용 가이드 표시
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-robot text-purple-600 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">AI 에이전트에게 물어보세요</h3>
            <p className="text-gray-600 mb-6">
              서버 상태, 성능 분석, 문제 해결 등 다양한 질문에 답변해 드립니다.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              <ExampleButton
                text="서버 상태 요약"
                onClick={() => sendQuestion("서버 상태를 요약해 주세요")}
              />
              <ExampleButton
                text="성능 분석"
                onClick={() => sendQuestion("시스템 성능을 분석해 주세요")}
              />
              <ExampleButton
                text="로그 분석"
                onClick={() => sendQuestion("최근 에러 로그를 분석해 주세요")}
              />
              <ExampleButton
                text="자동 장애 보고서"
                onClick={() => sendQuestion("자동 장애 보고서를 생성해 주세요")}
              />
            </div>
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

// 예시 질문 버튼
function ExampleButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-3 px-4 bg-white rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors shadow-sm"
    >
      {text}
    </button>
  );
} 