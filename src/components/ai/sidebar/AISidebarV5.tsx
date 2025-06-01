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

  // TODO: Zustand 타입 에러 해결 후 복원
  const [isMinimized, setMinimized] = useState(false);

  // 임시 하드코딩
  const sidebarWidth = isMinimized ? 60 : 400;

  // Zustand 훅들 (타입 에러 임시 해결)
  const [customQuestion, setCustomQuestion] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Mock 데이터
  const aiResponse = '';

  // Mock 함수들
  const clearChat = () => {};

  // 모바일 감지
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

  // AI 분석 시뮬레이션 (간소화)
  const simulateAIAnalysis = useCallback(async (question: string) => {
    setThinking(true);
    setActiveTab('thinking');
    
    // 3초 후 완료
    setTimeout(() => {
      setThinking(false);
      setActiveTab('chat');
    }, 3000);
  }, []);

  // 질문 처리
  const processQuestion = useCallback(async (question: string) => {
    if (isThinking) return;
    await simulateAIAnalysis(question);
  }, [isThinking, simulateAIAnalysis]);

  // 프리셋 질문 선택
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
              {activeTab === 'chat' && (
                <div className="h-full">
                  <QAPanel />
                </div>
              )}
              
              {activeTab === 'presets' && (
                <div className="p-4">
                  <h3 className="text-white font-medium mb-4">프리셋 질문</h3>
                  <div className="space-y-2">
                    {PRESET_QUESTIONS.slice(0, 10).map((preset) => (
                      <motion.button
                        key={preset.id}
                        className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 border border-gray-600/30 
                                   rounded-lg text-gray-200 text-sm transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {preset.question}
                        {preset.isAIRecommended && (
                          <span className="ml-2 text-xs text-blue-400">★ AI 추천</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'thinking' && (
                <div className="h-full p-4">
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
                <div className="p-4">
                  <h3 className="text-white font-medium mb-4">설정</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">AI 모드</label>
                      <select className="w-full p-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-gray-200">
                        <option>기본 모드</option>
                        <option>고급 분석</option>
                        <option>실시간 모니터링</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">응답 길이</label>
                      <select className="w-full p-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-gray-200">
                        <option>간단</option>
                        <option>보통</option>
                        <option>상세</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">실시간 알림</span>
                      <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
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