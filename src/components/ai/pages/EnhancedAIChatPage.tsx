/**
 * 🚀 Enhanced AI Chat Page - Cursor AI Style
 *
 * ✅ Cursor AI 스타일 UI/UX
 * ✅ AI 사고 과정 표시 기능
 * ✅ 모델 선택 드롭다운
 * ✅ 프리셋 질문 카드
 * ✅ 답변 제어 기능
 * ✅ 멀티 파일 업로드
 * ✅ 실시간 타이핑 효과
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Square,
  RotateCcw,
  Paperclip,
  X,
  Info,
  Zap,
  Brain,
  Database,
  Globe,
  Cpu,
  FileText,
  Image,
  Upload,
} from 'lucide-react';

// AI 엔진 타입 정의
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

// 메시지 타입 정의
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

// AI 사고 과정 타입
interface ThinkingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

// 업로드된 파일 타입
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  preview?: string;
}

// 프리셋 질문 타입
interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

// AI 엔진 목록
const AI_ENGINES: AIEngine[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: '자동으로 최적 모델 조합 선택',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['지능형 라우팅', '최적 성능', '자동 폴백'],
    status: 'ready',
  },
  {
    id: 'unified',
    name: 'Unified AI',
    description: 'MCP + Google AI + RAG 통합 분석',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['종합 분석', '높은 정확도', '컨텍스트 이해'],
    status: 'ready',
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    description: 'Google AI Studio (Gemini)',
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
    id: 'mcp',
    name: 'MCP Engine',
    description: 'Model Context Protocol 엔진',
    icon: Cpu,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: ['실시간 분석', '서버 특화', '빠른 응답'],
    status: 'ready',
  },
  {
    id: 'rag',
    name: 'Local RAG',
    description: '벡터 검색 및 문서 분석',
    icon: Database,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    features: ['문서 검색', '오프라인 지원', '프라이버시'],
    status: 'ready',
  },
];

// 프리셋 질문 목록
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
];

export default function EnhancedAIChatPage() {
  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);

  // 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetScrollRef = useRef<HTMLDivElement>(null);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI 사고 과정 시뮬레이션
  const simulateThinking = useCallback((): ThinkingStep[] => {
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
        title: '과거 패턴 검색',
        description: 'RAG 엔진에서 유사 사례 검색',
        status: 'completed' as const,
        duration: 800,
      },
      {
        id: '3',
        step: 3,
        title: 'MCP 컨텍스트 활용',
        description: '실시간 서버 상태 분석',
        status: 'completed' as const,
        duration: 600,
      },
      {
        id: '4',
        step: 4,
        title: 'Google AI로 종합 분석',
        description: '최종 결론 및 권장사항 생성',
        status: 'completed' as const,
        duration: 1500,
      },
    ];
    return steps;
  }, []);

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setUploadedFiles([]);
    setIsGenerating(true);

    // AI 응답 시뮬레이션
    const thinking = simulateThinking();
    const aiMessageId = (Date.now() + 1).toString();

    // 사고 과정 표시
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      thinking,
      engine: selectedEngine,
      confidence: 0.85,
    };

    setMessages(prev => [...prev, aiMessage]);

    // 타이핑 효과로 응답 생성
    setTimeout(() => {
      const response = generateAIResponse(inputValue, selectedEngine);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, content: response } : msg
        )
      );
      setIsGenerating(false);
    }, 3000);
  };

  // AI 응답 생성
  const generateAIResponse = (query: string, engine: string): string => {
    const responses = {
      auto: `자동 분석 결과: 현재 시스템 상태를 종합적으로 분석한 결과, 8개 서버 중 7개가 정상 작동 중입니다. CPU 평균 사용률 45%, 메모리 68%로 안정적입니다.`,
      unified: `통합 AI 분석: MCP, RAG, Google AI를 활용한 종합 분석 결과, 시스템 전반적으로 양호한 상태입니다. 특별한 이상 징후는 발견되지 않았습니다.`,
      'google-ai': `Google AI 분석: Gemini 모델을 통한 자연어 분석 결과, 질문하신 내용에 대해 상세한 분석을 제공드립니다.`,
      mcp: `MCP 엔진 분석: 실시간 서버 컨텍스트를 기반으로 분석한 결과, 현재 인프라 상태는 안정적입니다.`,
      rag: `RAG 검색 결과: 문서 데이터베이스에서 관련 정보를 검색한 결과, 유사한 상황에 대한 해결책을 찾았습니다.`,
    };

    return responses[engine as keyof typeof responses] || responses.auto;
  };

  // 프리셋 질문 클릭
  const handlePresetQuestion = (question: string) => {
    setInputValue(question);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: e.target?.result as string,
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
  };

  // 파일 제거
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 답변 중지
  const stopGeneration = () => {
    setIsGenerating(false);
  };

  // 답변 재생성
  const regenerateResponse = (messageId: string) => {
    // 재생성 로직 구현
    console.log('Regenerating response for:', messageId);
  };

  return (
    <div className='flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50'>
      {/* 헤더 - 모델 선택 */}
      <div className='p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <Bot className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>
                Enhanced AI Chat
              </h2>
              <p className='text-sm text-gray-600'>
                Cursor AI 스타일 대화형 인터페이스
              </p>
            </div>
          </div>

          {/* 모델 선택 드롭다운 */}
          <div className='relative'>
            <button
              onClick={() => setShowEngineInfo(!showEngineInfo)}
              className='flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              {React.createElement(
                AI_ENGINES.find(e => e.id === selectedEngine)?.icon || Zap,
                {
                  className: `w-4 h-4 ${AI_ENGINES.find(e => e.id === selectedEngine)?.color}`,
                }
              )}
              <span className='text-sm font-medium'>
                {AI_ENGINES.find(e => e.id === selectedEngine)?.name}
              </span>
              <ChevronDown className='w-4 h-4 text-gray-500' />
            </button>

            {/* 엔진 선택 드롭다운 */}
            <AnimatePresence>
              {showEngineInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10'
                >
                  <div className='p-3 border-b border-gray-100'>
                    <h3 className='text-sm font-semibold text-gray-800'>
                      AI 모델 선택
                    </h3>
                    <p className='text-xs text-gray-600'>
                      용도에 맞는 AI 엔진을 선택하세요
                    </p>
                  </div>

                  <div className='max-h-64 overflow-y-auto'>
                    {AI_ENGINES.map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => {
                          setSelectedEngine(engine.id);
                          setShowEngineInfo(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          selectedEngine === engine.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className='flex items-start space-x-3'>
                          <div
                            className={`w-8 h-8 rounded-lg ${engine.bgColor} flex items-center justify-center`}
                          >
                            {React.createElement(engine.icon, {
                              className: `w-4 h-4 ${engine.color}`,
                            })}
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2'>
                              <h4 className='text-sm font-medium text-gray-800'>
                                {engine.name}
                              </h4>
                              {engine.usage && (
                                <span className='text-xs text-gray-500'>
                                  {engine.usage.used}/{engine.usage.limit}
                                </span>
                              )}
                            </div>
                            <p className='text-xs text-gray-600 mt-1'>
                              {engine.description}
                            </p>
                            <div className='flex flex-wrap gap-1 mt-2'>
                              {engine.features.map((feature, idx) => (
                                <span
                                  key={idx}
                                  className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded'
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                            {engine.usage && (
                              <div className='mt-2'>
                                <div className='w-full bg-gray-200 rounded-full h-1'>
                                  <div
                                    className='bg-blue-500 h-1 rounded-full'
                                    style={{
                                      width: `${(engine.usage.used / engine.usage.limit) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
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
      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {messages.length === 0 && (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Sparkles className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              Enhanced AI Chat에 오신 것을 환영합니다!
            </h3>
            <p className='text-gray-600 mb-6'>
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
              className={`flex items-start space-x-3 max-w-[85%] ${
                message.type === 'user'
                  ? 'flex-row-reverse space-x-reverse'
                  : ''
              }`}
            >
              {/* 아바타 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className='w-4 h-4' />
                ) : (
                  <Bot className='w-4 h-4' />
                )}
              </div>

              {/* 메시지 콘텐츠 */}
              <div className='flex-1'>
                {/* AI 사고 과정 (AI 메시지만) */}
                {message.type === 'ai' && message.thinking && (
                  <div className='mb-3'>
                    <button
                      onClick={() =>
                        setExpandedThinking(
                          expandedThinking === message.id ? null : message.id
                        )
                      }
                      className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors'
                    >
                      <Brain className='w-4 h-4' />
                      <span>🤔 AI 생각 과정</span>
                      {expandedThinking === message.id ? (
                        <ChevronUp className='w-4 h-4' />
                      ) : (
                        <ChevronDown className='w-4 h-4' />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedThinking === message.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className='mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200'
                        >
                          <div className='space-y-2'>
                            {message.thinking.map(step => (
                              <div
                                key={step.id}
                                className='flex items-center space-x-3'
                              >
                                <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium'>
                                  {step.step}
                                </div>
                                <div className='flex-1'>
                                  <div className='text-sm font-medium text-gray-800'>
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
                  className={`p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {/* 파일 첨부 (사용자 메시지) */}
                  {message.files && message.files.length > 0 && (
                    <div className='mb-3 space-y-2'>
                      {message.files.map(file => (
                        <div
                          key={file.id}
                          className='flex items-center space-x-2 p-2 bg-white/20 rounded'
                        >
                          <FileText className='w-4 h-4' />
                          <span className='text-sm'>{file.name}</span>
                          <span className='text-xs opacity-75'>
                            ({(file.size / 1024).toFixed(1)}KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className='text-sm whitespace-pre-wrap'>
                    {message.content}
                  </p>

                  {/* 메타데이터 (AI 메시지) */}
                  {message.type === 'ai' && (
                    <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-100'>
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
                    className={`text-xs mt-2 ${
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
          <div className='flex justify-start'>
            <div className='flex items-start space-x-3 max-w-[85%]'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center'>
                <Sparkles className='w-4 h-4 text-white animate-pulse' />
              </div>
              <div className='bg-white border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex space-x-1'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100' />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200' />
                  </div>
                  <span className='text-sm text-gray-600'>
                    AI가 생각하고 있습니다...
                  </span>
                  <button
                    onClick={stopGeneration}
                    className='p-1 hover:bg-gray-100 rounded transition-colors'
                    title='생성 중지'
                  >
                    <Square className='w-3 h-3 text-gray-500' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 프리셋 질문 카드 */}
      {messages.length === 0 && (
        <div className='px-4 pb-4'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>빠른 질문</h3>
          <div
            ref={presetScrollRef}
            className='flex space-x-3 overflow-x-auto pb-2 scrollbar-hide'
          >
            {PRESET_QUESTIONS.map(question => (
              <motion.button
                key={question.id}
                onClick={() => handlePresetQuestion(question.text)}
                className='flex-shrink-0 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left min-w-[200px]'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex items-center space-x-2 mb-2'>
                  <div
                    className={`w-6 h-6 ${question.color} rounded flex items-center justify-center`}
                  >
                    {React.createElement(question.icon, {
                      className: 'w-3 h-3 text-white',
                    })}
                  </div>
                  <span className='text-xs text-gray-500'>
                    {question.category}
                  </span>
                </div>
                <p className='text-sm text-gray-800'>{question.text}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 파일 업로드 영역 */}
      {uploadedFiles.length > 0 && (
        <div className='px-4 pb-2'>
          <div className='flex flex-wrap gap-2'>
            {uploadedFiles.map(file => (
              <div
                key={file.id}
                className='flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg'
              >
                <FileText className='w-4 h-4 text-blue-600' />
                <span className='text-sm text-blue-800'>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className='p-1 hover:bg-blue-100 rounded transition-colors'
                >
                  <X className='w-3 h-3 text-blue-600' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className='p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-end space-x-2'>
          {/* 파일 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            title='파일 첨부'
          >
            <Paperclip className='w-5 h-5' />
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
              className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px] max-h-32'
              rows={1}
            />
          </div>

          {/* 전송 버튼 */}
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() && uploadedFiles.length === 0}
            className='p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className='w-5 h-5' />
          </motion.button>
        </div>

        {/* 키보드 단축키 힌트 */}
        <div className='flex items-center justify-between mt-2 text-xs text-gray-500'>
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
      />
    </div>
  );
}
