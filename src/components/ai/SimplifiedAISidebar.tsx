/**
 * 🎯 간소화된 AI 사이드바 - SimplifiedQueryEngine 통합
 * 기존 UI/UX 99% 유지하면서 새로운 AI 엔진 사용
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  Send,
  User,
  X,
  Zap,
  Database,
  Loader2,
} from 'lucide-react';
import { useAIQuery } from '@/hooks/api/useAIQuery';
import { EnhancedThinkingView } from '@/components/ai/EnhancedThinkingView';
import type { ThinkingStep } from '@/hooks/api/useAIQuery';

// 기존 타입들 재사용
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  engine?: string;
  processingTime?: number;
  confidence?: number;
}

interface SimplifiedAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// 엔진 정보
const engines = [
  {
    id: 'local',
    name: '로컬 AI',
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '규칙 기반 + RAG + MCP',
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Gemini Pro 모델',
  },
];

// 프리셋 질문들
const presetQuestions = [
  '현재 CPU 사용률이 높은 서버는?',
  '메모리가 부족한 서버 목록',
  '디스크 사용량 확인 명령어',
  '서버 상태 전체 요약',
  '네트워크 트래픽이 많은 서버',
  '최근 1시간 서버 이벤트',
  '서버 재시작 명령어는?',
  '로그 파일 확인 방법',
];

export const SimplifiedAISidebar: React.FC<SimplifiedAISidebarProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'local' | 'google-ai'>('local');
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  
  // 새로운 AI 쿼리 훅 사용
  const aiQuery = useAIQuery();
  const sendQuery = aiQuery.sendQuery;
  const isQueryLoading = aiQuery.isPending ?? false;
  const isThinking = aiQuery.isThinking;
  const currentSteps = aiQuery.currentSteps;

  // 레퍼런스
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentSteps]);

  // 메시지 전송 처리
  const handleSendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isQueryLoading) return;

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion(query);
    setInputValue('');

    // AI 쿼리 전송
    sendQuery({
      query,
      mode: selectedEngine,
      includeContext: true,
      options: {
        includeMCPContext: selectedEngine === 'local',
        useCache: true,
      },
    }, {
      onSuccess: (response) => {
        // AI 응답 메시지 추가
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: response.response,
          timestamp: new Date(),
          engine: response.engine || selectedEngine,
          processingTime: response.metadata?.processingTime,
          confidence: response.confidence,
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentQuestion('');
      },
      onError: (error) => {
        // 에러 메시지 추가
        const errorMessage: ChatMessage = {
          id: `ai_error_${Date.now()}`,
          type: 'ai',
          content: '죄송합니다. 질의 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date(),
          engine: selectedEngine,
        };
        setMessages(prev => [...prev, errorMessage]);
        setCurrentQuestion('');
      },
    });
  }, [sendQuery, selectedEngine, isQueryLoading]);

  // 입력 처리
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // 프리셋 질문 클릭
  const handlePresetClick = (question: string) => {
    handleSendMessage(question);
  };

  // ThinkingStep 변환 (useAIQuery → EnhancedThinkingView 형식)
  const convertThinkingSteps = (steps: ThinkingStep[]): any[] => {
    return steps.map((step, index) => ({
      id: `step_${index}`,
      engine: step.description?.includes('MCP') ? 'MCP' : 
              step.description?.includes('RAG') ? 'RAG' : 
              step.description?.includes('Google') ? 'Google-AI' : 'Unified',
      type: step.status === 'thinking' ? 'analyzing' : 
            step.status === 'processing' ? 'processing' : 
            step.status === 'completed' ? 'completed' : 'generating',
      content: step.description || step.step,
      timestamp: step.timestamp || new Date(),
      progress: step.status === 'completed' ? 100 : 
                step.status === 'processing' ? 50 : 0,
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col ${className}`}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI 어시스턴트</h2>
                <p className="text-xs text-gray-600">서버 모니터링 도우미</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 엔진 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowEngineDropdown(!showEngineDropdown)}
              className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                {React.createElement(
                  engines.find(e => e.id === selectedEngine)?.icon || Bot,
                  { className: `w-4 h-4 ${engines.find(e => e.id === selectedEngine)?.color}` }
                )}
                <span className="text-sm font-medium">
                  {engines.find(e => e.id === selectedEngine)?.name}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            <AnimatePresence>
              {showEngineDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  {engines.map(engine => (
                    <button
                      key={engine.id}
                      onClick={() => {
                        setSelectedEngine(engine.id as 'local' | 'google-ai');
                        setShowEngineDropdown(false);
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedEngine === engine.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${engine.bgColor} rounded-lg flex items-center justify-center`}>
                          {React.createElement(engine.icon, {
                            className: `w-4 h-4 ${engine.color}`,
                          })}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{engine.name}</h4>
                          <p className="text-xs text-gray-600">{engine.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">안녕하세요! 👋</h3>
              <p className="text-sm text-gray-600 mb-6">
                서버 모니터링에 대해 무엇이든 물어보세요.
              </p>
              
              {/* 프리셋 질문 */}
              <div className="grid grid-cols-2 gap-2">
                {presetQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(question)}
                    className="p-2 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((message, index) => (
            <div key={message.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {message.type === 'ai' && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>{message.engine}</span>
                        {message.confidence !== undefined && (
                          <span>• 신뢰도 {Math.round(message.confidence * 100)}%</span>
                        )}
                        {message.processingTime && (
                          <span>• {(message.processingTime / 1000).toFixed(1)}초</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 생각 과정 표시 - 메시지 바로 다음에 */}
              {message.type === 'user' && 
               index === messages.length - 1 && 
               isThinking && 
               currentSteps.length > 0 && (
                <div className="mt-3 ml-10">
                  <EnhancedThinkingView
                    isThinking={isThinking}
                    steps={convertThinkingSteps(currentSteps)}
                    currentQuestion={message.content}
                    className="max-w-[85%]"
                  />
                </div>
              )}
            </div>
          ))}

          {/* 로딩 중 표시 (생각 과정이 없을 때만) */}
          {isQueryLoading && currentSteps.length === 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI가 응답을 준비하고 있습니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isQueryLoading}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isQueryLoading}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* 프리셋 질문 스크롤 */}
          {messages.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {presetQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(question)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full whitespace-nowrap transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};