/**
 * 🎨 AI Sidebar V2 - 도메인 분리 아키텍처 + 아이콘 패널 통합
 *
 * ✅ 오른쪽 AI 기능 아이콘 패널 추가
 * ✅ 기능별 페이지 전환 시스템
 * ✅ 실시간 AI 로그 연동
 * ✅ 도메인 주도 설계(DDD) 적용
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
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  FileText,
  Globe,
  HardDrive,
  RotateCcw,
  Search,
  Send,
  Server,
  Sparkles,
  Target,
  User,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RealAISidebarService } from '../services/RealAISidebarService';

// 분리된 컴포넌트들 import
import { AI_ENGINES } from './AIEngineSelector';
import { AISidebarHeader } from './AISidebarHeader';
import { MCPServerStatusPanel } from './MCPServerStatusPanel';

// AI 기능 아이콘 패널 및 페이지 컴포넌트들
import AIAgentIconPanel, {
  AIAgentFunction,
} from '@/components/ai/AIAgentIconPanel';
import AutoReportPage from '@/components/ai/pages/AutoReportPage';
import IntelligentMonitoringPage from '@/components/ai/pages/IntelligentMonitoringPage';
import { GoogleAIStatusCard } from '@/components/shared/GoogleAIStatusCard';

// Enhanced AI Chat 관련 타입들
interface AIEngine {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  features: string[];
  usage?: {
    used: number;
    limit: number;
    resetTime?: string;
  };
  status: 'ready' | 'loading' | 'error' | 'disabled';
}

// interface UploadedFile {
//   id: string;
//   name: string;
//   type: string;
//   size: number;
//   content?: string;
//   preview?: string;
// }
// TODO: 향후 문서/로그 파일 업로드 분석 기능 개발 예정

interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  engine?: string;
  confidence?: number;
  // files?: UploadedFile[]; // TODO: 향후 파일 첨부 기능 개발 예정
}

interface ThinkingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

// AI_ENGINES는 이제 AIEngineSelector에서 import됨

// 프리셋 질문 목록 (기존 유지)
const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: '1',
    text: '현재 서버 상태는 어떤가요?',
    category: '상태 확인',
    icon: Cpu,
    color: 'bg-blue-500',
  },
  {
    id: '2',
    text: 'CPU 사용률이 높은 서버를 찾아주세요',
    category: '성능 분석',
    icon: Zap,
    color: 'bg-red-500',
  },
  {
    id: '3',
    text: '메모리 부족 경고가 있나요?',
    category: '리소스 모니터링',
    icon: Brain,
    color: 'bg-yellow-500',
  },
  {
    id: '4',
    text: '네트워크 지연이 발생하고 있나요?',
    category: '네트워크 진단',
    icon: Globe,
    color: 'bg-green-500',
  },
  {
    id: '5',
    text: '최근 에러 로그를 분석해주세요',
    category: '로그 분석',
    icon: FileText,
    color: 'bg-purple-500',
  },
  {
    id: '6',
    text: '시스템 최적화 방안을 제안해주세요',
    category: '최적화',
    icon: Sparkles,
    color: 'bg-pink-500',
  },
  {
    id: '7',
    text: '디스크 사용량이 임계치에 도달했나요?',
    category: '스토리지',
    icon: HardDrive,
    color: 'bg-indigo-500',
  },
  {
    id: '8',
    text: '데이터베이스 연결 상태를 확인해주세요',
    category: '데이터베이스',
    icon: Database,
    color: 'bg-teal-500',
  },
];

interface AISidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AISidebarV2: React.FC<AISidebarV2Props> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  // 실제 AI 서비스 인스턴스
  const aiService = new RealAISidebarService();

  // UI 상태
  const [inputValue, setInputValue] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [selectedFunction, setSelectedFunction] =
    useState<AIAgentFunction>('chat');

  // Enhanced Chat 상태 (messages는 useAIChat에서 관리)
  const [selectedEngine, setSelectedEngine] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  // const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]); // TODO: 향후 파일 업로드 기능
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);

  // 프리셋 질문 네비게이션 상태
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
  const PRESETS_PER_PAGE = 4;

  // 도메인 훅들 사용
  const { setOpen } = useAISidebarStore();
  const {
    isThinking,
    currentQuestion,
    logs,
    setThinking,
    setCurrentQuestion,
    addLog,
    clearLogs,
  } = useAIThinking();

  // 새로운 useAIChat 훅 사용
  const {
    messages: chatMessages,
    sendMessage,
    clearMessages,
    isLoading: isChatLoading,
    error: chatError,
    sessionId: chatSessionId,
  } = useAIChat({
    apiEndpoint: '/api/ai/smart-fallback',
    sessionId: currentSessionId,
  });

  // 🧠 실제 생각하기 기능 상태
  const [realThinking, setRealThinking] = useState<{
    isActive: boolean;
    steps: ThinkingStep[];
    currentStep?: string;
  }>({
    isActive: false,
    steps: [],
  });

  // 🤖 자동장애보고서 연결 상태
  const [autoReportTrigger, setAutoReportTrigger] = useState<{
    shouldGenerate: boolean;
    lastQuery?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }>({
    shouldGenerate: false,
  });

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
    sessionId: currentSessionId,
    mode: 'sidebar',
    maxLogs: 30,
  });

  // 빠른 질문 가져오기 (실제 서비스에서)
  const quickQuestions = aiService.getQuickQuestions();

  // 프리셋 질문 네비게이션 함수
  const getCurrentPresets = () => {
    const startIndex = currentPresetIndex;
    const endIndex = startIndex + PRESETS_PER_PAGE;
    return PRESET_QUESTIONS.slice(startIndex, endIndex);
  };

  const goToPreviousPresets = () => {
    setCurrentPresetIndex(prev =>
      prev - PRESETS_PER_PAGE >= 0 ? prev - PRESETS_PER_PAGE : 0
    );
  };

  const goToNextPresets = () => {
    setCurrentPresetIndex(prev =>
      prev + PRESETS_PER_PAGE < PRESET_QUESTIONS.length
        ? prev + PRESETS_PER_PAGE
        : prev
    );
  };

  const canGoPrevious = currentPresetIndex > 0;
  const canGoNext =
    currentPresetIndex + PRESETS_PER_PAGE < PRESET_QUESTIONS.length;

  // 아이콘 매핑
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Server,
      Search,
      BarChart3,
      Target,
    };
    return icons[iconName] || Server;
  };

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
    }
  }, [isGenerating, simulateRealTimeThinking]);

  // AI 응답 생성 (엔진별 차별화)
  const generateAIResponse = (query: string, engine: string): string => {
    const responses = {
      auto: `[AUTO 모드] ${query}에 대한 종합 분석 결과입니다. 여러 AI 엔진을 조합하여 최적의 답변을 제공합니다.`,
      'google-ai': `[Google AI] ${query}에 대한 창의적이고 자연스러운 응답입니다. Gemini 모델의 고급 언어 이해 능력을 활용했습니다.`,
      internal: `[Internal] ${query}에 대한 빠른 내부 분석 결과입니다. MCP, RAG, ML 엔진을 활용하여 프라이버시를 보장하며 응답했습니다.`,
    };
    return responses[engine as keyof typeof responses] || responses.auto;
  };

  // 🤖 실제 AI 자연어 질의 처리 (SimplifiedNaturalLanguageEngine 연동)
  const processRealAIQuery = async (query: string, engine: string = 'auto') => {
    console.log(`🚀 AI 질의 처리 시작: "${query}" (모드: ${engine})`);

    if (!query.trim()) return { success: false, message: 'Empty query' };

    setIsGenerating(true);
    setThinkingStartTime(new Date());

    // 실시간 사고 과정 시뮬레이션 시작
    simulateRealTimeThinking();

    try {
      const response = await fetch('/api/ai/smart-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          mode: engine,
          options: {
            enableThinking: true,
            enableAutoReport: true,
            fastMode: true,
            timeout: 10000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `✅ AI 응답 수신: 엔진=${data.engine}, 모드=${data.mode}, 성공=${data.success}`
      );

      if (data.success) {
        // 사고 과정 데이터 생성 (완료된 단계들)
        const thinkingSteps: ThinkingStep[] = [
          {
            id: '1',
            step: 1,
            title: '질문 분석',
            description: '사용자의 질문을 이해하고 의도를 파악했습니다.',
            status: 'completed',
            duration: 1200,
          },
          {
            id: '2',
            step: 2,
            title: '데이터 수집',
            description: '관련 정보를 수집하고 분석했습니다.',
            status: 'completed',
            duration: 800,
          },
          {
            id: '3',
            step: 3,
            title: '분석 및 추론',
            description: '수집된 데이터를 바탕으로 분석했습니다.',
            status: 'completed',
            duration: 1500,
          },
          {
            id: '4',
            step: 4,
            title: '답변 생성',
            description: '최적의 답변을 생성했습니다.',
            status: 'completed',
            duration: 600,
          },
        ];

        // 채팅 메시지에 추가 (단순화된 방식)
        await sendMessage(query);

        addLog({
          type: 'success',
          message: `AI 응답 완료: ${data.engine} (신뢰도: ${(data.confidence * 100).toFixed(0)}%)`,
          metadata: {
            engine: data.engine,
            confidence: data.confidence,
            processingTime: data.metadata?.processingTime || 0,
          },
        });

        // 자동 보고서 생성 트리거 (심각도 높은 경우)
        if (
          data.confidence < 0.7 ||
          query.includes('오류') ||
          query.includes('문제')
        ) {
          setAutoReportTrigger({
            shouldGenerate: true,
            lastQuery: query,
            severity: data.confidence < 0.5 ? 'critical' : 'medium',
          });
        }

        return { success: true, data };
      } else {
        throw new Error(data.message || 'AI 응답 생성 실패');
      }
    } catch (error) {
      console.error('❌ AI 질의 처리 실패:', error);

      await sendMessage(query);

      addLog({
        type: 'error',
        message: `AI 질의 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        metadata: { error: String(error) },
      });

      return { success: false, error: String(error) };
    } finally {
      setIsGenerating(false);
      setThinkingStartTime(null);
      setCurrentThinkingSteps([]);
    }
  };

  // 🤖 자동장애보고서 생성 함수
  const generateAutoReport = async () => {
    if (!autoReportTrigger.shouldGenerate) return;

    try {
      const response = await fetch('/api/ai/auto-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'ai_query',
          query: autoReportTrigger.lastQuery,
          severity: autoReportTrigger.severity,
          sessionId: currentSessionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 자동장애보고서 페이지로 전환
        setSelectedFunction('auto-report');

        // 트리거 상태 초기화
        setAutoReportTrigger({
          shouldGenerate: false,
        });

        return result;
      }
    } catch (error) {
      console.error('❌ 자동장애보고서 생성 오류:', error);
    }
  };

  // 프리셋 질문 핸들러 (실제 AI API 연동)
  const handlePresetQuestion = async (question: string) => {
    setInputValue(question);

    // 🤖 실제 AI 질의 처리
    const result = await processRealAIQuery(question, selectedEngine);

    if (result.success) {
      // useAIChat의 sendMessage 사용
      await sendMessage(question);
    }
  };

  // 입력 전송 핸들러 (실제 AI API 연동)
  const handleSendInput = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const query = inputValue.trim();
    setInputValue('');

    // 🤖 실제 AI 질의 처리
    const result = await processRealAIQuery(query, selectedEngine);

    if (result.success) {
      // useAIChat의 sendMessage 사용
      await sendMessage(query);

      // 🤖 자동장애보고서 트리거 확인
      if (autoReportTrigger.shouldGenerate) {
        setTimeout(() => {
          generateAutoReport();
        }, 2000); // 2초 후 자동장애보고서 생성
      }
    }
  };

  // 생성 중단
  const stopGeneration = () => {
    setIsGenerating(false);
  };

  // 응답 재생성
  const regenerateResponse = (messageId: string) => {
    const messageToRegenerate = chatMessages.find(
      msg => msg.id === messageId && msg.type === 'ai'
    );
    if (!messageToRegenerate) return;

    // 마지막 사용자 메시지 찾아서 재처리
    const lastUserMessage = chatMessages.find(msg => msg.type === 'user');
    if (lastUserMessage) {
      // 기존 AI 메시지 이후의 새로운 응답 생성
      sendMessage(lastUserMessage.content);
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
                AI_ENGINES.find(e => e.id === selectedEngine)?.icon || Zap,
                {
                  className: `w-3 h-3 ${AI_ENGINES.find(e => e.id === selectedEngine)?.color}`,
                }
              )}
              <span className='font-medium'>
                {AI_ENGINES.find(e => e.id === selectedEngine)?.name}
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
                    {AI_ENGINES.map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => {
                          console.log(
                            `🔧 AI 모드 변경: ${selectedEngine} → ${engine.id}`
                          );
                          setSelectedEngine(engine.id);
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

        {chatMessages.length === 0 && (
          <div className='text-center py-8'>
            <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Sparkles className='w-6 h-6 text-white' />
            </div>
            <h4 className='text-sm font-semibold text-gray-800 mb-2'>
              자연어 질의에 오신 것을 환영합니다!
            </h4>
            <p className='text-xs text-gray-600 mb-4'>
              아래 프리셋 질문을 선택하거나 직접 질문을 입력해보세요.
            </p>
          </div>
        )}

        {chatMessages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                message.type === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : ''
              }`}
            >
              {/* 아바타 */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className='w-3 h-3' />
                ) : (
                  <Bot className='w-3 h-3' />
                )}
              </div>

              {/* 메시지 콘텐츠 */}
              <div className='flex-1'>
                {/* AI 사고 과정 (실시간 표시) */}
                {message.type === 'ai' &&
                  (realThinking.isActive || realThinking.steps.length > 0) && (
                    <div className='mb-2'>
                      <button
                        onClick={() =>
                          setExpandedThinking(
                            expandedThinking === 'real-thinking'
                              ? null
                              : 'real-thinking'
                          )
                        }
                        className='flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors'
                      >
                        <Brain
                          className={`w-3 h-3 ${realThinking.isActive ? 'animate-pulse text-purple-600' : 'text-gray-600'}`}
                        />
                        <span>
                          🤔 AI 생각 과정{' '}
                          {realThinking.isActive ? '(진행 중)' : '(완료)'}
                        </span>
                        {expandedThinking === 'real-thinking' ? (
                          <ChevronUp className='w-3 h-3' />
                        ) : (
                          <ChevronDown className='w-3 h-3' />
                        )}
                      </button>

                      {/* 실제 생각하기 과정 표시 */}
                      {expandedThinking === 'real-thinking' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className='mt-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3'
                        >
                          <div className='space-y-2'>
                            {realThinking.steps.map((step, index) => (
                              <div key={step.id} className='space-y-1'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-xs font-medium text-gray-700'>
                                    {step.title}
                                  </span>
                                  <div className='flex items-center space-x-1'>
                                    {step.status === 'processing' && (
                                      <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                                    )}
                                    {step.status === 'completed' && (
                                      <div className='w-2 h-2 bg-green-500 rounded-full' />
                                    )}
                                    {step.duration && (
                                      <span className='text-xs text-gray-500'>
                                        {step.duration}ms
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className='text-xs text-gray-600'>
                                  {step.description}
                                </p>
                                {step.status === 'processing' && (
                                  <div className='w-full bg-gray-200 rounded-full h-1'>
                                    <div className='bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full animate-pulse w-3/4' />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                {/* AI 메시지의 사고 과정 표시 */}
                {message.type === 'ai' &&
                  message.thinking &&
                  message.thinking.length > 0 && (
                    <div className='mb-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center space-x-2'>
                          <Brain className='w-3 h-3 text-gray-500' />
                          <span className='text-xs font-medium text-gray-600'>
                            사고 과정
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            // 메시지별 사고 과정 표시 토글 상태 관리
                            const expandedKey = `thinking_${message.id}`;
                            const isExpanded =
                              localStorage.getItem(expandedKey) === 'true';
                            localStorage.setItem(
                              expandedKey,
                              String(!isExpanded)
                            );
                            // 강제 리렌더링
                            setIsThinkingExpanded(!isThinkingExpanded);
                          }}
                          className='p-1 hover:bg-gray-100 rounded transition-colors'
                          title='사고 과정 토글'
                        >
                          {localStorage.getItem(`thinking_${message.id}`) !==
                          'false' ? (
                            <ChevronUp className='w-3 h-3 text-gray-500' />
                          ) : (
                            <ChevronDown className='w-3 h-3 text-gray-500' />
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {localStorage.getItem(`thinking_${message.id}`) !==
                          'false' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='space-y-1'
                          >
                            {message.thinking.map((step, index) => (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-2 rounded border-l-2 ${
                                  (step as any).status === 'completed'
                                    ? 'bg-green-50 border-l-green-400'
                                    : (step as any).status === 'processing'
                                      ? 'bg-blue-50 border-l-blue-400'
                                      : 'bg-gray-50 border-l-gray-300'
                                }`}
                              >
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center space-x-2'>
                                    <div
                                      className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                        (step as any).status === 'completed'
                                          ? 'bg-green-400'
                                          : (step as any).status ===
                                              'processing'
                                            ? 'bg-blue-400'
                                            : 'bg-gray-300'
                                      }`}
                                    >
                                      {(step as any).status === 'completed' ? (
                                        <CheckCircle className='w-2 h-2 text-white' />
                                      ) : (step as any).status ===
                                        'processing' ? (
                                        <div className='w-1.5 h-1.5 bg-white rounded-full animate-pulse' />
                                      ) : (
                                        <Clock className='w-2 h-2 text-white' />
                                      )}
                                    </div>
                                    <span className='text-xs font-medium text-gray-700'>
                                      {step.step}. {step.title}
                                    </span>
                                  </div>
                                  {step.duration && (
                                    <span className='text-xs text-gray-500'>
                                      {(step.duration / 1000).toFixed(1)}초
                                    </span>
                                  )}
                                </div>
                                <p className='text-xs text-gray-600 ml-5 mt-1'>
                                  {step.description}
                                </p>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                {/* 메시지 버블 */}
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {/* 파일 첨부 (사용자 메시지만) */}
                  {message.type === 'user' && message.files && (
                    <div className='mb-2 space-y-1'>
                      {message.files.map(file => (
                        <div
                          key={file.id}
                          className='flex items-center space-x-1 text-xs bg-blue-400 bg-opacity-50 rounded px-2 py-1'
                        >
                          <FileText className='w-3 h-3' />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className='text-sm whitespace-pre-wrap'>
                    {message.content}
                  </p>

                  {/* AI 메시지 메타데이터 */}
                  {message.type === 'ai' && (
                    <div className='flex items-center justify-between mt-2 pt-2 border-t border-gray-100'>
                      <div className='flex items-center space-x-2 text-xs text-gray-500'>
                        <span>엔진: {message.engine}</span>
                        {message.confidence && (
                          <span>
                            신뢰도: {(message.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className='flex items-center space-x-1'>
                        <button
                          onClick={() => regenerateResponse(message.id)}
                          className='p-1 hover:bg-gray-100 rounded transition-colors'
                          title='답변 재생성'
                        >
                          <RotateCcw className='w-3 h-3 text-gray-500' />
                        </button>
                      </div>
                    </div>
                  )}

                  <p
                    className={`text-xs mt-1 ${
                      message.type === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {typeof message.timestamp === 'string'
                      ? new Date(message.timestamp).toLocaleTimeString()
                      : message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* 생성 중 표시 - 사고 과정 시각화 */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex justify-start'
          >
            <div className='flex items-start space-x-2 max-w-[90%]'>
              <div className='w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <Bot className='w-3 h-3 text-white' />
              </div>

              <div className='bg-white border border-gray-200 rounded-lg p-3 w-full'>
                {/* 헤더 */}
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-2'>
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce'></div>
                      <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100'></div>
                      <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200'></div>
                    </div>
                    <span className='text-sm font-medium text-gray-700'>
                      AI가 생각하고 있습니다...
                    </span>
                    {thinkingStartTime && (
                      <span className='text-xs text-gray-500'>
                        {Math.floor(
                          (Date.now() - thinkingStartTime.getTime()) / 1000
                        )}
                        초
                      </span>
                    )}
                  </div>

                  <div className='flex items-center space-x-1'>
                    <button
                      onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                      className='p-1 hover:bg-gray-100 rounded transition-colors'
                      title={
                        isThinkingExpanded
                          ? '사고 과정 접기'
                          : '사고 과정 펼치기'
                      }
                    >
                      {isThinkingExpanded ? (
                        <ChevronUp className='w-3 h-3 text-gray-500' />
                      ) : (
                        <ChevronDown className='w-3 h-3 text-gray-500' />
                      )}
                    </button>
                    <button
                      onClick={stopGeneration}
                      className='p-1 hover:bg-gray-100 rounded transition-colors'
                      title='생성 중단'
                    >
                      <X className='w-3 h-3 text-gray-500' />
                    </button>
                  </div>
                </div>

                {/* 사고 과정 단계들 */}
                <AnimatePresence>
                  {isThinkingExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='space-y-2'
                    >
                      {currentThinkingSteps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-2 rounded-lg border-l-3 ${
                            step.status === 'completed'
                              ? 'bg-green-50 border-l-green-500'
                              : step.status === 'processing'
                                ? 'bg-blue-50 border-l-blue-500'
                                : 'bg-gray-50 border-l-gray-300'
                          }`}
                        >
                          <div className='flex items-center justify-between mb-1'>
                            <div className='flex items-center space-x-2'>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  step.status === 'completed'
                                    ? 'bg-green-500'
                                    : step.status === 'processing'
                                      ? 'bg-blue-500'
                                      : 'bg-gray-300'
                                }`}
                              >
                                {step.status === 'completed' ? (
                                  <CheckCircle className='w-2 h-2 text-white' />
                                ) : step.status === 'processing' ? (
                                  <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
                                ) : (
                                  <Clock className='w-2 h-2 text-white' />
                                )}
                              </div>
                              <span className='text-xs font-medium text-gray-700'>
                                {step.step}단계: {step.title}
                              </span>
                            </div>
                            {step.duration && (
                              <span className='text-xs text-gray-500'>
                                {(step.duration / 1000).toFixed(1)}초
                              </span>
                            )}
                          </div>

                          <p className='text-xs text-gray-600 ml-6'>
                            {step.description}
                          </p>

                          {step.status === 'processing' && (
                            <div className='w-full bg-gray-200 rounded-full h-1 mt-2 ml-6'>
                              <div className='bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full animate-pulse w-2/3' />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 접힌 상태일 때 요약 정보 */}
                {!isThinkingExpanded && currentThinkingSteps.length > 0 && (
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span>
                      {
                        currentThinkingSteps.filter(
                          s => s.status === 'completed'
                        ).length
                      }
                      /{currentThinkingSteps.length} 단계 완료
                    </span>
                    <span>
                      현재:{' '}
                      {currentThinkingSteps.find(s => s.status === 'processing')
                        ?.title || '대기 중'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 카드 (4개씩 표시 + 네비게이션) */}
      {chatMessages.length === 0 && (
        <div className='px-3 pb-3'>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='text-xs font-medium text-gray-700'>빠른 질문</h4>
            <div className='flex items-center space-x-1'>
              <button
                onClick={goToPreviousPresets}
                disabled={!canGoPrevious}
                className='p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title='이전 질문들'
              >
                <ChevronLeft className='w-3 h-3 text-gray-500' />
              </button>
              <span className='text-xs text-gray-500'>
                {Math.floor(currentPresetIndex / PRESETS_PER_PAGE) + 1}/
                {Math.ceil(PRESET_QUESTIONS.length / PRESETS_PER_PAGE)}
              </span>
              <button
                onClick={goToNextPresets}
                disabled={!canGoNext}
                className='p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title='다음 질문들'
              >
                <ChevronRight className='w-3 h-3 text-gray-500' />
              </button>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            {getCurrentPresets().map(question => (
              <motion.button
                key={question.id}
                onClick={() => handlePresetQuestion(question.text)}
                className='p-2 bg-white rounded border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex items-center space-x-1 mb-1'>
                  <div
                    className={`w-4 h-4 ${question.color} rounded flex items-center justify-center`}
                  >
                    {React.createElement(question.icon, {
                      className: 'w-2 h-2 text-white',
                    })}
                  </div>
                  <span className='text-xs text-gray-500'>
                    {question.category}
                  </span>
                </div>
                <p className='text-xs text-gray-800 line-clamp-2'>
                  {question.text}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

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
            {selectedEngine === 'google-ai' && <>Google AI 사용량: 45/300</>}
          </span>
        </div>
      </div>
    </div>
  );

  // 기능별 페이지 렌더링
  const renderFunctionPage = () => {
    if (!selectedFunction) return null;

    switch (selectedFunction) {
      case 'chat':
        return renderEnhancedAIChat();
      case 'auto-report':
        return <AutoReportPage />;
      case 'intelligent-monitoring':
        return <IntelligentMonitoringPage />;
      case 'advanced-management':
        return (
          <div className='flex flex-col h-full p-4 bg-gray-50'>
            <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Brain className='w-6 h-6 text-purple-600' />
              AI 고급 관리
            </h2>
            <div className='grid grid-cols-1 gap-4 flex-1'>
              {/* 🚀 MCP 서버 상태 섹션 (새로 추가) */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                  <Server className='w-5 h-5 text-green-600' />
                  MCP 서버 상태
                </h3>
                <MCPServerStatusPanel />
              </div>

              {/* AI 분석 도구 섹션 (간소화) */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                  <Target className='w-5 h-5 text-blue-600' />
                  AI 분석 도구
                </h3>
                <div className='space-y-3'>
                  <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center gap-2 text-blue-800 font-medium text-sm'>
                      <FileText className='w-4 h-4' />
                      자동 장애보고서
                    </div>
                    <p className='text-blue-700 text-xs mt-1'>
                      서버 데이터 기반 AI 장애 분석 및 보고서 생성
                    </p>
                  </div>
                  <div className='p-3 bg-emerald-50 rounded-lg border border-emerald-200'>
                    <div className='flex items-center gap-2 text-emerald-800 font-medium text-sm'>
                      <Brain className='w-4 h-4' />
                      지능형 모니터링
                    </div>
                    <p className='text-emerald-700 text-xs mt-1'>
                      이상탐지 + 근본원인분석 + 예측모니터링 (백엔드 전용)
                    </p>
                  </div>
                </div>
              </div>

              {/* Google AI 상태 섹션 */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                  <Globe className='w-5 h-5 text-green-600' />
                  Google AI 상태
                </h3>
                <GoogleAIStatusCard variant='dashboard' showDetails={false} />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='flex items-center justify-center h-full text-gray-500'>
            선택된 기능을 찾을 수 없습니다.
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
