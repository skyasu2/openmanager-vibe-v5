/**
 * AIManagerSidebar Component
 * 
 * 🤖 고도화된 AI 관리자 사이드바 - 완전체 구현
 * - AI 사고 과정 실시간 시각화
 * - 육하원칙 기반 구조화된 응답
 * - 실시간 에러 모니터링 및 복구
 * - 반응형 UI/UX 및 애니메이션
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '@/stores/useSystemStore';
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
  History
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
  // 시스템 상태
  const { isAIAdminMode, isAuthenticated } = useSystemStore();
  
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
    handleFallback
  } = useErrorMonitoring();

  // 계산된 속성
  const isOpen = propIsOpen ?? (isAIAdminMode && isAuthenticated);
  const currentMode = propCurrentMode ?? (isAIAdminMode ? 'ai-admin' : 'monitoring');
  const isProcessing = propIsProcessing || isLoading || thinkingState.isActive;

  // AI 상태 모니터링
  useEffect(() => {
    if (!isOpen) return; // early return but after all hooks

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

      const duration = endPerformanceMonitoring('ai-chat-response');

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
  }, [clearFormatError]);

  // 탭 아이콘 렌더링
  const getTabIcon = useCallback((tab: typeof activeTab) => {
    const baseClass = "w-4 h-4";
    switch (tab) {
      case 'chat': return <MessageSquare className={baseClass} />;
      case 'thinking': return <Brain className={baseClass} />;
      case 'response': return <FileText className={baseClass} />;
      case 'monitor': return <Activity className={baseClass} />;
      default: return <MessageSquare className={baseClass} />;
    }
  }, []);

  // AI 모드가 아니거나 인증되지 않은 경우 표시하지 않음
  if (!isOpen) {
    return null;
  }

  // 최소화된 상태
  if (isMinimized) {
    return (
      <motion.div 
        className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg border border-purple-500/30 text-white transition-all duration-300 relative"
        >
          <Brain className="w-5 h-5" />
          {(monitoringErrors.length > 0 || currentError) && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-sm border-l border-purple-500/30 shadow-2xl z-50 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-16'
      }`}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* 사이드바 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">AI 관리자</h3>
                <div className="flex items-center gap-1">
                  {aiStatus.agent === 'active' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                  <span className="text-xs text-gray-400">
                    {currentMode === 'ai-admin' ? 'AI 모드' : '모니터링 모드'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* 에러 인디케이터 */}
              {(monitoringErrors.length > 0 || currentError) && (
                <div className="relative">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
              
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                title="최소화"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                title="축소"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-purple-600/30 rounded text-purple-400 hover:text-white transition-colors"
              title="확장"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {aiStatus.agent === 'active' && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
        )}
      </div>

      {/* 확장된 사이드바 내용 */}
      {isExpanded && (
        <div className="flex flex-col h-full">
          {/* AI 상태 섹션 */}
          <div className="p-4 border-b border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-purple-300">시스템 상태</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                title={showAdvanced ? "간단히 보기" : "자세히 보기"}
              >
                {showAdvanced ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            
            <div className="space-y-2">
              {/* 기본 상태 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">AI 에이전트</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.agent)}
                  <span className="text-gray-400 capitalize">{aiStatus.agent}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Network className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">MCP</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.mcp)}
                  <span className="text-gray-400 capitalize">{aiStatus.mcp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">분석 엔진</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(aiStatus.analytics)}
                  <span className="text-gray-400 capitalize">{aiStatus.analytics}</span>
                </div>
              </div>

              {/* 고급 상태 정보 */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pt-2 border-t border-purple-500/20 space-y-1"
                  >
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>오류 수:</span>
                      <span className={monitoringErrors.length > 0 ? 'text-red-400' : 'text-green-400'}>
                        {monitoringErrors.length}
                      </span>
                    </div>
                    {formatError && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>포맷 오류:</span>
                        <span className="text-red-400">있음</span>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>처리 중:</span>
                        <span className="text-blue-400">예</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-purple-500/30">
            {[
              { key: 'chat', label: '채팅' },
              { key: 'thinking', label: '사고' },
              { key: 'response', label: '응답' },
              { key: 'monitor', label: '모니터' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1 p-3 text-xs transition-colors ${
                  activeTab === tab.key 
                    ? 'text-purple-300 border-b-2 border-purple-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {getTabIcon(tab.key as typeof activeTab)}
                <span className="hidden sm:inline">{tab.label}</span>
                {/* 알림 배지 */}
                {tab.key === 'monitor' && monitoringErrors.length > 0 && (
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                )}
                {tab.key === 'thinking' && isProcessing && (
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {/* 채팅 헤더 */}
                  <div className="p-4 border-b border-purple-500/30 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-purple-300">AI 채팅</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={clearChatHistory}
                        className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                        title="채팅 기록 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* 채팅 메시지 영역 */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 mt-8">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">AI 에이전트에게 질문해보세요</p>
                        <p className="text-xs mt-1 opacity-70">예: "서버 상태는?"</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-3 rounded-lg text-xs ${
                              msg.type === 'user' 
                                ? 'bg-purple-600 text-white' 
                                : msg.error
                                  ? 'bg-red-900/50 text-red-200 border border-red-500/30'
                                  : 'bg-slate-700 text-gray-100'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600/50">
                                <p className="text-xs opacity-60">
                                  {msg.timestamp.toLocaleTimeString()}
                                </p>
                                {msg.structured && (
                                  <button
                                    onClick={() => {
                                      setCurrentStructuredResponse(msg.structured!);
                                      setActiveTab('response');
                                    }}
                                    className="text-xs text-purple-300 hover:text-purple-200"
                                  >
                                    구조화된 응답 보기
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-slate-700 text-gray-100 p-3 rounded-lg text-xs flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              AI가 응답을 생성하고 있습니다...
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 채팅 입력 */}
                  <div className="p-4 border-t border-purple-500/30">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="질문하기..."
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        disabled={isLoading || aiStatus.agent !== 'active'}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isLoading || aiStatus.agent !== 'active'}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'thinking' && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <ThinkingProcessVisualizer
                    steps={propThinkingSteps}
                    isActive={isProcessing}
                    showProgress={true}
                    showSubSteps={true}
                    enableAnimations={true}
                  />
                </motion.div>
              )}

              {activeTab === 'response' && (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto p-4"
                >
                  {currentStructuredResponse || propCurrentResponse ? (
                    <SixWPrincipleDisplay
                      response={currentStructuredResponse || propCurrentResponse!}
                      showSources={true}
                      showConfidence={true}
                      enableCopy={true}
                      expandable={false}
                    />
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">구조화된 응답이 없습니다</p>
                      <p className="text-xs mt-1 opacity-70">AI와 채팅하여 응답을 받아보세요</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'monitor' && (
                <motion.div
                  key="monitor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto p-4"
                >
                  <div className="space-y-4">
                    {/* 에러 모니터링 헤더 */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-purple-300">에러 모니터링</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={clearErrors}
                          className="p-1 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                          title="모든 에러 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 현재 에러 */}
                    {currentError && (
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-red-300">현재 에러</span>
                        </div>
                        <p className="text-xs text-red-200">{currentError.message}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-red-400">
                          <span>타입: {currentError.errorType}</span>
                          <span>재시도: {currentError.retryCount}/{currentError.maxRetries}</span>
                        </div>
                      </div>
                    )}

                    {/* 에러 로그 */}
                    {monitoringErrors.length > 0 ? (
                      <div className="space-y-2">
                        {monitoringErrors.slice(0, 5).map((error) => (
                          <div
                            key={error.id}
                            className={`p-2 rounded border text-xs ${
                              error.level === 'error' 
                                ? 'bg-red-900/10 border-red-500/20 text-red-300'
                                : error.level === 'warning'
                                  ? 'bg-yellow-900/10 border-yellow-500/20 text-yellow-300'
                                  : 'bg-blue-900/10 border-blue-500/20 text-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{error.category}</span>
                              <button
                                onClick={() => resolveError(error.id)}
                                className="text-green-400 hover:text-green-300"
                                title="해결 표시"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="opacity-80">{error.message}</p>
                            <p className="opacity-60 mt-1">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                        {monitoringErrors.length > 5 && (
                          <p className="text-xs text-gray-400 text-center">
                            그 외 {monitoringErrors.length - 5}개 더...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 mt-8">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">에러가 없습니다</p>
                        <p className="text-xs mt-1 opacity-70">시스템이 정상 작동 중입니다</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIManagerSidebar; 