/**
 * 🎨 AI Sidebar V2 - 도메인 분리 아키텍처 + 아이콘 패널 통합
 *
 * ✅ 오른쪽 AI 기능 아이콘 패널 추가
 * ✅ 기능별 페이지 전환 시스템
 * ✅ 실시간 AI 로그 연동
 * ✅ 도메인 주도 설계(DDD) 적용
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Brain,
  Send,
  Server,
  Search,
  BarChart3,
  Target,
  User,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Square,
  RotateCcw,
  Paperclip,
  Zap,
  Database,
  Globe,
  Cpu,
  FileText,
  ChevronLeft,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { useAIThinking } from '@/modules/ai-sidebar/hooks/useAIThinking';
import { useAIChat } from '@/modules/ai-sidebar/hooks/useAIChat';
import { useRealTimeAILogs } from '@/hooks/useRealTimeAILogs';
import { RealAISidebarService } from '../services/RealAISidebarService';
import BasicTyping from '@/components/ui/BasicTyping';

// AI 기능 아이콘 패널 및 페이지 컴포넌트들
import AIAgentIconPanel, {
  AIAgentFunction,
} from '@/components/ai/AIAgentIconPanel';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
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

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  engine?: string;
  confidence?: number;
  files?: UploadedFile[];
}

interface ThinkingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  preview?: string;
}

interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

// AI 엔진 목록 (3개로 축소)
const AI_ENGINES: AIEngine[] = [
  {
    id: 'auto',
    name: 'AUTO',
    description: '자동으로 최적 모델 조합 선택 (기본값)',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['지능형 라우팅', '최적 성능', '자동 폴백'],
    status: 'ready',
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    description: 'Google AI Studio (Gemini) 전용 모드',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['자연어 전문', '창의적 응답', '다국어 지원'],
    usage: {
      used: 45,
      limit: 300,
      resetTime: '24시간',
    },
    status: 'ready',
  },
  {
    id: 'internal',
    name: 'Internal',
    description: 'MCP + RAG + ML 내부 엔진만 사용',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['빠른 응답', '오프라인 지원', '프라이버시'],
    status: 'ready',
  },
];

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

  // Enhanced Chat 상태
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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
  const { responses, addResponse, clearResponses } = useAIChat({
    apiEndpoint: '/api/ai/smart-fallback',
    sessionId: currentSessionId,
  });

  // 스크롤 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  }, [messages]);

  // AI 사고 과정 시뮬레이션
  const simulateThinking = (): ThinkingStep[] => {
    const steps = [
      {
        id: '1',
        step: 1,
        title: '서버 메트릭 분석',
        description: 'CPU 75%, 메모리 68% 확인',
        status: 'completed' as const,
        duration: 1200,
      },
      {
        id: '2',
        step: 2,
        title: '패턴 인식',
        description: '비정상적인 트래픽 패턴 감지',
        status: 'completed' as const,
        duration: 800,
      },
      {
        id: '3',
        step: 3,
        title: '해결책 도출',
        description: '최적화 방안 3가지 생성',
        status: 'completed' as const,
        duration: 1500,
      },
    ];
    return steps;
  };

  // AI 응답 생성 (엔진별 차별화)
  const generateAIResponse = (query: string, engine: string): string => {
    const responses = {
      auto: `[AUTO 모드] ${query}에 대한 종합 분석 결과입니다. 여러 AI 엔진을 조합하여 최적의 답변을 제공합니다.`,
      'google-ai': `[Google AI] ${query}에 대한 창의적이고 자연스러운 응답입니다. Gemini 모델의 고급 언어 이해 능력을 활용했습니다.`,
      internal: `[Internal] ${query}에 대한 빠른 내부 분석 결과입니다. MCP, RAG, ML 엔진을 활용하여 프라이버시를 보장하며 응답했습니다.`,
    };
    return responses[engine as keyof typeof responses] || responses.auto;
  };

  // 메시지 전송 핸들러 (실제 AI API 호출)
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputValue.trim();

    if (!messageToSend && uploadedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customMessage) {
      setInputValue('');
    }
    setUploadedFiles([]);
    setIsGenerating(true);

    try {
      // 🚀 실제 AI API 호출
      const response = await fetch('/api/ai/smart-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: messageToSend,
          engine: selectedEngine,
          sessionId: currentSessionId,
          options: {
            enableThinking: true,
            useCache: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      // 실제 AI 사고 과정 생성
      const thinkingSteps: ThinkingStep[] = data.thinking || [
        {
          id: '1',
          step: 1,
          title: '질문 분석',
          description: `"${messageToSend}" 질문을 분석하고 있습니다`,
          status: 'completed' as const,
          duration: 800,
        },
        {
          id: '2',
          step: 2,
          title: '데이터 수집',
          description: '관련 서버 메트릭과 시스템 상태를 수집합니다',
          status: 'completed' as const,
          duration: 1200,
        },
        {
          id: '3',
          step: 3,
          title: '응답 생성',
          description: 'AI 엔진을 통해 최적의 답변을 생성합니다',
          status: 'completed' as const,
          duration: 1500,
        },
      ];

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content:
          data.response ||
          data.answer ||
          `[${selectedEngine.toUpperCase()}] ${messageToSend}에 대한 분석 결과를 제공합니다. 현재 시스템 상태를 기반으로 답변을 생성했습니다.`,
        timestamp: new Date(),
        thinking: thinkingSteps,
        engine: AI_ENGINES.find(e => e.id === selectedEngine)?.name || 'AUTO',
        confidence: data.confidence || Math.random() * 0.3 + 0.7,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI 응답 생성 실패:', error);

      // 폴백 응답
      const fallbackMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: `죄송합니다. 현재 AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.\n\n질문: "${messageToSend}"\n\n기본 응답: 시스템 상태를 확인하고 있습니다. 대시보드에서 실시간 메트릭을 확인해보세요.`,
        timestamp: new Date(),
        engine: 'Fallback',
        confidence: 0.5,
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 프리셋 질문 핸들러 (즉시 전송)
  const handlePresetQuestion = (question: string) => {
    // 🎯 직접 메시지 전송 (상태 업데이트 타이밍 문제 해결)
    handleSendMessage(question);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // 파일 제거
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // 생성 중단
  const stopGeneration = () => {
    setIsGenerating(false);
  };

  // 응답 재생성
  const regenerateResponse = (messageId: string) => {
    // 구현 예정
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
      <div className='flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 sm:space-y-4'>
        {messages.length === 0 && (
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

        {messages.map(message => (
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
                {/* AI 사고 과정 (AI 메시지만) */}
                {message.type === 'ai' && message.thinking && (
                  <div className='mb-2'>
                    <button
                      onClick={() =>
                        setExpandedThinking(
                          expandedThinking === message.id ? null : message.id
                        )
                      }
                      className='flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors'
                    >
                      <Brain className='w-3 h-3' />
                      <span>🤔 AI 생각 과정</span>
                      {expandedThinking === message.id ? (
                        <ChevronUp className='w-3 h-3' />
                      ) : (
                        <ChevronDown className='w-3 h-3' />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedThinking === message.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className='mt-1 p-2 bg-gray-50 rounded border border-gray-200'
                        >
                          <div className='space-y-1'>
                            {message.thinking.map(step => (
                              <div
                                key={step.id}
                                className='flex items-center space-x-2'
                              >
                                <div className='w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium'>
                                  {step.step}
                                </div>
                                <div className='flex-1'>
                                  <div className='text-xs font-medium text-gray-800'>
                                    {step.title}
                                  </div>
                                  <div className='text-xs text-gray-600'>
                                    {step.description}
                                  </div>
                                </div>
                                <div className='text-xs text-gray-500'>
                                  {step.duration}ms
                                </div>
                              </div>
                            ))}
                          </div>
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
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* 생성 중 표시 */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex justify-start'
          >
            <div className='flex items-start space-x-2 max-w-[85%]'>
              <div className='w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <Bot className='w-3 h-3 text-white' />
              </div>
              <div className='bg-white border border-gray-200 rounded-lg p-3'>
                <div className='flex items-center space-x-2'>
                  <div className='flex space-x-1'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100'></div>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200'></div>
                  </div>
                  <span className='text-xs text-gray-600'>
                    AI가 생각하고 있습니다...
                  </span>
                  <button
                    onClick={stopGeneration}
                    className='p-1 hover:bg-gray-100 rounded transition-colors'
                    title='생성 중단'
                  >
                    <X className='w-3 h-3 text-gray-500' />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 카드 (4개씩 표시 + 네비게이션) */}
      {messages.length === 0 && (
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

      {/* 파일 업로드 영역 */}
      {uploadedFiles.length > 0 && (
        <div className='px-3 pb-2'>
          <div className='flex flex-wrap gap-1'>
            {uploadedFiles.map(file => (
              <div
                key={file.id}
                className='flex items-center space-x-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded'
              >
                <FileText className='w-3 h-3 text-blue-600' />
                <span className='text-xs text-blue-800'>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className='p-0.5 hover:bg-blue-100 rounded transition-colors'
                  title={`${file.name} 파일 제거`}
                  aria-label={`${file.name} 파일 제거`}
                >
                  <X className='w-2 h-2 text-blue-600' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className='p-3 border-t border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-end space-x-2'>
          {/* 파일 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors'
            title='파일 첨부'
          >
            <Paperclip className='w-4 h-4' />
          </button>

          {/* 텍스트 입력 */}
          <div className='flex-1 relative'>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder='시스템에 대해 질문해보세요... (Shift+Enter로 줄바꿈)'
              className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[36px] max-h-24 text-sm'
              rows={1}
            />
          </div>

          {/* 전송 버튼 */}
          <motion.button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() && uploadedFiles.length === 0}
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

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept='.txt,.md,.json,.csv,.log,.yaml,.toml,.ini,.xml,.html,.jpg,.png,.webp'
        onChange={handleFileUpload}
        className='hidden'
        title='파일 선택'
        aria-label='파일 선택'
      />
    </div>
  );

  // 기능별 페이지 렌더링
  const renderFunctionPage = () => {
    if (!selectedFunction) return null;

    switch (selectedFunction) {
      case 'chat':
        return renderEnhancedAIChat();
      case 'auto-report':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50'>
            <div className='text-center'>
              <BarChart3 className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                자동 리포트
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'prediction':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-violet-50'>
            <div className='text-center'>
              <Target className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                예측 분석
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'advanced-management':
        return (
          <div className='flex flex-col h-full p-4 bg-gray-50'>
            <h2 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <Brain className='w-6 h-6 text-purple-600' />
              AI 고급 관리
            </h2>
            <div className='grid grid-cols-1 gap-4 flex-1'>
              {/* AI 인사이트 섹션 */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3'>
                  AI 인사이트
                </h3>
                <AIInsightsCard
                  className='shadow-none border-0 p-0'
                  showRecommendations={true}
                />
              </div>

              {/* Google AI 상태 섹션 */}
              <div className='bg-white rounded-lg p-4 shadow-sm border'>
                <h3 className='text-lg font-semibold text-gray-700 mb-3'>
                  Google AI 연결 상태
                </h3>
                <GoogleAIStatusCard
                  className='shadow-none border-0 p-0'
                  showDetails={true}
                  variant='admin'
                />
              </div>
            </div>
          </div>
        );
      case 'pattern-analysis':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50'>
            <div className='text-center'>
              <BarChart3 className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                패턴 분석
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'log-analysis':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-indigo-50 to-blue-50'>
            <div className='text-center'>
              <Search className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>
                로그 분석
              </h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'thinking':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-pink-50 to-rose-50'>
            <div className='text-center'>
              <Brain className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>AI 사고</h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
            </div>
          </div>
        );
      case 'optimization':
        return (
          <div className='flex items-center justify-center h-full bg-gradient-to-br from-yellow-50 to-orange-50'>
            <div className='text-center'>
              <Target className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-bold text-gray-600 mb-2'>최적화</h3>
              <p className='text-sm text-gray-500'>곧 출시 예정입니다</p>
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
            {/* 헤더 */}
            <div className='flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
              <div className='flex items-center space-x-2 sm:space-x-3 min-w-0'>
                <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
                  <Brain className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <BasicTyping
                    text='AI 어시스턴트'
                    speed='fast'
                    className='text-base sm:text-lg font-bold text-gray-800 truncate'
                    showCursor={false}
                  />
                  <p className='text-xs sm:text-sm text-gray-600 truncate'>
                    AI와 자연어로 시스템 질의
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
                title='사이드바 닫기'
                aria-label='사이드바 닫기'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            {/* 기능별 페이지 콘텐츠 */}
            <div className='flex-1 overflow-hidden pb-16 sm:pb-0'>
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

          {/* 모바일용 하단 기능 선택 패널 */}
          <div
            className='sm:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2'
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
