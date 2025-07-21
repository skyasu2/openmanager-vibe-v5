/**
 * 🎨 AI Sidebar V2 - 도메인 분리 아키텍처 + 아이콘 패널 통합
 *
 * ✅ 오른쪽 AI 기능 아이콘 패널 추가
 * ✅ 기능별 페이지 전환 시스템
 * ✅ 실시간 AI 로그 연동
 * ✅ 도메인 주도 설계(DDD) 적용
 * ✅ AI 모드 전환 UI 추가 (LOCAL/GOOGLE_AI)
 */

'use client';

import { useRealTimeAILogs } from '@/hooks/useRealTimeAILogs';
import {
  useAIChat,
  useAISidebarStore,
  useAIThinking,
} from '@/stores/useAISidebarStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  ChevronDown,
  FileText,
  Search,
  Send,
  Server,
  Target,
  User,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RealAISidebarService } from '../services/RealAISidebarService';

// 분리된 컴포넌트들 import
import { availableEngines } from './AIEngineSelector';
import { AIFunctionPages } from './AIFunctionPages';
import { AIPresetQuestions } from './AIPresetQuestions';
import { AISidebarHeader } from './AISidebarHeader';

// 타입 정의 import
import type { AISidebarV2Props, ThinkingStep } from '../types/ai-sidebar-types';
import type { ChatMessage } from '@/stores/useAISidebarStore';

// 새로 분리된 컴포넌트들 import

// AI 기능 아이콘 패널 및 페이지 컴포넌트들
import type { AIAgentFunction } from '@/components/ai/AIAgentIconPanel';
import AIAgentIconPanel from '@/components/ai/AIAgentIconPanel';

// 🎯 AI 타입 및 모드 선택기 추가
import { AIModeSelector } from '@/components/ai/AIModeSelector';
import type { AIMode } from '@/types/ai-types';

// AI_ENGINES는 이제 AIEngineSelector에서 import됨

export const AISidebarV2: React.FC<AISidebarV2Props> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  // 실제 AI 서비스 인스턴스
  const aiService = new RealAISidebarService();

  // 🔧 상태 관리 (8개 그룹)
  const [selectedFunction, setSelectedFunction] =
    useState<AIAgentFunction>('chat');
  const [selectedEngine, setSelectedEngine] = useState<AIMode>('LOCAL');
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  // 로컬 채팅 메시지 상태
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);

  // 자동 보고서 트리거 상태
  const [autoReportTrigger, setAutoReportTrigger] = useState<{
    shouldGenerate: boolean;
    lastQuery?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }>({
    shouldGenerate: false,
  });

  // Enhanced Chat 상태 (messages는 useAIChat에서 관리) - 디폴트 로컬 모드
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  // const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // TODO: 향후 파일 업로드 기능
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);

  // 프리셋 질문 네비게이션 상태
  const PRESETS_PER_PAGE = 4;

  // 도메인 훅들 사용
  const { setOpen } = useAISidebarStore();
  const { isThinking, steps, addStep, clearSteps } = useAIThinking();

  // 로컬 상태로 관리
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  // 새로운 useAIChat 훅 사용
  const {
    messages: hookMessages,
    sendMessage: hookSendMessage,
    clearMessages,
    isLoading,
  } = useAIChat();

  // 로컬 상태로 관리
  const [responses, setResponses] = useState<any[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSessionId] = useState(`session-${Date.now()}`);

  // 🧠 실제 생각하기 기능 상태
  const [realThinking, setRealThinking] = useState<{
    isActive: boolean;
    steps: ThinkingStep[];
    currentStep?: string;
  }>({
    isActive: false,
    steps: [],
  });

  // 🔧 생각중 표시 지속 시간 관리
  const [showThinkingDisplay, setShowThinkingDisplay] = useState(false);
  const [thinkingPersistTimer, setThinkingPersistTimer] =
    useState<NodeJS.Timeout | null>(null);

  // 🔧 프리셋 질문 표시 상태 (항상 표시하도록 변경)
  const [showPresets, setShowPresets] = useState(true);

  // 🧠 완료된 생각 과정 저장 (질문과 답변 사이에 표시)
  const [completedThinkingSteps, setCompletedThinkingSteps] = useState<{
    [messageId: string]: {
      steps: ThinkingStep[];
      isExpanded: boolean;
      query: string;
      engine: string;
      processingTime: number;
    };
  }>({});

  // 스크롤 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null); // TODO: 향후 파일 업로드 기능
  const presetScrollRef = useRef<HTMLDivElement>(null);

  // 실시간 AI 로그 훅
  const {
    logs: realTimeLogs,
    isConnected: isLogConnected,
    isProcessing: isRealTimeProcessing,
    currentEngine,
    techStack,
    connectionStatus,
  } = useRealTimeAILogs({
    sessionId: chatSessionId,
    mode: 'sidebar',
    maxLogs: 30,
  });

  // 빠른 질문 가져오기 (실제 서비스에서)
  const quickQuestions = aiService.getQuickQuestions();

  // UnifiedAIEngineRouter와 동기화
  useEffect(() => {
    const initializeRouter = async () => {
      try {
        // 더미 구현으로 인해 initialize 메서드가 없음
        // 기본값으로 LOCAL 설정
        setSelectedEngine('LOCAL');
        console.log('🎯 AI 사이드바 초기화 - 기본 모드: LOCAL');
      } catch (error) {
        console.error('AI 사이드바 초기화 실패:', error);
      }
    };

    if (isOpen) {
      initializeRouter();
    }
  }, [isOpen]);

  // 프리셋 질문 네비게이션 함수들은 AIPresetQuestions 컴포넌트로 이동됨

  // 아이콘 매핑
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Server,
      Search,
      BarChart3,
      Target,
    };
    return icons[iconName] || Server; // Default return
  };

  // 전체 메시지 (훅 메시지 + 로컬 메시지 결합)
  const allMessages = [...hookMessages, ...localChatMessages];

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (thinkingPersistTimer) {
        clearTimeout(thinkingPersistTimer);
      }
    };
  }, [thinkingPersistTimer]);

  // 사고 과정 관련 상태 추가
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<
    ThinkingStep[]
  >([]);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [thinkingStartTime, setThinkingStartTime] = useState<Date | null>(null);

  // 실시간 사고 과정 시뮬레이션
  const simulateRealTimeThinking = useCallback(() => {
    const steps: ThinkingStep[] = [
      {
        id: '1',
        step: 1,
        title: '질문 분석',
        description: '사용자의 질문을 이해하고 의도를 파악하고 있습니다...',
        status: 'processing',
      },
      {
        id: '2',
        step: 2,
        title: '데이터 수집',
        description: '관련 정보를 수집하고 있습니다...',
        status: 'pending',
      },
      {
        id: '3',
        step: 3,
        title: '분석 및 추론',
        description: '수집된 데이터를 분석하고 있습니다...',
        status: 'pending',
      },
      {
        id: '4',
        step: 4,
        title: '답변 생성',
        description: '최적의 답변을 생성하고 있습니다...',
        status: 'pending',
      },
    ];

    setCurrentThinkingSteps(steps);
    setThinkingStartTime(new Date());

    // 단계별 진행 시뮬레이션
    let currentStepIndex = 0;
    const interval = setInterval(
      () => {
        if (currentStepIndex < steps.length) {
          setCurrentThinkingSteps(prev =>
            prev.map((step, index) => {
              if (index === currentStepIndex) {
                return {
                  ...step,
                  status: 'completed',
                  duration: Math.random() * 2000 + 1000,
                };
              } else if (index === currentStepIndex + 1) {
                return { ...step, status: 'processing' };
              }
              return step;
            })
          );
          currentStepIndex++;
        } else {
          clearInterval(interval);
        }
      },
      1500 + Math.random() * 1000
    ); // 1.5-2.5초 간격

    return () => clearInterval(interval);
  }, []);

  // 생성 시작 시 사고 과정 시뮬레이션 시작
  useEffect(() => {
    if (isGenerating) {
      const cleanup = simulateRealTimeThinking();
      return cleanup;
    } else {
      setCurrentThinkingSteps([]);
      setThinkingStartTime(null);
      return undefined;
    }
  }, [isGenerating, simulateRealTimeThinking]);

  // 🔧 생각중 상태 관리 개선
  const startThinking = useCallback(() => {
    setIsGenerating(true);
    setShowThinkingDisplay(true);
    setRealThinking(prev => ({ ...prev, isActive: true }));
    simulateRealTimeThinking();

    // 기존 타이머 정리
    if (thinkingPersistTimer) {
      clearTimeout(thinkingPersistTimer);
    }
  }, [thinkingPersistTimer, simulateRealTimeThinking]);

  const stopThinking = useCallback(
    (query?: string, engine?: string, processingTime?: number) => {
      setIsGenerating(false);
      setRealThinking(prev => ({ ...prev, isActive: false }));

      // 완료된 생각 과정을 저장 (질문과 답변 사이에 표시하기 위해)
      if (query && currentThinkingSteps.length > 0) {
        const messageId = `thinking-${Date.now()}`;
        setCompletedThinkingSteps(prev => ({
          ...prev,
          [messageId]: {
            steps: [...currentThinkingSteps].map(step => ({
              ...step,
              status: 'completed' as const,
            })),
            isExpanded: false, // 기본적으로 접힌 상태
            query,
            engine: engine || 'unknown',
            processingTime: processingTime || 0,
          },
        }));
      }

      // 실시간 표시는 1초 후 숨김
      const timer = setTimeout(() => {
        setShowThinkingDisplay(false);
        setCurrentThinkingSteps([]);
      }, 1000);

      setThinkingPersistTimer(timer);
    },
    [currentThinkingSteps]
  );

  // 완료된 생각 과정 토글
  const toggleCompletedThinking = useCallback((messageId: string) => {
    setCompletedThinkingSteps(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isExpanded: !prev[messageId]?.isExpanded,
      },
    }));
  }, []);

  // 🔧 실제 AI 쿼리 처리 함수 수정
  const processRealAIQuery = async (
    query: string,
    engine: AIMode = 'LOCAL'
  ) => {
    const startTime = Date.now();
    startThinking(); // 생각중 시작

    try {
      console.log(`🤖 실제 AI 쿼리 처리 시작: ${query} (엔진: ${engine})`);

      // API 엔드포인트 호출
      const response = await fetch('/api/mcp/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context: 'ai-sidebar',
          includeThinking: true,
          sessionId: chatSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        const processingTime = Date.now() - startTime;

        // 성공 시 생각 과정을 저장하고 실시간 표시 중단
        setTimeout(
          () => stopThinking(query, data.engine || engine, processingTime),
          500
        );

        return {
          success: true,
          content: data.response,
          confidence: data.confidence || 0.8,
          engine: data.engine || engine,
          processingTime,
          metadata: data.metadata,
        };
      } else {
        stopThinking();
        throw new Error(data.error || 'AI 응답 생성 실패');
      }
    } catch (error) {
      console.error('❌ 실제 AI 쿼리 실패:', error);
      stopThinking();

      return {
        success: false,
        content: `죄송합니다. AI 응답 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        confidence: 0,
        engine: 'error',
        processingTime: Date.now() - startTime,
      };
    }
  };

  // 🤖 자동장애보고서 생성
  const generateAutoReport = async () => {
    if (!autoReportTrigger.shouldGenerate) return;

    try {
      console.log('🤖 자동장애보고서 생성 중...');
      // 자동장애보고서 API 호출
      const response = await fetch('/api/ai/auto-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: autoReportTrigger.lastQuery,
          severity: autoReportTrigger.severity,
          sessionId: chatSessionId,
        }),
      });

      if (response.ok) {
        const reportData = await response.json();
        console.log('✅ 자동장애보고서 생성 완료:', reportData);

        // 보고서를 AI 메시지로 추가
        const reportMessage: ChatMessage = {
          id: `auto-report-${Date.now()}`,
          role: 'assistant',
          content: `📊 **자동 장애 분석 보고서**\n\n${reportData.report}`,
          timestamp: new Date(),
        };

        // 채팅에 추가하는 대신 별도 알림으로 처리
        console.log('📊 자동 보고서 생성됨:', reportMessage);
      }
    } catch (error) {
      console.error('❌ 자동장애보고서 생성 실패:', error);
    } finally {
      setAutoReportTrigger({ shouldGenerate: false });
    }
  };

  // 🎯 AI 모드 변경 핸들러
  const handleModeChange = async (newMode: AIMode) => {
    try {
      setIsGenerating(true);

      setSelectedEngine(newMode);

      // 모드 변경은 로컬 상태만 업데이트
      console.log(`🔄 AI 모드 변경: ${newMode}`);

      // 성공 메시지 추가
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `AI 모드가 ${newMode === 'LOCAL' ? '로컬' : 'Google AI'}로 변경되었습니다.`,
        timestamp: new Date(),
      };

      setLocalChatMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('AI 모드 변경 실패:', error);

      // 에러 메시지 추가
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `AI 모드 변경에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setLocalChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 프리셋 질문 핸들러
  const handlePresetQuestion = async (question: string) => {
    if (isGenerating) return;

    setInputValue(question);
    setIsGenerating(true);

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    // 로컬 메시지에 추가
    setLocalChatMessages(prev => [...prev, userMessage]);

    // AI 처리
    await processRealAIQuery(question, selectedEngine);
    setIsGenerating(false);
  };

  // 🎯 메시지 전송 핸들러
  const handleSendInput = async () => {
    const query = inputValue.trim();
    if (!query || isGenerating) return;

    setIsGenerating(true);

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    // 로컬 메시지에 추가
    setLocalChatMessages(prev => [...prev, userMessage]);

    // 실제 AI 질의 처리
    await processRealAIQuery(query, selectedEngine);

    setInputValue('');
    setIsGenerating(false);
  };

  // 생성 중단
  const stopGeneration = () => {
    setIsGenerating(false);
  };

  // 응답 재생성
  const regenerateResponse = (messageId: string) => {
    const messageToRegenerate = allMessages.find(
      msg => msg.id === messageId && msg.role === 'assistant'
    );
    if (!messageToRegenerate) return;

    // 마지막 사용자 메시지 찾아서 재처리
    const lastUserMessage = allMessages.find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // 기존 AI 메시지 이후의 새로운 응답 생성
      processRealAIQuery(lastUserMessage.content, selectedEngine);
    }
  };

  // Enhanced AI Chat 컴포넌트
  const renderEnhancedAIChat = () => (
    <div className='flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50'>
      {/* 헤더 - 모델 선택 */}
      <div className='p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <Bot className='w-4 h-4 text-white' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-gray-800'>자연어 질의</h3>
              <p className='text-xs text-gray-600'>AI 기반 대화형 인터페이스</p>
            </div>
          </div>

          {/* 모델 선택 드롭다운 */}
          <div className='relative'>
            <button
              onClick={() => setShowEngineInfo(!showEngineInfo)}
              className='flex items-center space-x-2 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs'
            >
              {React.createElement(
                availableEngines.find(e => e.id === selectedEngine)?.icon ||
                  Zap,
                {
                  className: `w-3 h-3 ${availableEngines.find(e => e.id === selectedEngine)?.color}`,
                }
              )}
              <span className='font-medium'>
                {availableEngines.find(e => e.id === selectedEngine)?.name}
              </span>
              <ChevronDown className='w-3 h-3 text-gray-500' />
            </button>

            {/* 엔진 선택 드롭다운 */}
            <AnimatePresence>
              {showEngineInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='absolute top-full right-0 mt-2 w-60 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
                  style={{
                    right: '0',
                    maxWidth: 'calc(100vw - 2rem)',
                    transform: 'translateX(0)',
                  }}
                >
                  <div className='p-3 border-b border-gray-100'>
                    <h4 className='text-xs font-semibold text-gray-800'>
                      AI 모델 선택
                    </h4>
                    <p className='text-xs text-gray-600'>
                      용도에 맞는 AI 엔진을 선택하세요
                    </p>
                  </div>

                  <div className='max-h-48 overflow-y-auto'>
                    {availableEngines.map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => {
                          console.log(
                            `🔧 AI 모드 변경: ${selectedEngine} → ${engine.id}`
                          );
                          setSelectedEngine(engine.id as AIMode);
                          setShowEngineInfo(false);
                        }}
                        className={`w-full p-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          selectedEngine === engine.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className='flex items-start space-x-2'>
                          <div
                            className={`w-6 h-6 rounded ${engine.bgColor} flex items-center justify-center`}
                          >
                            {React.createElement(engine.icon, {
                              className: `w-3 h-3 ${engine.color}`,
                            })}
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2'>
                              <h5 className='text-xs font-medium text-gray-800'>
                                {engine.name}
                              </h5>
                              {engine.usage && (
                                <span className='text-xs text-gray-500'>
                                  {engine.usage.used}/{engine.usage.limit}
                                </span>
                              )}
                            </div>
                            <p className='text-xs text-gray-600 mt-1'>
                              {engine.description}
                            </p>
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {engine.features
                                .slice(0, 2)
                                .map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className='text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded'
                                  >
                                    {feature}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4'>
        {/* 🤖 자동장애보고서 알림 */}
        {autoReportTrigger.shouldGenerate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <FileText className='w-4 h-4 text-red-600' />
                <div>
                  <h4 className='text-sm font-medium text-red-800'>
                    자동장애보고서 생성 준비
                  </h4>
                  <p className='text-xs text-red-600'>
                    &ldquo;{autoReportTrigger.lastQuery}&rdquo;에서{' '}
                    {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                  </p>
                </div>
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={generateAutoReport}
                  className='px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors'
                >
                  생성
                </button>
                <button
                  onClick={() =>
                    setAutoReportTrigger({ shouldGenerate: false })
                  }
                  className='px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors'
                >
                  무시
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {allMessages.length === 0 && (
          <div className='text-center py-8'>
            <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Bot className='w-6 h-6 text-white' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              안녕하세요! 👋
            </h3>
            <p className='text-sm text-gray-500 max-w-[280px] mx-auto'>
              아래 프리셋 질문을 선택하거나 직접 질문을 입력해보세요.
            </p>
          </div>
        )}

        {/* 채팅 메시지들 렌더링 (간소화) */}
        {allMessages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                message.role === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : ''
              }`}
            >
              {/* 아바타 */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className='w-3 h-3' />
                ) : (
                  <Bot className='w-3 h-3' />
                )}
              </div>

              {/* 메시지 콘텐츠 */}
              <div className='flex-1'>
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className='text-sm whitespace-pre-wrap break-words'>
                    {message.content}
                  </div>
                </div>

                {/* 타임스탬프 */}
                <div
                  className={`mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <p className='text-xs text-gray-500'>
                    {typeof message.timestamp === 'string'
                      ? new Date(message.timestamp).toLocaleTimeString()
                      : message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 - 분리된 컴포넌트 사용 */}
      <div className='px-3 space-y-3'>
        {/* AI 모드 선택기 */}
        <AIModeSelector
          selectedMode={selectedEngine}
          onModeChange={handleModeChange}
          disabled={isGenerating}
          className='mb-3'
        />

        <AIPresetQuestions
          onQuestionSelect={handlePresetQuestion}
          currentPage={Math.floor(currentPresetIndex / PRESETS_PER_PAGE)}
          onPageChange={page => setCurrentPresetIndex(page * PRESETS_PER_PAGE)}
        />
      </div>

      {/* 입력 영역 */}
      <div className='p-3 border-t border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-end space-x-2'>
          {/* 텍스트 입력 */}
          <div className='flex-1 relative'>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInput();
                }
              }}
              placeholder='시스템에 대해 질문해보세요... (Shift+Enter로 줄바꿈)'
              className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[36px] max-h-24 text-sm'
              rows={1}
            />
          </div>

          {/* 전송 버튼 */}
          <motion.button
            onClick={() => handleSendInput()}
            disabled={!inputValue.trim()}
            className='p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title='메시지 전송'
            aria-label='메시지 전송'
          >
            <Send className='w-4 h-4' />
          </motion.button>
        </div>

        {/* 키보드 단축키 힌트 */}
        <div className='flex items-center justify-between mt-1 text-xs text-gray-500'>
          <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
          <span>
            {selectedEngine === 'GOOGLE_ONLY' && <>Google AI 사용량: 45/300</>}
          </span>
        </div>
      </div>
    </div>
  );

  // 기능별 페이지 렌더링 - 분리된 컴포넌트 사용
  const renderFunctionPage = () => {
    if (selectedFunction === 'chat') {
      return renderEnhancedAIChat();
    }

    return (
      <AIFunctionPages
        selectedFunction={selectedFunction}
        onFunctionChange={setSelectedFunction}
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          role='dialog'
          aria-labelledby='ai-sidebar-title'
          aria-modal='true'
          className={`fixed top-0 right-0 h-full 
            w-full sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[800px] 
            max-w-[90vw] bg-white shadow-2xl z-30 flex ${className}`}
        >
          {/* 메인 콘텐츠 영역 */}
          <div className='flex-1 flex flex-col min-w-0'>
            {/* 헤더 - 분리된 컴포넌트 사용 */}
            <AISidebarHeader onClose={onClose} />

            {/* 🔧 기능별 페이지 콘텐츠 - 하단 패널 공간 항상 확보 */}
            <div className='flex-1 overflow-hidden pb-20 sm:pb-0'>
              {renderFunctionPage()}
            </div>
          </div>

          {/* 오른쪽 AI 기능 아이콘 패널 - 큰 화면에서만 표시 */}
          <div className='hidden sm:block'>
            <AIAgentIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className='w-16 sm:w-20'
            />
          </div>

          {/* 🔧 모바일용 하단 기능 선택 패널 - 고정 위치로 항상 표시 */}
          <div
            className='sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-2 shadow-lg'
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
              zIndex: 9999,
              transform: 'translateZ(0)',
            }}
          >
            <AIAgentIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className='w-full'
              isMobile={true}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AISidebarV2;
