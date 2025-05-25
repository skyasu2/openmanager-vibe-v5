'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ThinkingStep {
  id: string;
  step: number;
  type: 'analysis' | 'classification' | 'processing' | 'generation' | 'validation';
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  duration?: number;
  progress?: number;
}

interface ThinkingSession {
  sessionId: string;
  queryId: string;
  query: string;
  mode: 'basic' | 'enterprise';
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: ThinkingStep[];
  status: 'thinking' | 'completed' | 'error';
}

interface ThinkingDisplayProps {
  session: ThinkingSession | null;
  isVisible: boolean;
  onClose?: () => void;
  enableCopyProtection?: boolean;
}

export default function ThinkingDisplay({ 
  session, 
  isVisible, 
  onClose,
  enableCopyProtection = true 
}: ThinkingDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && session) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, session]);

  // 복사 방지 기능
  useEffect(() => {
    if (!enableCopyProtection || !isVisible) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+A, Ctrl+S, F12 등 차단
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
      container.addEventListener('selectstart', handleSelectStart);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('keydown', handleKeyDown);

      // CSS로 추가 보호
      container.style.userSelect = 'none';
      container.style.webkitUserSelect = 'none';
      container.style.msUserSelect = 'none';
      container.style.mozUserSelect = 'none';

      return () => {
        container.removeEventListener('contextmenu', handleContextMenu);
        container.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableCopyProtection, isVisible]);

  const getStepIcon = (step: ThinkingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'bg-blue-100 text-blue-800';
      case 'classification':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'generation':
        return 'bg-green-100 text-green-800';
      case 'validation':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isVisible || !session) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={containerRef}
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          // 추가 복사 방지 스타일
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-semibold">AI 사고 과정</h3>
                <p className="text-blue-100 text-sm">
                  {session.mode === 'enterprise' ? '심층 분석' : 'Mini 분석'} 모드
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 질문 표시 */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600 mb-1">질문</p>
          <p className="font-medium text-gray-900">{session.query}</p>
        </div>

        {/* 사고 과정 단계들 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {session.steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* 연결선 */}
                {index < session.steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-3">
                  {/* 아이콘 */}
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step)}
                  </div>
                  
                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepTypeColor(step.type)}`}>
                        {step.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        단계 {step.step}
                      </span>
                      {step.duration && (
                        <span className="text-xs text-gray-400">
                          {formatDuration(step.duration)}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {step.description}
                    </p>
                    
                    {/* 진행률 바 */}
                    {step.status === 'processing' && step.progress !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="bg-gray-50 px-4 py-3 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>상태: {
                session.status === 'thinking' ? '분석 중' :
                session.status === 'completed' ? '완료' : '오류'
              }</span>
              {session.totalDuration && (
                <span>총 소요시간: {formatDuration(session.totalDuration)}</span>
              )}
            </div>
            
            {enableCopyProtection && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>복사 보호됨</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 