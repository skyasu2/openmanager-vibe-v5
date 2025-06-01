/**
 * 🤖 AI 사이드바 V5 - 완전히 최적화된 통합 AI 인터페이스
 * 
 * ✅ 기존 고급 컴포넌트들 재통합 완료
 * ✅ EnhancedPresetQuestions 활용
 * ✅ AgentThinkingPanel 복원
 * ✅ FinalResponse 표시 기능 복원
 * ✅ 모든 AI 기능 통합 운영
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Minimize2, 
  Maximize2,
  Brain,
  MessageSquare,
  Lightbulb,
  Settings,
  Send,
  Loader2,
  AlertTriangle,
  Wand2,
  Cog
} from 'lucide-react';
import { useAISidebarStore, useAISidebarUI, useAIThinking, useAIChat, PRESET_QUESTIONS } from '@/stores/useAISidebarStore';
import type { PresetQuestion, AgentLog } from '@/stores/useAISidebarStore';
import AgentThinkingPanel from './AgentThinkingPanel';
import FinalResponse from './FinalResponse';
import EnhancedPresetQuestions from './EnhancedPresetQuestions';
import AIFunctionPanel from '../AIFunctionPanel';
import QAPanel from '../QAPanel';
import ThinkingView from '../ThinkingView';

interface AISidebarV5Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// 🎨 탭 정보
const TAB_INFO = {
  chat: {
    icon: MessageSquare,
    label: '채팅',
    description: '직접 질문하기'
  },
  presets: {
    icon: Lightbulb,
    label: '프리셋',
    description: '미리 준비된 질문'
  },
  thinking: {
    icon: Brain,
    label: '사고과정',
    description: 'AI의 분석 과정'
  },
  functions: {
    icon: Wand2,
    label: '기능',
    description: 'AI 고급 기능'
  },
  settings: {
    icon: Settings,
    label: '설정',
    description: 'AI 설정 관리'
  }
};

export default function AISidebarV5({ 
  isOpen, 
  onClose,
  className = ''
}: AISidebarV5Props) {
  const { isOpen: isSidebarOpen, activeTab, setOpen, setActiveTab } = useAISidebarUI();
  const { 
    isThinking, 
    currentQuestion, 
    logs, 
    setThinking, 
    setCurrentQuestion, 
    addLog, 
    clearLogs 
  } = useAIThinking();
  const { responses, addResponse, clearResponses } = useAIChat();

  // UI 상태 관리
  const [isMinimized, setMinimized] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [currentResponse, setCurrentResponse] = useState<any>(null);

  // 임시 하드코딩 제거 예정
  const sidebarWidth = isMinimized ? 60 : 400;

  // 모바일 감지 및 반응형 처리
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      
      // 모바일에서는 최소화 상태를 자동으로 해제
      if (isMobileDevice && isMinimized) {
        setMinimized(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMinimized]);

  // AI 분석 시뮬레이션 (완전 통합)
  const simulateAIAnalysis = useCallback(async (question: string) => {
    setThinking(true);
    setCurrentQuestion(question);
    setActiveTab('thinking');
    clearLogs();
    
    // 단계별 로그 시뮬레이션
    const steps = [
      { step: '질문 분석', duration: 800 },
      { step: '컨텍스트 수집', duration: 1200 },
      { step: '패턴 매칭', duration: 1000 },
      { step: '논리적 추론', duration: 1500 },
      { step: '응답 생성', duration: 600 }
    ];

    for (const [index, stepInfo] of steps.entries()) {
      await new Promise(resolve => setTimeout(resolve, stepInfo.duration));
      addLog({
        step: stepInfo.step,
        content: `${stepInfo.step}을 수행하고 있습니다...`,
        type: 'analysis',
        duration: stepInfo.duration,
        progress: (index + 1) / steps.length
      });
    }
    
    // Mock 응답 생성
    const mockResponse = {
      content: `"${question}"에 대한 분석이 완료되었습니다. 시스템 상태를 종합적으로 검토한 결과, 전반적으로 안정적인 상태입니다.`,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: steps.reduce((sum, step) => sum + step.duration, 0) / 1000,
        sources: ['시스템 메트릭', '로그 분석', 'AI 패턴 매칭']
      }
    };
    
    setCurrentResponse(mockResponse);
    addResponse({
      content: mockResponse.content,
      confidence: mockResponse.confidence
    });
    
    // 완료 후 응답 탭으로 전환
    setTimeout(() => {
      setThinking(false);
      setActiveTab('chat');
    }, 500);
  }, [setThinking, setCurrentQuestion, setActiveTab, clearLogs, addLog, addResponse]);

  // 질문 처리 (통합)
  const processQuestion = useCallback(async (question: string) => {
    if (isThinking) return;
    await simulateAIAnalysis(question);
  }, [isThinking, simulateAIAnalysis]);

  // 프리셋 질문 선택 핸들러
  const handlePresetSelect = useCallback((preset: PresetQuestion) => {
    processQuestion(preset.question);
  }, [processQuestion]);

  // 커스텀 질문 전송
  const handleCustomQuestion = useCallback(() => {
    if (!customQuestion.trim() || isThinking) return;
    
    processQuestion(customQuestion);
    setCustomQuestion('');
  }, [customQuestion, isThinking, processQuestion]);

  // 키보드 이벤트
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuestion();
    }
  }, [handleCustomQuestion]);

  // 피드백 핸들러
  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    console.log(`사용자 피드백: ${type}`);
    // TODO: 실제 피드백 처리 로직 구현
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isMinimized ? 60 : 400
      }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className={`fixed top-0 right-0 h-screen bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col ${className}`}
      style={{ width: isMinimized ? 60 : 400 }}
    >
      {/* 헤더 - 개선된 상태 표시 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        {!isMinimized && (
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isThinking ? 360 : 0 }}
              transition={{ duration: 2, repeat: isThinking ? Infinity : 0, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="font-semibold text-gray-900">AI 어시스턴트</h2>
              <p className="text-xs text-gray-500">
                {isThinking ? `분석 중: ${currentQuestion?.substring(0, 20)}...` : '질문을 입력하세요'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isMinimized ? "확장" : "최소화"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* 탭 네비게이션 - 개선된 디자인 */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {Object.entries(TAB_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const isActive = activeTab === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 p-3 text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={info.description}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    {info.label}
                  </button>
                );
              })}
            </div>

            {/* 탭 콘텐츠 - 완전 통합 */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <QAPanel />
                  </div>
                  
                  {/* 최신 응답 표시 */}
                  {currentResponse && !isThinking && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <FinalResponse 
                        response={currentResponse}
                        onFeedback={handleFeedback}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'presets' && (
                <div className="h-full overflow-y-auto p-4">
                  <EnhancedPresetQuestions
                    onQuestionSelect={handlePresetSelect}
                    className="h-full"
                  />
                </div>
              )}
              
              {activeTab === 'thinking' && (
                <div className="h-full p-4">
                  {/* 고급 사고과정 패널 사용 */}
                  <AgentThinkingPanel 
                    className="mb-4"
                    showDetails={true}
                  />
                  
                  {/* 상세 로그 표시 */}
                  <ThinkingView
                    isThinking={isThinking}
                    logs={logs}
                    currentQuestion={currentQuestion}
                    className="h-full"
                  />
                  
                  {!isThinking && logs.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">AI가 질문에 응답할 때</p>
                      <p className="text-xs text-gray-600 mt-1">추론 과정이 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'functions' && (
                <div className="h-full">
                  <AIFunctionPanel />
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="p-4 space-y-4">
                  <h3 className="text-gray-900 font-medium mb-4">AI 설정</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">AI 모드</label>
                      <select className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none">
                        <option>기본 모드</option>
                        <option>고급 분석</option>
                        <option>실시간 모니터링</option>
                        <option>전문가 모드</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">응답 상세도</label>
                      <select className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none">
                        <option>간단</option>
                        <option>보통</option>
                        <option>상세</option>
                        <option>매우 상세</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm mb-2">자동 새로고침</label>
                      <select className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:outline-none">
                        <option>비활성화</option>
                        <option>30초</option>
                        <option>1분</option>
                        <option>5분</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 text-sm">실시간 알림</span>
                      <button className="w-12 h-6 bg-blue-500 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 text-sm">사고과정 표시</span>
                      <button className="w-12 h-6 bg-blue-500 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button 
                        onClick={clearResponses}
                        className="w-full p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
                      >
                        모든 대화 기록 삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 