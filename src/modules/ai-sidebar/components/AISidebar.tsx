/**
 * AISidebar Component
 * 
 * 🎨 메인 AI 사이드바 컴포넌트
 * - 실시간 서버 상황 표시
 * - 15초마다 바뀌는 동적 질문 템플릿  
 * - 통합 AI 응답 (질문→사고과정→답변)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { AISidebarConfig } from '../types';
import { ChatInterface } from './ChatInterface';
import { StatusIndicator } from './StatusIndicator';
import { RealtimeServerStatus } from './RealtimeServerStatus';
import { DynamicQuestionTemplates } from './DynamicQuestionTemplates';
import { IntegratedAIResponse } from './IntegratedAIResponse';
import { usePowerStore } from '../../../stores/powerStore';

interface AISidebarProps {
  config: AISidebarConfig;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  config,
  isOpen,
  onClose,
  className = ''
}) => {
  const { mode, getSystemStatus } = usePowerStore();
  const systemStatus = getSystemStatus();
  const isSystemActive = mode === 'active' || mode === 'monitoring';
  
  // 통합 상태 관리 (동시성 안전)
  const [questionState, setQuestionState] = useState<{
    question: string;
    isProcessing: boolean;
  }>({
    question: '',
    isProcessing: false
  });

  const sidebarClasses = `
    fixed top-0 ${config.position === 'right' ? 'right-0' : 'left-0'} 
    h-full bg-white dark:bg-gray-900 
    border-l dark:border-gray-700 shadow-xl
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : config.position === 'right' ? 'translate-x-full' : '-translate-x-full'}
    z-50 flex flex-col
    ${className}
  `.trim();

  // 질문 처리 완료 (원자적 상태 업데이트)
  const handleQuestionComplete = useCallback(() => {
    setQuestionState(prev => ({
      ...prev,
      isProcessing: false
    }));
    console.log('✅ AISidebar: 질문 처리 완료');
  }, []);

  // 새 질문 선택 (원자적 상태 업데이트)
  const handleQuestionSelect = useCallback((question: string) => {
    setQuestionState(prev => {
      if (prev.isProcessing) {
        console.warn('⚠️ 이미 처리 중인 질문이 있습니다');
        return prev;
      }
      
      console.log('🎯 AISidebar: 새 질문 시작', question);
      return {
        question,
        isProcessing: true
      };
    });
  }, []);

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <div
        className={sidebarClasses}
        style={{ width: `${config.width}px` }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSystemActive ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <span className="text-white text-sm font-bold">
                {isSystemActive ? 'AI' : '💤'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {config.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isSystemActive ? '활성화됨' : '절전 모드'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="사이드바 닫기"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 📊 실시간 서버 상황 */}
        <RealtimeServerStatus isProcessing={questionState.isProcessing} />

        {/* 🎯 동적 질문 템플릿 */}
        <DynamicQuestionTemplates 
          onQuestionSelect={handleQuestionSelect}
          isProcessing={questionState.isProcessing}
          className="mx-4 my-2"
        />

        {/* 📝 질문 입력 영역 */}
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="AI에게 질문하세요..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim() && !questionState.isProcessing) {
                  handleQuestionSelect(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
              disabled={questionState.isProcessing}
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500"
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input?.value.trim() && !questionState.isProcessing) {
                  handleQuestionSelect(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={questionState.isProcessing}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* 🤖 통합 AI 응답 영역 (고정) */}
        <div className="flex-1 overflow-hidden">
          {questionState.question ? (
            <IntegratedAIResponse
              question={questionState.question}
              isProcessing={questionState.isProcessing}
              onComplete={handleQuestionComplete}
              className="h-full"
            />
          ) : (
            <div className="p-8 text-center h-full flex flex-col justify-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                AI 에이전트가 대기 중입니다
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                위의 추천 질문을 클릭하거나 직접 질문을 입력해보세요
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>💡 실시간 서버 상태 분석</p>
                <p>🔮 AI 기반 장애 예측</p>
                <p>📊 성능 지표 모니터링</p>
                <p>🚨 알림 및 인시던트 분석</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 상태 바 */}
        <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                questionState.isProcessing ? 'bg-yellow-400 animate-pulse' : 
                isSystemActive ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <span>
                {questionState.isProcessing ? '처리 중' :
                 isSystemActive ? '준비됨' : '절전 모드'}
              </span>
            </div>
            <div>
              {questionState.question && (
                <span>AI 대화 활성</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 