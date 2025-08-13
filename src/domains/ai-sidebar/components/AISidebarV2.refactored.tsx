/**
 * AI Sidebar V2 - 리팩토링된 메인 컴포넌트
 * 모듈화된 구조로 단일 책임 원칙 달성
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Bot,
  AlertTriangle,
  Activity,
  Shield,
  Wrench,
  Settings,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import type { ChatMessage } from '@/stores/useAISidebarStore';
import type { AIMode } from '@/types/ai-types';

// Custom Hooks
import { useAIThinking, useAIEngine } from '../hooks';

// Utils
import { 
  processRealAIQuery, 
  generateAutoReport, 
  handlePresetQuestion,
  detectAutoReportTrigger 
} from '../utils';

// Components
import { AIEngineDropdown } from './AIEngineDropdown';
import { AIThinkingDisplay } from './AIThinkingDisplay';
import { AIChatMessages } from './AIChatMessages';

// Types
import type { PresetQuestion } from '../types/ai-sidebar-types';

// 프리셋 질문 목록
const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: '1',
    icon: AlertTriangle,
    text: '시스템 이상 징후가 있나요?',
    category: 'monitoring',
    priority: 'high',
  },
  {
    id: '2',
    icon: Activity,
    text: '성능 개선 방안을 알려주세요',
    category: 'performance',
    priority: 'medium',
  },
  {
    id: '3',
    icon: Shield,
    text: '보안 취약점이 있는지 확인해주세요',
    category: 'security',
    priority: 'high',
  },
  {
    id: '4',
    icon: Wrench,
    text: '문제 해결 방법을 제안해주세요',
    category: 'troubleshooting',
    priority: 'medium',
  },
];

export const AISidebarV2Refactored: React.FC = () => {
  // Store
  const {
    isOpen,
    messages,
    sessionId,
    addMessage,
    clearMessages,
    setCurrentEngine,
    toggleSidebar,
  } = useAISidebarStore();

  // Custom Hooks
  const {
    isThinking,
    currentThinkingSteps,
    isThinkingExpanded,
    thinkingStartTime,
    showThinkingDisplay,
    completedThinkingSteps,
    startThinking,
    stopThinking,
    toggleThinkingExpanded,
    toggleCompletedThinking,
    simulateRealTimeThinking,
  } = useAIThinking();

  const {
    selectedEngine,
    showEngineInfo,
    isChangingEngine,
    setSelectedEngine,
    toggleEngineInfo,
    handleModeChange,
  } = useAIEngine();

  // Local State
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEngine, setCurrentEngineState] = useState<string>('mcp-local');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 사고 과정 시뮬레이션
  useEffect(() => {
    if (isThinking && showThinkingDisplay) {
      const cleanup = simulateRealTimeThinking();
      return cleanup;
    }
  }, [isThinking, showThinkingDisplay, simulateRealTimeThinking]);

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await processRealAIQuery(
        message.trim(),
        selectedEngine,
        sessionId,
        startThinking,
        stopThinking
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        engine: result.engine,
        metadata: {
          processingTime: result.processingTime,
        },
      };

      addMessage(assistantMessage);
      setCurrentEngine(result.engine);
      setCurrentEngineState(result.engine);

      // 자동 보고서 트리거 감지
      const trigger = detectAutoReportTrigger(result.content);
      if (trigger) {
        const reportMessage = await generateAutoReport(trigger, sessionId);
        if (reportMessage) {
          addMessage(reportMessage);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, 
    selectedEngine, 
    sessionId, 
    addMessage, 
    setCurrentEngine,
    startThinking,
    stopThinking
  ]);

  // 프리셋 질문 핸들러
  const handlePresetQuestionClick = useCallback(async (question: PresetQuestion) => {
    await handlePresetQuestion(
      question.text,
      async (query: string) => {
        await handleSendMessage(query);
      }
    );
  }, [handleSendMessage]);

  // 엔진 변경 핸들러
  const handleEngineChange = useCallback(async (newEngine: AIMode) => {
    const message = await handleModeChange(newEngine);
    if (message) {
      addMessage(message);
    }
  }, [handleModeChange, addMessage]);

  // 채팅 내보내기
  const handleExportChat = useCallback(() => {
    const chatData = {
      sessionId,
      exportDate: new Date().toISOString(),
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${sessionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionId, messages]);

  // Enter 키 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  }, [inputValue, handleSendMessage]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className='fixed right-0 top-0 h-full w-80 sm:w-96 bg-white shadow-xl z-50 flex flex-col'
      >
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <Bot className='w-4 h-4 text-white' />
            </div>
            <div>
              <h2 className='text-sm font-semibold text-gray-800'>
                AI Assistant
              </h2>
              <p className='text-xs text-gray-500'>실시간 분석 지원</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-4 h-4 text-gray-600' />
          </button>
        </div>

        {/* 엔진 선택 & 옵션 */}
        <div className='px-4 py-2 border-b border-gray-100 flex items-center justify-between'>
          <AIEngineDropdown
            selectedEngine={selectedEngine}
            showEngineInfo={showEngineInfo}
            onEngineSelect={handleEngineChange}
            onToggleEngineInfo={toggleEngineInfo}
            currentEngine={currentEngine}
          />
          <div className='flex items-center space-x-1'>
            <button
              onClick={clearMessages}
              className='p-1 hover:bg-gray-100 rounded transition-colors'
              title='대화 초기화'
            >
              <RefreshCw className='w-3.5 h-3.5 text-gray-600' />
            </button>
            <button
              onClick={handleExportChat}
              className='p-1 hover:bg-gray-100 rounded transition-colors'
              title='대화 내보내기'
            >
              <Download className='w-3.5 h-3.5 text-gray-600' />
            </button>
            <button
              onClick={toggleEngineInfo}
              className='p-1 hover:bg-gray-100 rounded transition-colors'
              title='설정'
            >
              <Settings className='w-3.5 h-3.5 text-gray-600' />
            </button>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className='flex-1 overflow-y-auto px-4 py-3 space-y-3'>
          <AIChatMessages
            messages={messages}
            completedThinkingSteps={completedThinkingSteps}
            onToggleCompletedThinking={toggleCompletedThinking}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* 사고 과정 표시 */}
        {isThinking && showThinkingDisplay && (
          <div className='px-4 pb-2'>
            <AIThinkingDisplay
              isThinking={isThinking}
              currentSteps={currentThinkingSteps}
              isExpanded={isThinkingExpanded}
              startTime={thinkingStartTime}
              onToggleExpanded={toggleThinkingExpanded}
            />
          </div>
        )}

        {/* 프리셋 질문 */}
        {messages.length === 0 && (
          <div className='px-4 pb-3'>
            <div className='grid grid-cols-2 gap-2'>
              {PRESET_QUESTIONS.map(question => (
                <button
                  key={question.id}
                  onClick={() => handlePresetQuestionClick(question)}
                  disabled={isProcessing}
                  className='flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left disabled:opacity-50'
                >
                  {React.createElement(question.icon, {
                    className: 'w-3.5 h-3.5 text-gray-600',
                  })}
                  <span className='text-xs text-gray-700 line-clamp-2'>
                    {question.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className='p-4 border-t border-gray-200'>
          <div className='flex items-end space-x-2'>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isProcessing
                  ? 'AI가 응답 중입니다...'
                  : '메시지를 입력하세요... (Shift+Enter로 줄바꿈)'
              }
              disabled={isProcessing}
              className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500'
              rows={2}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className='p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed'
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className='w-4 h-4' />
                </motion.div>
              ) : (
                <Send className='w-4 h-4' />
              )}
            </button>
          </div>
          {isChangingEngine && (
            <p className='text-xs text-orange-600 mt-2'>
              엔진을 변경하는 중입니다...
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};