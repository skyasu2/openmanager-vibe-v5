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
  AlertTriangle
} from 'lucide-react';
import { useAISidebarStore, useAISidebarUI, useAIThinking, useAIChat } from '@/stores/useAISidebarStore';
import type { PresetQuestion, AgentLog } from '@/stores/useAISidebarStore';
import AgentThinkingPanel from './AgentThinkingPanel';
import FinalResponse from './FinalResponse';
import EnhancedPresetQuestions from './EnhancedPresetQuestions';

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
  const { 
    isMinimized, 
    activeTab, 
    setMinimized, 
    setActiveTab, 
    setMobile 
  } = useAISidebarUI();
  
  const {
    isThinking,
    startThinking,
    setActiveStep,
    addThinkingLog,
    setProgress,
    finishThinking
  } = useAIThinking();
  
  const {
    currentQuestion,
    aiResponse,
    responses,
    setCurrentQuestion,
    setAIResponse,
    clearChat
  } = useAIChat();

  const [customQuestion, setCustomQuestion] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // 모바일 감지 및 설정
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setMobile(isMobileDevice);
      
      // 모바일에서는 최소화 상태를 자동으로 해제
      if (isMobileDevice && isMinimized) {
        setMinimized(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setMobile, isMinimized, setMinimized]);

  // AI 분석 시뮬레이션
  const simulateAIAnalysis = useCallback(async (question: string) => {
    const steps = [
      { step: 'context', log: '서버 메트릭 데이터를 수집하고 있습니다...', duration: 250 },
      { step: 'context', log: '현재 시스템 상태를 분석하고 있습니다...', duration: 300 },
      { step: 'match', log: '기존 패턴과 매칭하여 최적의 솔루션을 찾고 있습니다...', duration: 450 },
      { step: 'match', log: '유사한 케이스들을 검토하고 있습니다...', duration: 200 },
      { step: 'generate', log: '분석 결과를 바탕으로 답변을 생성하고 있습니다...', duration: 500 },
      { step: 'validation', log: '생성된 답변의 정확성을 검증하고 있습니다...', duration: 200 }
    ];

    let progress = 0;
    const stepProgress = 100 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      const { step, log, duration } = steps[i];
      
      setActiveStep(step as any);
      addThinkingLog(log);
      
      // 진행률 업데이트
      progress += stepProgress;
      setProgress(Math.min(progress, 95));
      
      await new Promise(resolve => setTimeout(resolve, duration));
    }

    // 최종 응답 생성
    const mockResponse = generateMockResponse(question);
    const logs: AgentLog[] = steps.map((step, index) => ({
      step: step.log.split('...')[0],
      detail: step.log,
      time: `${step.duration}ms`,
      type: step.step as any,
      status: 'completed',
      duration: step.duration
    }));

    setProgress(100);
    finishThinking(mockResponse, logs);
  }, [setActiveStep, addThinkingLog, setProgress, finishThinking]);

  // 질문 처리
  const processQuestion = useCallback(async (question: string) => {
    if (isThinking) return;
    
    startThinking(question);
    setActiveTab('thinking');
    
    try {
      await simulateAIAnalysis(question);
    } catch (error) {
      console.error('AI 분석 오류:', error);
      // TODO: 에러 처리
    }
  }, [isThinking, startThinking, setActiveTab, simulateAIAnalysis]);

  // 프리셋 질문 선택
  const handlePresetSelect = useCallback((preset: PresetQuestion) => {
    processQuestion(preset.query);
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

  // Mock 응답 생성 (실제로는 API 호출)
  const generateMockResponse = (question: string): string => {
    const responses = [
      `질문해주신 "${question}"에 대한 분석 결과입니다.\n\n현재 시스템 상태를 종합적으로 분석한 결과, 다음과 같은 내용을 확인했습니다:\n\n• 전체적인 시스템 성능은 안정적입니다\n• 일부 서버에서 CPU 사용률이 높게 나타나고 있습니다\n• 메모리 사용량은 정상 범위 내에 있습니다\n\n권장사항:\n1. 고부하 서버의 부하 분산을 고려해보세요\n2. 정기적인 성능 모니터링을 유지하세요\n3. 필요시 스케일 아웃을 검토하세요`,
      `분석이 완료되었습니다.\n\n요청하신 정보에 대해 다음과 같이 답변드립니다:\n\n현재 상황 요약:\n- 시스템은 정상적으로 작동 중입니다\n- 몇 가지 최적화 포인트가 발견되었습니다\n- 전반적인 보안 상태는 양호합니다\n\n상세 분석 결과와 개선 방안을 함께 제시해드렸습니다.`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

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
      {/* 헤더 */}
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
                {isThinking ? '분석 중...' : '질문을 입력하세요'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {Object.entries(TAB_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const isActive = activeTab === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 p-3 text-xs font-medium transition-colors ${
                      isActive 
                        ? 'text-blue-600 bg-white border-b-2 border-blue-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    {info.label}
                  </button>
                );
              })}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col"
                  >
                    {/* 채팅 영역 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {responses.length === 0 && !currentQuestion && !aiResponse ? (
                        <div className="text-center text-gray-500 mt-16">
                          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">
                            AI에게 서버 상태나 시스템에 대해<br />
                            궁금한 것을 질문해보세요
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 이전 대화 내역 */}
                          {responses.map((response) => (
                            <div key={response.id} className="space-y-3">
                              <div className="text-right">
                                <div className="inline-block max-w-[80%] p-3 bg-blue-500 text-white rounded-2xl rounded-tr-md">
                                  <p className="text-sm">{response.question}</p>
                                </div>
                              </div>
                              <FinalResponse 
                                response={response}
                                onRegenerate={() => processQuestion(response.question)}
                              />
                            </div>
                          ))}
                          
                          {/* 현재 질문 */}
                          {currentQuestion && (
                            <div className="text-right">
                              <div className="inline-block max-w-[80%] p-3 bg-blue-500 text-white rounded-2xl rounded-tr-md">
                                <p className="text-sm">{currentQuestion}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* 현재 응답 */}
                          {aiResponse && !isThinking && (
                            <FinalResponse 
                              onRegenerate={() => processQuestion(currentQuestion)}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 입력 영역 */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex gap-2">
                        <textarea
                          value={customQuestion}
                          onChange={(e) => setCustomQuestion(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="AI에게 질문하세요..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={1}
                          disabled={isThinking}
                        />
                        <button
                          onClick={handleCustomQuestion}
                          disabled={!customQuestion.trim() || isThinking}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isThinking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'presets' && (
                  <motion.div
                    key="presets"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <EnhancedPresetQuestions 
                      onQuestionSelect={handlePresetSelect}
                    />
                  </motion.div>
                )}

                {activeTab === 'thinking' && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    {isThinking || currentQuestion ? (
                      <AgentThinkingPanel />
                    ) : (
                      <div className="text-center text-gray-500 mt-16">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">
                          AI가 분석을 시작하면<br />
                          사고 과정을 여기서 확인할 수 있습니다
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto p-4"
                  >
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">AI 설정</h3>
                      <div className="space-y-3">
                        <button
                          onClick={clearChat}
                          className="w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          대화 기록 삭제
                        </button>
                        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                          <p>• 응답 시간: 평균 2-5초</p>
                          <p>• 신뢰도: 85-95%</p>
                          <p>• 지원 언어: 한국어, 영어</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 