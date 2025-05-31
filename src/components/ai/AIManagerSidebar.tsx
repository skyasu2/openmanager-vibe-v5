/**
 * AIManagerSidebar Component
 * 
 * 🤖 고도화된 AI 관리자 사이드바 - 완전체 구현
 * - AI 사고 과정 실시간 시각화
 * - 육하원칙 기반 구조화된 응답
 * - 실시간 에러 모니터링 및 복구
 * - 반응형 UI/UX 및 애니메이션
 * - 접근성 및 키보드 네비게이션 지원
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIResponseFormatter } from '@/hooks/useAIResponseFormatter';
import { useErrorMonitoring } from '@/hooks/useErrorMonitoring';
import { ThinkingProcessVisualizer } from './ThinkingProcessVisualizer';
import { SixWPrincipleDisplay } from './SixWPrincipleDisplay';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Zap, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Cpu,
  Network,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  RotateCcw,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  History,
  X,
  RefreshCw,
  Sparkles,
  Monitor,
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  AIThinkingStep, 
  SixWPrincipleResponse, 
  AIManagerSidebarProps,
  ThinkingProcessState
} from '@/types/ai-thinking';

interface AIStatus {
  agent: 'active' | 'inactive' | 'error';
  mcp: 'connected' | 'disconnected' | 'error';
  analytics: 'running' | 'idle' | 'error';
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  thinking?: AIThinkingStep[];
  structured?: SixWPrincipleResponse;
  error?: string;
}

export const AIManagerSidebar: React.FC<Partial<AIManagerSidebarProps>> = ({
  isOpen: propIsOpen,
  onClose,
  currentMode: propCurrentMode,
  thinkingSteps: propThinkingSteps = [],
  isProcessing: propIsProcessing = false,
  currentResponse: propCurrentResponse
}) => {
  // 로컬 상태
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'thinking' | 'response' | 'monitor'>('chat');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // AI 상태 및 채팅
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    agent: 'inactive',
    mcp: 'disconnected',
    analytics: 'idle'
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 사고 과정 상태
  const [thinkingState, setThinkingState] = useState<ThinkingProcessState>({
    steps: [],
    currentStepIndex: 0,
    isActive: false,
    totalDuration: 0
  });
  
  // 현재 응답 상태
  const [currentStructuredResponse, setCurrentStructuredResponse] = useState<SixWPrincipleResponse | null>(null);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 훅 사용
  const { 
    formatResponse, 
    isFormatting, 
    error: formatError,
    clearError: clearFormatError 
  } = useAIResponseFormatter();
  
  const {
    errors: monitoringErrors,
    currentError,
    handleAIError,
    resolveError,
    clearErrors,
    startPerformanceMonitoring,
    endPerformanceMonitoring,
    handleFallback,
    performanceSummary
  } = useErrorMonitoring();

  // 계산된 속성
  const isOpen = propIsOpen ?? true;
  const currentMode = propCurrentMode ?? 'monitoring';
  const isProcessing = propIsProcessing || isLoading || thinkingState.isActive;

  // AI 상태 모니터링
  useEffect(() => {
    if (!isOpen) return;

    const checkAIStatus = async () => {
      startPerformanceMonitoring('ai-status-check');
      
      try {
        const [agentResponse, mcpResponse] = await Promise.allSettled([
          fetch('/api/ai/unified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'status_check', mode: 'heartbeat' })
          }),
          fetch('/api/ai/mcp/test')
        ]);

        setAIStatus({
          agent: agentResponse.status === 'fulfilled' && agentResponse.value.ok ? 'active' : 'error',
          mcp: mcpResponse.status === 'fulfilled' && mcpResponse.value.ok ? 'connected' : 'error',
          analytics: 'running'
        });

        endPerformanceMonitoring('ai-status-check');
      } catch (error) {
        handleAIError(error, 'AI Status Check');
        setAIStatus({
          agent: 'error',
          mcp: 'error',
          analytics: 'error'
        });
      }
    };

    checkAIStatus();
    const statusInterval = setInterval(checkAIStatus, 30000);
    return () => clearInterval(statusInterval);
  }, [isOpen, startPerformanceMonitoring, endPerformanceMonitoring, handleAIError]);

  // 채팅 스크롤 자동 조정
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 키보드 단축키
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 메시지 전송
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
      
      // ESC: 사이드바 닫기
      if (e.key === 'Escape') {
        setIsMinimized(true);
      }
      
      // Tab 네비게이션 (Ctrl + 1-4)
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const tabs: Array<typeof activeTab> = ['chat', 'thinking', 'response', 'monitor'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chatInput]);

  // AI 채팅 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageContent = chatInput;
    setChatInput('');
    setIsLoading(true);

    // 사고 과정 시작
    setThinkingState(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      currentStepIndex: 0
    }));

    startPerformanceMonitoring('ai-chat-response');

    try {
      const response = await fetch('/api/ai/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: messageContent,
          mode: 'chat'
        })
      });

      endPerformanceMonitoring('ai-chat-response');

      if (response.ok) {
        const data = await response.json();
        const rawResponse = data.result?.answer || '응답을 받을 수 없습니다.';

        // 응답 구조화
        let structuredResponse: SixWPrincipleResponse | undefined;
        try {
          structuredResponse = await formatResponse(rawResponse);
          setCurrentStructuredResponse(structuredResponse);
        } catch (formatError) {
          console.warn('⚠️ 응답 구조화 실패, 원본 응답 사용:', formatError);
          structuredResponse = handleFallback('response-formatting', {
            who: 'AI 시스템',
            what: '응답 제공',
            when: '현재',
            where: 'OpenManager V5',
            why: '사용자 질의 응답',
            how: '텍스트 응답',
            confidence: 0.5,
            sources: ['AI 분석']
          });
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: rawResponse,
          timestamp: new Date(),
          structured: structuredResponse
        };

        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '죄송합니다. 현재 AI 에이전트가 응답할 수 없습니다.',
          timestamp: new Date(),
          error: `HTTP ${response.status}`
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      handleAIError(error, 'AI Chat');
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '네트워크 오류가 발생했습니다.',
        timestamp: new Date(),
        error: error.message
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setThinkingState(prev => ({
        ...prev,
        isActive: false,
        endTime: new Date()
      }));
    }
  }, [
    chatInput, 
    isLoading, 
    startPerformanceMonitoring, 
    endPerformanceMonitoring, 
    formatResponse, 
    handleAIError, 
    handleFallback
  ]);

  // 상태 아이콘 렌더링
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'running':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'inactive':
      case 'disconnected':
      case 'idle':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default:
        return <AlertTriangle className="w-3 h-3 text-gray-400" />;
    }
  }, []);

  // 채팅 히스토리 클리어
  const clearChatHistory = useCallback(() => {
    setChatMessages([]);
    setCurrentStructuredResponse(null);
    clearFormatError();
    clearErrors();
  }, [clearFormatError, clearErrors]);

  // 탭 구성
  const tabs = useMemo(() => [
    {
      id: 'chat' as const,
      label: '채팅',
      icon: MessageSquare,
      count: chatMessages.length,
      badge: isLoading
    },
    {
      id: 'thinking' as const,
      label: '사고과정',
      icon: Brain,
      count: thinkingState.steps.length,
      badge: thinkingState.isActive
    },
    {
      id: 'response' as const,
      label: '구조화 응답',
      icon: FileText,
      count: currentStructuredResponse ? 1 : 0,
      badge: isFormatting
    },
    {
      id: 'monitor' as const,
      label: '모니터링',
      icon: Activity,
      count: monitoringErrors.length,
      badge: currentError !== null
    }
  ], [chatMessages.length, thinkingState, currentStructuredResponse, isFormatting, monitoringErrors.length, currentError, isLoading]);

  // 애니메이션 variants
  const sidebarVariants = {
    expanded: { width: 384 }, // w-96
    collapsed: { width: 64 }, // w-16
    minimized: { x: '100%', opacity: 0 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const tabVariants = {
    inactive: { 
      backgroundColor: 'rgba(0,0,0,0)',
      color: '#9CA3AF'
    },
    active: { 
      backgroundColor: 'rgba(139, 69, 219, 0.2)',
      color: '#A855F7'
    }
  };

  // AI 모드가 아니거나 인증되지 않은 경우 표시하지 않음
  if (!isOpen) {
    return null;
  }

  // 최소화된 상태
  if (isMinimized) {
    return (
      <motion.div 
        className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <motion.button
          onClick={() => setIsMinimized(false)}
          className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg border border-purple-400/30 text-white transition-all duration-300 relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Brain className="w-5 h-5" />
          {(monitoringErrors.length > 0 || currentError) && (
            <motion.div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          
          {/* 툴팁 */}
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI 관리자 열기
          </div>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`fixed top-0 right-0 h-full bg-gradient-to-br from-slate-900/95 to-gray-900/95 backdrop-blur-lg border-l border-purple-500/30 shadow-2xl z-50 flex flex-col`}
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial="expanded"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* 사이드바 헤더 */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        {isExpanded ? (
          <>
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-white text-lg">AI 관리자</h3>
                <div className="flex items-center gap-2">
                  {aiStatus.agent === 'active' && (
                    <motion.div 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <span className="text-xs text-gray-400">
                    {currentMode === 'ai-admin' ? 'AI 모드 활성' : '모니터링 모드'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* 에러 인디케이터 */}
              {(monitoringErrors.length > 0 || currentError) && (
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <motion.div 
                    className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              )}
              
              <motion.button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-purple-600/30 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="최소화 (ESC)"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-purple-600/30 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="축소"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-purple-600/30 rounded-lg text-purple-400 hover:text-white transition-colors"
              title="확장"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            
            {/* 축소된 상태에서도 AI 상태 표시 */}
            <div className="flex flex-col items-center gap-2">
              {getStatusIcon(aiStatus.agent)}
              {getStatusIcon(aiStatus.mcp)}
              {getStatusIcon(aiStatus.analytics)}
            </div>
          </div>
        )}
      </motion.div>

      {/* 탭 네비게이션 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="flex border-b border-purple-500/30 bg-gray-800/30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-purple-300 bg-purple-600/20' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
                variants={tabVariants}
                animate={activeTab === tab.id ? 'active' : 'inactive'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
                
                {/* 배지 */}
                {(tab.count > 0 || tab.badge) && (
                  <motion.div 
                    className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center ${
                      tab.badge 
                        ? 'bg-yellow-500 text-yellow-900' 
                        : 'bg-purple-500 text-white'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {tab.badge ? '!' : tab.count}
                  </motion.div>
                )}
                
                {/* 활성 탭 인디케이터 */}
                {activeTab === tab.id && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key={activeTab}
              className="h-full flex flex-col"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
            >
              {/* 채팅 탭 */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col">
                  {/* 채팅 메시지 영역 */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800"
                  >
                    <AnimatePresence>
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] ${
                            message.type === 'user' 
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                              : message.error
                                ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 text-red-300'
                                : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100'
                          } rounded-2xl px-4 py-3 shadow-lg relative group`}>
                            <div className="text-sm leading-relaxed">{message.content}</div>
                            
                            {/* 메시지 시간 */}
                            <div className={`text-xs mt-2 opacity-70 ${
                              message.type === 'user' ? 'text-purple-200' : 'text-gray-400'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                            
                            {/* 에러 표시 */}
                            {message.error && (
                              <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                                Error: {message.error}
                              </div>
                            )}
                            
                            {/* 구조화된 응답 미리보기 */}
                            {message.structured && (
                              <motion.button
                                onClick={() => {
                                  setCurrentStructuredResponse(message.structured!);
                                  setActiveTab('response');
                                }}
                                className="mt-2 text-xs text-purple-300 hover:text-purple-200 underline"
                                whileHover={{ scale: 1.05 }}
                              >
                                📋 구조화된 응답 보기
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* 로딩 인디케이터 */}
                    <AnimatePresence>
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex justify-start"
                        >
                          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="w-4 h-4 text-purple-400" />
                            </motion.div>
                            <span className="text-sm text-gray-300">AI가 응답을 생성중입니다...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* 채팅 입력 영역 */}
                  <div className="p-4 border-t border-purple-500/30 bg-gray-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={clearChatHistory}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="채팅 기록 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-gray-500">
                        메시지 {chatMessages.length}개 • Ctrl+Enter로 전송
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="AI에게 질문하세요..."
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={isLoading}
                        />
                        
                        {/* 입력 상태 인디케이터 */}
                        <AnimatePresence>
                          {chatInput.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400"
                            >
                              {chatInput.length}/500
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isLoading}
                        className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition-all"
                        whileHover={!isLoading ? { scale: 1.05 } : {}}
                        whileTap={!isLoading ? { scale: 0.95 } : {}}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 사고 과정 탭 */}
              {activeTab === 'thinking' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <ThinkingProcessVisualizer
                    thinkingState={thinkingState}
                    isActive={thinkingState.isActive}
                    onStepComplete={(step) => {
                      console.log('🧠 사고 과정 단계 완료:', step);
                    }}
                    showSubSteps={true}
                    animate={true}
                  />
                </div>
              )}
              
              {/* 구조화된 응답 탭 */}
              {activeTab === 'response' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {currentStructuredResponse ? (
                    <SixWPrincipleDisplay
                      response={currentStructuredResponse}
                      showCopyButtons={true}
                      showConfidence={true}
                      showSources={true}
                      onCopy={(content, type) => {
                        console.log(`📋 복사됨 [${type}]:`, content);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <FileText className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">구조화된 응답 없음</p>
                      <p className="text-sm text-center">
                        AI와 대화를 시작하면<br />
                        육하원칙 기반 구조화된 응답을 볼 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 모니터링 탭 */}
              {activeTab === 'monitor' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* AI 시스템 상태 */}
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-purple-400" />
                      시스템 상태
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">AI 에이전트</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(aiStatus.agent)}
                          <span className="text-xs text-gray-300 capitalize">{aiStatus.agent}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">MCP 연결</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(aiStatus.mcp)}
                          <span className="text-xs text-gray-300 capitalize">{aiStatus.mcp}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">분석 엔진</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(aiStatus.analytics)}
                          <span className="text-xs text-gray-300 capitalize">{aiStatus.analytics}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 성능 메트릭 */}
                  {performanceSummary && (
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        성능 요약
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">
                            {Math.round(performanceSummary.successRate)}%
                          </div>
                          <div className="text-xs text-gray-400">성공률</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">
                            {performanceSummary.averageDuration}ms
                          </div>
                          <div className="text-xs text-gray-400">평균 응답</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 에러 목록 */}
                  {monitoringErrors.length > 0 && (
                    <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                      <h4 className="font-medium text-red-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        에러 로그 ({monitoringErrors.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {monitoringErrors.slice(-5).map((error, index) => (
                          <div key={index} className="text-xs text-red-200 bg-red-800/20 p-2 rounded">
                            <div className="font-medium">{error.errorType}</div>
                            <div className="opacity-75">{error.message}</div>
                            <div className="opacity-50 mt-1">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={clearErrors}
                        className="mt-3 w-full text-xs text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-400/50 rounded py-2 transition-colors"
                      >
                        에러 로그 지우기
                      </button>
                    </div>
                  )}
                  
                  {/* 에러가 없을 때 */}
                  {monitoringErrors.length === 0 && !currentError && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Shield className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">시스템 정상</p>
                      <p className="text-sm text-center">
                        모든 시스템이 정상적으로<br />
                        작동하고 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 하단 상태바 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="p-3 border-t border-purple-500/30 bg-gray-800/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-4">
                {isProcessing && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>처리중</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  <span>연결됨</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIManagerSidebar; 