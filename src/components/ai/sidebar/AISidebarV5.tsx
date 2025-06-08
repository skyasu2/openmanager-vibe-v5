/**
 * 🤖 AI 사이드바 V6 Enhanced - 고도화된 UX/UI
 * 
 * ✨ 새로운 기능:
 * - 오른쪽 세로 기능 메뉴 (항상 표시)
 * - 채팅 중심 UI (기본 탭)
 * - 페이지네이션 답변 시스템
 * - 실시간 생각 과정 애니메이션
 * - 접이식 생각 과정 패널
 * - 프리셋 질문 카드 UI
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Search,
  BarChart3,
  Database,
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

// 🎨 기능 메뉴 아이템
const FUNCTION_MENU = [
  { id: 'chat', icon: MessageSquare, label: '채팅', active: true },
  { id: 'presets', icon: Lightbulb, label: '프리셋' },
  { id: 'analysis', icon: BarChart3, label: '분석' },
  { id: 'search', icon: Search, label: '검색' },
  { id: 'database', icon: Database, label: '데이터' },
  { id: 'settings', icon: Cog, label: '설정' }
];

// 🎯 프리셋 질문 카드
const PRESET_CARDS = [
  { id: 1, keyword: '서버 상태', question: '현재 서버들의 전체 상태는 어떤가요?' },
  { id: 2, keyword: '성능 분석', question: '성능에 문제가 있는 서버를 찾아주세요' },
  { id: 3, keyword: '예측 분석', question: '향후 리소스 사용량을 예측해주세요' },
  { id: 4, keyword: '최적화', question: '시스템 최적화 방안을 제안해주세요' }
];

// 💭 생각 과정 단계
interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  progress: number;
  completed: boolean;
}

// 📄 채팅 메시지 타입
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  pages?: string[];
}

/**
 * 🤖 AI 사이드바 V6 Enhanced - 고도화된 UX/UI
 */
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

  // 🎛️ UI 상태
  const [activeFunction, setActiveFunction] = useState('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // 📄 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [thinkingCollapsed, setThinkingCollapsed] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<ThinkingStep[]>([]);
  
  // 📜 스크롤 참조
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);

  // 🔄 생각 과정 시뮬레이션
  const simulateThinking = useCallback(async (question: string) => {
    setIsThinking(true);
    setThinkingCollapsed(false);
    
    const steps: ThinkingStep[] = [
      { id: '1', title: '질문 분석', content: '사용자의 질문을 파싱하고 의도를 파악중...', progress: 0, completed: false },
      { id: '2', title: '컨텍스트 수집', content: '관련 서버 데이터와 메트릭을 수집중...', progress: 0, completed: false },
      { id: '3', title: '데이터 분석', content: '수집된 데이터를 분석하고 패턴을 찾는중...', progress: 0, completed: false },
      { id: '4', title: '추론 과정', content: '논리적 추론을 통해 답변을 구성중...', progress: 0, completed: false },
      { id: '5', title: '응답 생성', content: '최종 답변을 생성하고 검증중...', progress: 0, completed: false }
    ];

    setCurrentThinking(steps);

    for (let i = 0; i < steps.length; i++) {
      // 단계별 진행
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setCurrentThinking(prev => prev.map((step, index) => 
          index === i ? { ...step, progress } : step
        ));
      }
      
      // 단계 완료
      setCurrentThinking(prev => prev.map((step, index) => 
        index === i ? { ...step, completed: true, progress: 100 } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsThinking(false);
    setThinkingCollapsed(true);

    // 답변 생성 (페이지별로)
    const responsePages = [
      '현재 서버 상태를 분석한 결과, 전체 10대의 서버 중 8대가 정상 운영중입니다.',
      'CPU 사용률은 평균 45%로 안정적이며, 메모리 사용률은 62%로 적정 수준을 유지하고 있습니다.',
      '네트워크 트래픽은 일일 패턴을 따라 정상 범위 내에서 변동하고 있으며, 현재 시점에서는 특별한 이상 징후가 발견되지 않았습니다.',
      '다만, WEB-03 서버의 디스크 사용률이 85%에 도달하여 주의가 필요한 상황입니다. 곧 정리 작업을 권장합니다.'
    ];

    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: question,
      timestamp: new Date(),
      thinking: currentThinking,
      pages: responsePages
    };

    setMessages(prev => [...prev, aiMessage]);
    setCurrentPage(0);
  }, [currentThinking]);

  // 💬 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    // AI 응답 시뮬레이션
    await simulateThinking(currentInput);
  }, [currentInput, simulateThinking]);

  // 🎯 프리셋 질문 클릭
  const handlePresetClick = useCallback((question: string) => {
    setCurrentInput(question);
    setTimeout(() => handleSendMessage(), 100);
  }, [handleSendMessage]);

  // 📄 현재 AI 메시지의 페이지 가져오기
  const getCurrentAIMessage = () => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.type === 'ai' ? lastMessage : null;
  };

  const currentAIMessage = getCurrentAIMessage();
  const totalPages = currentAIMessage?.pages?.length || 0;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex ${className}`}
      style={{ width: isMinimized ? '80px' : '500px' }}
    >
      {/* 🎨 오른쪽 세로 기능 메뉴 */}
      <div className="w-16 bg-gradient-to-b from-purple-600 to-pink-600 flex flex-col items-center py-4 space-y-3">
        {/* 헤더 버튼들 */}
        <div className="space-y-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title={isMinimized ? "확장" : "최소화"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-8 h-px bg-white/20" />

        {/* 기능 메뉴 */}
        {FUNCTION_MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeFunction === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveFunction(item.id)}
              className={`p-3 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              
              {/* 툴팁 */}
              {!isMinimized && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 📱 메인 컨텐츠 영역 */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col">
          {/* 🎯 헤더 */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">AI 어시스턴트</h2>
                <p className="text-sm text-gray-600">스마트 서버 관리</p>
              </div>
            </div>
          </div>

          {/* 🎯 프리셋 질문 카드 */}
          {activeFunction === 'chat' && messages.length === 0 && (
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">빠른 질문</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_CARDS.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handlePresetClick(card.question)}
                    className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-lg text-left hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="text-xs font-medium text-blue-700 mb-1">
                      {card.keyword}
                    </div>
                    <div className="text-xs text-gray-600 group-hover:text-gray-700">
                      클릭해서 질문하기
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 💬 채팅 영역 */}
          {activeFunction === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 메시지 컨테이너 */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    {/* 사용자 메시지 */}
                    {message.type === 'user' && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-md">
                          {message.content}
                        </div>
                      </div>
                    )}

                    {/* AI 생각 과정 */}
                    {message.type === 'ai' && message.thinking && (
                      <div className="space-y-2">
                        {isThinking && !thinkingCollapsed && (
                          <div 
                            ref={thinkingRef}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                              <span className="text-sm font-medium text-blue-800">생각 중...</span>
                            </div>
                            
                            <div className="space-y-3">
                              {currentThinking.map((step) => (
                                <div key={step.id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">
                                      {step.title}
                                    </span>
                                    {step.completed && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    )}
                                  </div>
                                  
                                  {/* 진행률 바 */}
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <motion.div
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${step.progress}%` }}
                                      transition={{ duration: 0.3 }}
                                    />
                                  </div>
                                  
                                  <p className="text-xs text-gray-600">{step.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 접힌 생각 과정 */}
                        {thinkingCollapsed && (
                          <button
                            onClick={() => setThinkingCollapsed(false)}
                            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">생각 과정 보기</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI 응답 (페이지네이션) */}
                    {message.type === 'ai' && message.pages && !isThinking && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md p-4">
                          <div className="text-gray-800">
                            {message.pages[currentPage]}
                          </div>
                          
                          {/* 페이지네이션 컨트롤 */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                      i === currentPage ? 'bg-purple-500' : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              
                              <button
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* 페이지 인디케이터 */}
                        {totalPages > 1 && (
                          <div className="text-center">
                            <span className="text-xs text-gray-500">
                              {currentPage + 1} / {totalPages}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* 로딩 상태 */}
                {isThinking && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI가 답변을 준비하고 있습니다...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 입력 영역 */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="서버 관리에 대해 질문하세요..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isThinking}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentInput.trim() || isThinking}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔧 다른 기능 탭들 */}
          {activeFunction !== 'chat' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cog className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {FUNCTION_MENU.find(item => item.id === activeFunction)?.label} 기능
                </h3>
                <p className="text-gray-600">곧 구현될 예정입니다.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 