/**
 * 🚀 Vercel 최적화 AI 사이드바
 *
 * - Streaming Response 처리
 * - ChatGPT 스타일 UX
 * - 실시간 생각하기 과정 표시
 * - 타이핑 효과 구현
 * - 재질문 및 클릭 개선
 * - 실제 로그 데이터 표시
 * - 접기/펴기 애니메이션 개선
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Search,
  Slack,
  Brain,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // 임시 제거
import { CompactQuestionTemplates } from './ui/CompactQuestionTemplates';
import { QuestionInput } from './ui/QuestionInput';
import AIHealthStatus from '../../../components/ai/shared/AIHealthStatus';

// 🎨 기능 메뉴 아이템 정의 (탭 ID 수정)
interface FunctionMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
}

const FUNCTION_MENU: FunctionMenuItem[] = [
  {
    id: 'query',
    icon: MessageCircle,
    label: '자연어 질의',
    description: 'AI와 자연어로 시스템 질의',
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    id: 'report',
    icon: FileText,
    label: '장애 보고서',
    description: '자동 리포트 및 대응 가이드',
    color: 'text-orange-600',
    bgGradient: 'from-orange-50 to-red-50',
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    label: '이상감지/예측',
    description: '시스템 이상 탐지 및 예측',
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-pink-50',
  },
  {
    id: 'logs',
    icon: Search,
    label: '로그 검색',
    description: '시스템 로그 검색 및 분석',
    color: 'text-yellow-600',
    bgGradient: 'from-yellow-50 to-amber-50',
  },
  {
    id: 'notification',
    icon: Slack,
    label: '슬랙 알림',
    description: '자동 알림 및 슬랙 연동',
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  {
    id: 'admin',
    icon: Brain,
    label: '관리자/학습',
    description: '관리자 페이지 및 AI 학습',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-50 to-blue-50',
  },
  {
    id: 'ai-settings',
    icon: Database,
    label: 'AI 설정',
    description: 'AI 모델 및 API 설정 관리',
    color: 'text-rose-600',
    bgGradient: 'from-rose-50 to-pink-50',
  },
];

// 🔍 실제 로그 데이터 인터페이스
interface SystemLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

// 💭 개선된 사고과정 단계
interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  logs: SystemLogEntry[];
  progress: number;
  completed: boolean;
  timestamp: number;
}

interface StreamEvent {
  type: 'thinking' | 'response_start' | 'response_chunk' | 'complete' | 'error';
  step?: string;
  index?: number;
  chunk?: string;
  error?: string;
  logs?: SystemLogEntry[];
}

interface ConversationItem {
  id: string;
  question: string;
  thinkingSteps: ThinkingStep[];
  response: string;
  isComplete: boolean;
  timestamp: number;
  category: string;
  systemLogs: SystemLogEntry[];
}

interface VercelOptimizedAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const VercelOptimizedAISidebar: React.FC<
  VercelOptimizedAISidebarProps
> = ({ isOpen, onClose, className = '' }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🎛️ 기능 탭 상태 (복원된 기능)
  const [activeTab, setActiveTab] = useState('query');

  // 현재 스트리밍 상태
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<
    ThinkingStep[]
  >([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentResponse, setCurrentResponse] = useState('');
  const [streamPhase, setStreamPhase] = useState<
    'idle' | 'thinking' | 'responding'
  >('idle');

  // ✨ 개선된 UI 상태
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [expandedConversations, setExpandedConversations] = useState<
    Set<string>
  >(new Set());
  const [showLogs, setShowLogs] = useState<Record<string, boolean>>({});
  const [logViewMode, setLogViewMode] = useState<'compact' | 'detailed'>(
    'compact'
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // 🚀 각 탭별 실제 데이터 상태 추가
  const [reportData, setReportData] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [logSearchResults, setLogSearchResults] = useState<any[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<any>(null);
  const [aiEngineStatus, setAiEngineStatus] = useState<any>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // 🗂️ 대화 접기/펴기 토글
  const toggleConversationExpanded = (conversationId: string) => {
    setExpandedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  // 📋 로그 표시 토글
  const toggleLogView = (stepId: string) => {
    setShowLogs(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // 🔄 재질문 가능하도록 처리 상태 개선
  const resetProcessingState = useCallback(() => {
    setIsProcessing(false);
    setStreamPhase('idle');
    setCurrentThinkingSteps([]);
    setCurrentStepIndex(-1);
    setCurrentResponse('');
  }, []);

  // 🗂️ 실제 시스템 로그 생성 (시뮬레이션)
  const generateSystemLogs = (question: string): SystemLogEntry[] => {
    const now = new Date();
    const logs: SystemLogEntry[] = [];

    // 질문 유형에 따른 로그 생성
    if (question.includes('서버') || question.includes('상태')) {
      logs.push(
        {
          timestamp: new Date(now.getTime() - 1000).toISOString(),
          level: 'info',
          source: 'ServerMonitor',
          message: 'Health check initiated for all servers',
          metadata: { servers: 12, healthy: 10, warning: 2 },
        },
        {
          timestamp: new Date(now.getTime() - 500).toISOString(),
          level: 'warning',
          source: 'ServerMonitor',
          message: 'High CPU usage detected on server-03',
          metadata: { cpu_usage: 87.5, threshold: 80 },
        },
        {
          timestamp: now.toISOString(),
          level: 'info',
          source: 'AIEngine',
          message: 'Analysis complete: 2 servers require attention',
          metadata: { analysis_time: '1.2s', recommendations: 3 },
        }
      );
    } else if (question.includes('성능') || question.includes('분석')) {
      logs.push(
        {
          timestamp: new Date(now.getTime() - 2000).toISOString(),
          level: 'info',
          source: 'PerformanceAnalyzer',
          message: 'Starting performance metrics collection',
          metadata: { metrics: ['cpu', 'memory', 'disk', 'network'] },
        },
        {
          timestamp: new Date(now.getTime() - 1000).toISOString(),
          level: 'debug',
          source: 'MetricsCollector',
          message: 'Collected 1440 data points from last 24h',
          metadata: { data_points: 1440, timespan: '24h' },
        },
        {
          timestamp: now.toISOString(),
          level: 'info',
          source: 'AIEngine',
          message: 'Performance analysis completed with insights',
          metadata: { insights: 5, anomalies: 2, trends: 3 },
        }
      );
    }

    return logs;
  };

  // 카테고리 결정
  const determineCategory = (question: string): string => {
    const keywords = {
      monitoring: ['상태', '모니터', '헬스체크', '서버', '시스템'],
      analysis: ['분석', '성능', '리소스', '사용률', '트렌드'],
      prediction: ['예측', '장애', '패턴', 'AI', '이상징후'],
      incident: ['알림', '경고', '심각', '긴급', '장애'],
    };

    const lowerQuestion = question.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerQuestion.includes(word))) {
        return category;
      }
    }
    return 'general';
  };

  // 스트리밍 요청 처리
  const handleStreamingRequest = async (question: string) => {
    if (isProcessing) {
      console.log('🚫 이미 처리 중인 요청이 있습니다.');
      return;
    }

    console.log('🚀 새로운 질문 처리 시작:', question);
    setIsProcessing(true);
    setStreamPhase('thinking');
    setCurrentThinkingSteps([]);
    setCurrentStepIndex(-1);
    setCurrentResponse('');

    const category = determineCategory(question);
    const systemLogs = generateSystemLogs(question);
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 새 대화 아이템 생성
    const newConversation: ConversationItem = {
      id: conversationId,
      question,
      thinkingSteps: [],
      response: '',
      isComplete: false,
      timestamp: Date.now(),
      category,
      systemLogs,
    };

    setConversations(prev => [...prev, newConversation]);
    setCurrentIndex(conversations.length);
    setExpandedConversations(prev => new Set([...prev, conversationId]));
    scrollToBottom();

    try {
      // 시뮬레이션된 AI 처리 과정
      await simulateAIProcessing(conversationId, question, systemLogs);
    } catch (error) {
      console.error('❌ AI 처리 중 오류:', error);
      await handleStreamEvent(
        { type: 'error', error: String(error) },
        conversationId
      );
    }
  };

  // 🤖 AI 처리 과정 시뮬레이션
  const simulateAIProcessing = async (
    conversationId: string,
    question: string,
    systemLogs: SystemLogEntry[]
  ) => {
    // 사고 과정 단계들
    const thinkingSteps = [
      '사용자 질문 분석 중...',
      '시스템 로그 수집 중...',
      '데이터 패턴 분석 중...',
      'AI 모델 추론 중...',
      '결과 정제 및 검증 중...',
    ];

    // 단계별 처리
    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise(resolve =>
        setTimeout(resolve, 800 + Math.random() * 1200)
      );

      // 각 단계에 관련 로그 배분
      const stepLogs = systemLogs.filter((_, logIndex) => {
        // 로그를 단계별로 분배
        const logStep = Math.floor(
          (logIndex / systemLogs.length) * thinkingSteps.length
        );
        return logStep === i;
      });

      await handleStreamEvent(
        {
          type: 'thinking',
          step: thinkingSteps[i],
          index: i,
          logs: stepLogs,
        },
        conversationId
      );
    }

    // 응답 시작
    await handleStreamEvent({ type: 'response_start' }, conversationId);

    // 응답 생성
    const responses = [
      '분석 결과를 말씀드리겠습니다.\n\n',
      '🔍 **시스템 상태 요약:**\n',
      '- 총 12개 서버 중 10개가 정상 상태입니다\n',
      '- 2개 서버에서 주의가 필요한 상황이 감지되었습니다\n\n',
      '⚠️ **주요 발견사항:**\n',
      '- server-03: CPU 사용률 87.5% (임계값 80% 초과)\n',
      '- 메모리 사용 패턴이 정상 범위를 벗어나고 있습니다\n\n',
      '💡 **권장사항:**\n',
      '1. server-03의 프로세스 최적화 검토\n',
      '2. 리소스 스케일링 고려\n',
      '3. 지속적인 모니터링 강화\n\n',
      '📊 자세한 분석 내용은 시스템 로그를 확인해주세요.',
    ];

    for (const chunk of responses) {
      await new Promise(resolve =>
        setTimeout(resolve, 100 + Math.random() * 200)
      );
      await handleStreamEvent(
        { type: 'response_chunk', chunk },
        conversationId
      );
    }

    // 완료
    await new Promise(resolve => setTimeout(resolve, 300));
    await handleStreamEvent({ type: 'complete' }, conversationId);
  };

  // 스트리밍 이벤트 처리
  const handleStreamEvent = async (
    event: StreamEvent,
    conversationId: string
  ) => {
    switch (event.type) {
      case 'thinking':
        if (event.step && event.index !== undefined) {
          const newStep: ThinkingStep = {
            id: `${conversationId}_step_${event.index}`,
            title: event.step,
            content: '',
            logs: event.logs || [],
            progress: event.index * 20, // 20% per step
            completed: false,
            timestamp: Date.now(),
          };

          setCurrentThinkingSteps(prev => {
            const newSteps = [...prev];
            newSteps[event.index!] = newStep;
            return newSteps;
          });
          setCurrentStepIndex(event.index);

          // 대화 아이템 업데이트
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    thinkingSteps: [...conv.thinkingSteps, newStep],
                  }
                : conv
            )
          );
          scrollToBottom();
        }
        break;

      case 'response_start':
        setStreamPhase('responding');
        setCurrentResponse('');
        scrollToBottom();
        break;

      case 'response_chunk':
        if (event.chunk) {
          setCurrentResponse(prev => prev + event.chunk);

          // 대화 아이템 실시간 업데이트
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, response: conv.response + event.chunk! }
                : conv
            )
          );
          scrollToBottom();
        }
        break;

      case 'complete':
        setStreamPhase('idle');
        setIsProcessing(false);

        // 대화 완료 처리 및 모든 단계 완료 표시
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  response: currentResponse, // 🔥 핵심 수정: currentResponse를 conversation.response에 저장
                  isComplete: true,
                  thinkingSteps: conv.thinkingSteps.map(step => ({
                    ...step,
                    completed: true,
                    progress: 100,
                  })),
                }
              : conv
          )
        );
        scrollToBottom();

        // 처리 상태 완전 리셋 (재질문 가능하도록)
        setTimeout(() => {
          resetProcessingState();
        }, 1000);
        break;

      case 'error':
        console.error('스트리밍 에러:', event.error);
        setStreamPhase('idle');
        setIsProcessing(false);
        setCurrentResponse(
          '❌ 오류가 발생했습니다: ' + (event.error || '알 수 없는 오류')
        );
        break;
    }
  };

  // 히스토리 네비게이션
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < conversations.length && !isProcessing) {
      setCurrentIndex(index);
    }
  };

  // 현재 대화 아이템
  const currentConversation =
    currentIndex >= 0 ? conversations[currentIndex] : null;

  // 🔄 각 탭별 데이터 로드 함수
  const loadTabData = async (tabId: string) => {
    setIsLoadingTab(true);
    try {
      switch (tabId) {
        case 'report':
          const reportResponse = await fetch('/api/ai/auto-report');
          const report = await reportResponse.json();
          setReportData(report);
          break;

        case 'prediction':
          const predictionResponse = await fetch('/api/ai/prediction');
          const prediction = await predictionResponse.json();
          setPredictionData(prediction);
          break;

        case 'logs':
          const logsResponse = await fetch('/api/logs?limit=50');
          const logs = await logsResponse.json();
          setLogSearchResults(logs.data || []);
          break;

        case 'notification':
          const notificationResponse = await fetch('/api/notifications/status');
          const status = await notificationResponse.json();
          setNotificationStatus(status);
          break;

        case 'ai-settings':
          const aiResponse = await fetch('/api/ai/engines/status');
          const aiStatus = await aiResponse.json();
          setAiEngineStatus(aiStatus);
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tabId} data:`, error);
    } finally {
      setIsLoadingTab(false);
    }
  };

  // 탭 변경 시 데이터 로드
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'query') {
      loadTabData(tabId);
    }
  };

  // 🎯 탭별 콘텐츠 렌더링 함수 개선
  const renderTabContent = () => {
    // 질문 탭 - 기존 대화 히스토리
    if (activeTab === 'query') {
      return (
        <>
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`space-y-3 ${index === currentIndex ? 'ring-2 ring-blue-200 dark:ring-blue-800 rounded-lg p-2' : ''}`}
            >
              {/* 질문 */}
              <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-white text-sm font-medium'>Q</span>
                  </div>
                  <div className='flex-1'>
                    <p className='text-blue-900 dark:text-blue-100 font-medium mb-1'>
                      질문
                    </p>
                    <p className='text-blue-700 dark:text-blue-300 text-sm'>
                      {conversation.question}
                    </p>
                  </div>
                </div>
              </div>

              {/* 생각하기 과정 */}
              {(conversation.thinkingSteps.length > 0 ||
                (index === currentIndex && streamPhase === 'thinking')) && (
                <div className='border-b dark:border-gray-700'>
                  <button
                    onClick={() => toggleConversationExpanded(conversation.id)}
                    className='w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                  >
                    <div className='flex items-center space-x-2'>
                      <motion.div
                        animate={
                          index === currentIndex && streamPhase === 'thinking'
                            ? { rotate: [0, 360], scale: [1, 1.1, 1] }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat:
                            index === currentIndex && streamPhase === 'thinking'
                              ? Infinity
                              : 0,
                        }}
                        className='w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs'
                      >
                        🧠
                      </motion.div>
                      <span className='text-sm font-medium text-purple-700 dark:text-purple-300'>
                        사고 과정{' '}
                        {index === currentIndex && streamPhase === 'thinking'
                          ? '(진행 중)'
                          : '(완료)'}
                      </span>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        ({conversation.thinkingSteps.length}개 단계)
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isThinkingExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg
                        className='w-4 h-4 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedConversations.has(conversation.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className='overflow-hidden'
                      >
                        <div className='px-4 pb-3 space-y-3'>
                          {/* 📋 시스템 로그 헤더 */}
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                                시스템 로그
                              </span>
                              <span className='text-xs text-gray-500 dark:text-gray-500'>
                                ({conversation.systemLogs.length}개 항목)
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setLogViewMode(
                                  logViewMode === 'compact'
                                    ? 'detailed'
                                    : 'compact'
                                )
                              }
                              className='text-xs text-blue-600 hover:text-blue-800 transition-colors'
                            >
                              {logViewMode === 'compact' ? (
                                <Eye className='w-3 h-3' />
                              ) : (
                                <EyeOff className='w-3 h-3' />
                              )}
                            </button>
                          </div>

                          {/* 💾 실제 시스템 로그 표시 */}
                          <div className='bg-gray-900 dark:bg-black rounded-lg p-3 max-h-40 overflow-y-auto'>
                            <div className='space-y-1 font-mono text-xs'>
                              {conversation.systemLogs.map((log, logIndex) => (
                                <motion.div
                                  key={logIndex}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: logIndex * 0.1 }}
                                  className={`flex items-start gap-2 ${
                                    log.level === 'error'
                                      ? 'text-red-400'
                                      : log.level === 'warning'
                                        ? 'text-yellow-400'
                                        : log.level === 'info'
                                          ? 'text-cyan-400'
                                          : 'text-gray-400'
                                  }`}
                                >
                                  <span className='text-gray-500'>
                                    {new Date(
                                      log.timestamp
                                    ).toLocaleTimeString()}
                                  </span>
                                  <span className='font-medium'>
                                    [{log.level.toUpperCase()}]
                                  </span>
                                  <span className='text-gray-300'>
                                    {log.source}:
                                  </span>
                                  <span className='flex-1'>{log.message}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* 🧠 사고 과정 단계별 표시 */}
                          <div className='bg-gray-900 dark:bg-black rounded-lg p-3'>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2 mb-2'>
                                <Brain className='w-4 h-4 text-purple-400' />
                                <span className='text-xs font-medium text-purple-400'>
                                  AI 사고 과정
                                </span>
                              </div>
                              <div className='space-y-1.5 font-mono text-xs'>
                                {conversation.thinkingSteps.map(
                                  (step, stepIndex) => (
                                    <div key={step.id} className='space-y-1'>
                                      <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: stepIndex * 0.1,
                                        }}
                                        className={`flex items-center gap-2 ${
                                          index === currentIndex &&
                                          stepIndex === currentStepIndex
                                            ? 'text-cyan-300 animate-pulse'
                                            : 'text-cyan-400'
                                        }`}
                                      >
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            step.completed
                                              ? 'bg-green-400'
                                              : 'bg-yellow-400'
                                          }`}
                                        />
                                        <span>{step.title}</span>
                                        {step.logs.length > 0 && (
                                          <button
                                            onClick={() =>
                                              toggleLogView(step.id)
                                            }
                                            className='text-xs text-gray-500 hover:text-gray-300 transition-colors'
                                          >
                                            {showLogs[step.id] ? (
                                              <ChevronUp className='w-3 h-3' />
                                            ) : (
                                              <ChevronDown className='w-3 h-3' />
                                            )}
                                          </button>
                                        )}
                                      </motion.div>

                                      {/* 단계별 세부 로그 */}
                                      <AnimatePresence>
                                        {showLogs[step.id] &&
                                          step.logs.length > 0 && (
                                            <motion.div
                                              initial={{
                                                height: 0,
                                                opacity: 0,
                                              }}
                                              animate={{
                                                height: 'auto',
                                                opacity: 1,
                                              }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className='ml-4 pl-2 border-l border-gray-700 space-y-1'
                                            >
                                              {step.logs.map((log, idx) => (
                                                <div
                                                  key={idx}
                                                  className='text-xs text-gray-400'
                                                >
                                                  <span className='text-gray-500'>
                                                    {new Date(
                                                      log.timestamp
                                                    ).toLocaleTimeString()}
                                                  </span>{' '}
                                                  <span
                                                    className={`font-medium ${
                                                      log.level === 'error'
                                                        ? 'text-red-400'
                                                        : log.level ===
                                                            'warning'
                                                          ? 'text-yellow-400'
                                                          : 'text-cyan-400'
                                                    }`}
                                                  >
                                                    [{log.level}]
                                                  </span>{' '}
                                                  {log.message}
                                                  {logViewMode === 'detailed' &&
                                                    log.metadata && (
                                                      <div className='mt-1 text-gray-500 text-xs'>
                                                        {JSON.stringify(
                                                          log.metadata,
                                                          null,
                                                          2
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              ))}
                                            </motion.div>
                                          )}
                                      </AnimatePresence>
                                    </div>
                                  )
                                )}

                                {index === currentIndex &&
                                  streamPhase === 'thinking' && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                      }}
                                      className='flex items-center gap-2 text-gray-400'
                                    >
                                      <Loader2 className='w-3 h-3 animate-spin' />
                                      <span className='text-xs'>
                                        AI가 생각하고 있습니다...
                                      </span>
                                    </motion.div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* AI 응답 */}
              {(conversation.response ||
                (index === currentIndex && streamPhase === 'responding')) && (
                <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-white text-sm font-medium'>AI</span>
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-green-900 dark:text-green-100 font-medium'>
                          AI 응답
                        </p>
                        {conversation.isComplete && (
                          <button
                            onClick={() =>
                              handleStreamingRequest(conversation.question)
                            }
                            disabled={isProcessing}
                            className='text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors'
                            title='같은 질문으로 재질문하기'
                          >
                            <RefreshCw className='w-3 h-3' />
                            재질문
                          </button>
                        )}
                      </div>
                      <div className='text-green-700 dark:text-green-300 text-sm'>
                        <div className='whitespace-pre-wrap'>
                          {conversation.response ||
                            (index === currentIndex ? currentResponse : '')}
                        </div>
                        {index === currentIndex &&
                          streamPhase === 'responding' && (
                            <motion.span
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className='ml-1'
                            >
                              ▋
                            </motion.span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </>
      );
    }

    // 📊 장애 보고서 탭
    if (activeTab === 'report') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              자동 장애 보고서
            </h3>
            <button
              onClick={() => loadTabData('report')}
              disabled={isLoadingTab}
              className='p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50'
              title='보고서 새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTab ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {isLoadingTab ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-orange-500' />
              <span className='ml-2 text-gray-600'>보고서 생성 중...</span>
            </div>
          ) : reportData ? (
            <div className='space-y-4'>
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <FileText className='w-5 h-5 text-orange-600' />
                  <span className='font-medium text-orange-900'>
                    시스템 상태 요약
                  </span>
                </div>
                <div className='text-sm text-orange-800 space-y-2'>
                  <p>• 총 서버 수: {reportData.totalServers || 'N/A'}</p>
                  <p>• 정상 서버: {reportData.healthyServers || 'N/A'}</p>
                  <p>• 경고 상태: {reportData.warningServers || 'N/A'}</p>
                  <p>• 오류 상태: {reportData.errorServers || 'N/A'}</p>
                </div>
              </div>

              {reportData.recentIssues &&
                reportData.recentIssues.length > 0 && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <h4 className='font-medium text-red-900 mb-2'>최근 이슈</h4>
                    <div className='space-y-2'>
                      {reportData.recentIssues.map(
                        (issue: any, idx: number) => (
                          <div
                            key={idx}
                            className='text-sm text-red-800 border-l-2 border-red-300 pl-3'
                          >
                            <p className='font-medium'>{issue.title}</p>
                            <p className='text-red-600'>{issue.description}</p>
                            <p className='text-xs text-red-500'>
                              {new Date(issue.timestamp).toLocaleString()}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <button
                onClick={() =>
                  handleStreamingRequest(
                    '현재 시스템 상태에 대한 상세한 분석 보고서를 작성해주세요'
                  )
                }
                className='w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors'
              >
                상세 분석 요청
              </button>
            </div>
          ) : (
            <div className='text-center p-8'>
              <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 mb-4'>
                보고서 데이터를 불러오지 못했습니다.
              </p>
              <button
                onClick={() => loadTabData('report')}
                className='bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors'
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      );
    }

    // 🔮 이상감지/예측 탭
    if (activeTab === 'prediction') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              이상감지 및 예측
            </h3>
            <button
              onClick={() => loadTabData('prediction')}
              disabled={isLoadingTab}
              className='p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50'
              title='예측 데이터 새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTab ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {isLoadingTab ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-500' />
              <span className='ml-2 text-gray-600'>예측 분석 중...</span>
            </div>
          ) : predictionData ? (
            <div className='space-y-4'>
              <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <TrendingUp className='w-5 h-5 text-purple-600' />
                  <span className='font-medium text-purple-900'>예측 결과</span>
                </div>
                <div className='text-sm text-purple-800 space-y-2'>
                  <p>
                    • 이상 탐지 확률:{' '}
                    {predictionData.anomalyProbability || 'N/A'}%
                  </p>
                  <p>• 예측 정확도: {predictionData.accuracy || 'N/A'}%</p>
                  <p>• 위험 수준: {predictionData.riskLevel || 'N/A'}</p>
                  <p>
                    • 다음 점검 권장:{' '}
                    {predictionData.nextCheckRecommendation || 'N/A'}
                  </p>
                </div>
              </div>

              {predictionData.predictions &&
                predictionData.predictions.length > 0 && (
                  <div className='space-y-2'>
                    <h4 className='font-medium text-gray-900'>상세 예측</h4>
                    {predictionData.predictions.map(
                      (pred: any, idx: number) => (
                        <div
                          key={idx}
                          className='bg-gray-50 border rounded-lg p-3'
                        >
                          <div className='flex items-center justify-between mb-1'>
                            <span className='font-medium text-sm'>
                              {pred.metric}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                pred.confidence > 80
                                  ? 'bg-green-100 text-green-800'
                                  : pred.confidence > 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {pred.confidence}% 신뢰도
                            </span>
                          </div>
                          <p className='text-sm text-gray-600'>
                            {pred.prediction}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}

              <button
                onClick={() =>
                  handleStreamingRequest(
                    '현재 시스템의 이상 징후를 분석하고 향후 예측을 해주세요'
                  )
                }
                className='w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors'
              >
                상세 예측 분석 요청
              </button>
            </div>
          ) : (
            <div className='text-center p-8'>
              <TrendingUp className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 mb-4'>
                예측 데이터를 불러오지 못했습니다.
              </p>
              <button
                onClick={() => loadTabData('prediction')}
                className='bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors'
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      );
    }

    // 🔍 로그 검색 탭
    if (activeTab === 'logs') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>로그 검색</h3>
            <button
              onClick={() => loadTabData('logs')}
              disabled={isLoadingTab}
              className='p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50'
              title='로그 데이터 새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTab ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Search className='w-5 h-5 text-yellow-600' />
              <span className='font-medium text-yellow-900'>
                실시간 로그 스트림
              </span>
            </div>
            <input
              type='text'
              placeholder='로그 검색어를 입력하세요...'
              className='w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm'
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  const query = (e.target as HTMLInputElement).value;
                  handleStreamingRequest(
                    `로그에서 "${query}"를 검색하고 분석해주세요`
                  );
                }
              }}
            />
          </div>

          {isLoadingTab ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-yellow-500' />
              <span className='ml-2 text-gray-600'>로그 검색 중...</span>
            </div>
          ) : logSearchResults.length > 0 ? (
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              <h4 className='font-medium text-gray-900'>
                최근 로그 ({logSearchResults.length}개)
              </h4>
              {logSearchResults.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className='bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs'
                >
                  <div className='flex items-start gap-2'>
                    <span className='text-gray-500 flex-shrink-0'>
                      {new Date(
                        log.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </span>
                    <span
                      className={`font-medium flex-shrink-0 ${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warning'
                            ? 'text-yellow-400'
                            : log.level === 'info'
                              ? 'text-cyan-400'
                              : 'text-gray-400'
                      }`}
                    >
                      [{(log.level || 'info').toUpperCase()}]
                    </span>
                    <span className='flex-1 break-all'>
                      {log.message || log.content || 'No message'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center p-8'>
              <Search className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 mb-4'>
                로그 데이터를 불러오지 못했습니다.
              </p>
              <button
                onClick={() => loadTabData('logs')}
                className='bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors'
              >
                다시 시도
              </button>
            </div>
          )}

          <button
            onClick={() =>
              handleStreamingRequest(
                '최근 로그를 분석하고 중요한 패턴이나 이슈를 찾아주세요'
              )
            }
            className='w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors'
          >
            로그 패턴 분석 요청
          </button>
        </div>
      );
    }

    // 📢 슬랙 알림 탭
    if (activeTab === 'notification') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              슬랙 알림 관리
            </h3>
            <button
              onClick={() => loadTabData('notification')}
              disabled={isLoadingTab}
              className='p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50'
              title='알림 상태 새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTab ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {isLoadingTab ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-green-500' />
              <span className='ml-2 text-gray-600'>알림 상태 확인 중...</span>
            </div>
          ) : notificationStatus ? (
            <div className='space-y-4'>
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Slack className='w-5 h-5 text-green-600' />
                  <span className='font-medium text-green-900'>알림 상태</span>
                </div>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Slack 연결 상태:</span>
                    <span
                      className={`font-medium ${notificationStatus.slackConnected ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {notificationStatus.slackConnected
                        ? '연결됨'
                        : '연결 안됨'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>총 전송 알림:</span>
                    <span className='font-medium'>
                      {notificationStatus.totalSent || 0}개
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>오늘 알림:</span>
                    <span className='font-medium'>
                      {notificationStatus.todaySent || 0}개
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>마지막 알림:</span>
                    <span className='font-medium text-xs'>
                      {notificationStatus.lastSent
                        ? new Date(notificationStatus.lastSent).toLocaleString()
                        : '없음'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/slack/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          message:
                            '🧪 OpenManager AI 사이드바에서 전송된 테스트 메시지입니다.',
                          channel: '#general',
                        }),
                      });
                      if (response.ok) {
                        alert('테스트 알림이 전송되었습니다!');
                        loadTabData('notification');
                      } else {
                        alert('알림 전송에 실패했습니다.');
                      }
                    } catch (error) {
                      console.error('Slack notification error:', error);
                      alert('알림 전송 중 오류가 발생했습니다.');
                    }
                  }}
                  className='bg-green-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-600 transition-colors'
                >
                  테스트 알림
                </button>
                <button
                  onClick={() => window.open('/admin/notifications', '_blank')}
                  className='bg-blue-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-600 transition-colors'
                  title='알림 설정 관리 페이지 열기'
                >
                  설정 관리
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center p-8'>
              <Slack className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 mb-4'>
                알림 상태를 불러오지 못했습니다.
              </p>
              <button
                onClick={() => loadTabData('notification')}
                className='bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors'
              >
                다시 시도
              </button>
            </div>
          )}

          <button
            onClick={() =>
              handleStreamingRequest(
                '현재 시스템 알림 설정을 확인하고 개선 방안을 제안해주세요'
              )
            }
            className='w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors'
          >
            알림 설정 분석 요청
          </button>
        </div>
      );
    }

    // 🧠 관리자/학습 탭
    if (activeTab === 'admin') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              관리자 및 AI 학습
            </h3>
            <button
              onClick={() => window.open('/admin', '_blank')}
              className='text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1'
            >
              <span>새 창에서 열기</span>
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>

          <div className='grid grid-cols-1 gap-4'>
            <div className='bg-indigo-50 border border-indigo-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Brain className='w-5 h-5 text-indigo-600' />
                <span className='font-medium text-indigo-900'>
                  빠른 관리 메뉴
                </span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  onClick={() => window.open('/admin/ai-agent', '_blank')}
                  className='bg-indigo-100 text-indigo-800 py-2 px-3 rounded text-sm hover:bg-indigo-200 transition-colors'
                  title='AI 에이전트 관리 페이지 열기'
                >
                  AI 에이전트
                </button>
                <button
                  onClick={() =>
                    window.open('/admin/virtual-servers', '_blank')
                  }
                  className='bg-indigo-100 text-indigo-800 py-2 px-3 rounded text-sm hover:bg-indigo-200 transition-colors'
                  title='가상 서버 관리 페이지 열기'
                >
                  가상 서버
                </button>
                <button
                  onClick={() => window.open('/admin/smart-fallback', '_blank')}
                  className='bg-indigo-100 text-indigo-800 py-2 px-3 rounded text-sm hover:bg-indigo-200 transition-colors'
                  title='스마트 폴백 설정 페이지 열기'
                >
                  스마트 폴백
                </button>
                <button
                  onClick={() => window.open('/admin/mcp-monitoring', '_blank')}
                  className='bg-indigo-100 text-indigo-800 py-2 px-3 rounded text-sm hover:bg-indigo-200 transition-colors'
                  title='MCP 모니터링 페이지 열기'
                >
                  MCP 모니터링
                </button>
              </div>
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>시스템 통계</h4>
              <div className='space-y-1 text-sm text-gray-600'>
                <div className='flex justify-between'>
                  <span>활성 AI 에이전트:</span>
                  <span className='text-green-600 font-medium'>3개</span>
                </div>
                <div className='flex justify-between'>
                  <span>학습된 패턴:</span>
                  <span className='text-blue-600 font-medium'>127개</span>
                </div>
                <div className='flex justify-between'>
                  <span>처리된 쿼리:</span>
                  <span className='text-purple-600 font-medium'>1,234개</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleStreamingRequest(
                '관리자 페이지의 현재 상태를 요약하고 주요 관리 포인트를 알려주세요'
              )
            }
            className='w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors'
          >
            관리 상태 분석 요청
          </button>
        </div>
      );
    }

    // ⚙️ AI 설정 탭
    if (activeTab === 'ai-settings') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              AI 엔진 설정
            </h3>
            <button
              onClick={() => loadTabData('ai-settings')}
              disabled={isLoadingTab}
              className='p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50'
              title='AI 엔진 상태 새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingTab ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {isLoadingTab ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-rose-500' />
              <span className='ml-2 text-gray-600'>
                AI 엔진 상태 확인 중...
              </span>
            </div>
          ) : aiEngineStatus ? (
            <div className='space-y-4'>
              <div className='bg-rose-50 border border-rose-200 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <Database className='w-5 h-5 text-rose-600' />
                  <span className='font-medium text-rose-900'>
                    AI 엔진 상태
                  </span>
                </div>
                <div className='space-y-2'>
                  {Object.entries(aiEngineStatus.engines || {}).map(
                    ([engine, status]: [string, any]) => (
                      <div
                        key={engine}
                        className='flex items-center justify-between text-sm'
                      >
                        <span className='capitalize'>{engine}:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            status.status === 'healthy'
                              ? 'bg-green-100 text-green-800'
                              : status.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status.status || 'unknown'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <button
                  onClick={() => window.open('/admin/ai-analysis', '_blank')}
                  className='bg-rose-100 text-rose-800 py-2 px-3 rounded text-sm hover:bg-rose-200 transition-colors'
                  title='AI 분석 설정 페이지 열기'
                >
                  AI 분석 설정
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai/engines/status');
                      const status = await response.json();
                      console.log('AI Engine Status:', status);
                      alert('AI 엔진 상태가 콘솔에 출력되었습니다.');
                    } catch (error) {
                      console.error('AI engine check error:', error);
                      alert('AI 엔진 상태 확인 중 오류가 발생했습니다.');
                    }
                  }}
                  className='bg-rose-100 text-rose-800 py-2 px-3 rounded text-sm hover:bg-rose-200 transition-colors'
                  title='AI 엔진 상태 확인하기'
                >
                  상태 확인
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center p-8'>
              <Database className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 mb-4'>
                AI 엔진 상태를 불러오지 못했습니다.
              </p>
              <button
                onClick={() => loadTabData('ai-settings')}
                className='bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors'
              >
                다시 시도
              </button>
            </div>
          )}

          <button
            onClick={() =>
              handleStreamingRequest(
                '현재 AI 엔진들의 상태를 점검하고 최적화 방안을 제안해주세요'
              )
            }
            className='w-full bg-rose-500 text-white py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors'
          >
            AI 엔진 최적화 분석 요청
          </button>

          {/* AI 엔진 헬스 체크 상태 */}
          <div className='border-t border-gray-200 pt-4'>
            <AIHealthStatus />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex overflow-hidden w-[480px] ${className}`}
    >
      {/* 메인 컨텐츠 영역 (왼쪽) */}
      <div className='flex-1 flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg'>
              <span className='text-white text-sm font-bold'>AI</span>
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                AI 어시스턴트
              </h2>
              <p className='text-sm text-gray-600'>
                {FUNCTION_MENU.find(item => item.id === activeTab)
                  ?.description || 'AI와 자연어로 시스템 질의'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100'
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title='사이드바 닫기'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className='flex-1 overflow-hidden flex flex-col'>
          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
            {renderTabContent()}
          </div>

          {/* 하단 고정 영역 - 질문 탭에서만 표시 */}
          {activeTab === 'query' && (
            <div className='border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'>
              {/* 컴팩트 질문 프리셋 */}
              <div className='p-4 border-b border-gray-100 dark:border-gray-800'>
                <CompactQuestionTemplates
                  onQuestionSelect={handleStreamingRequest}
                  isProcessing={isProcessing}
                />
              </div>

              {/* 질문 입력창 */}
              <div className='p-4'>
                <QuestionInput
                  onSubmit={handleStreamingRequest}
                  isProcessing={isProcessing}
                  placeholder='AI에게 서버 관리에 대해 질문해보세요...'
                />
              </div>
            </div>
          )}

          {/* 히스토리 네비게이션 - 질문 탭에서만 표시 */}
          {activeTab === 'query' && conversations.length > 1 && (
            <div className='p-3 border-b border-gray-100 dark:border-gray-800'>
              <div className='flex items-center justify-between'>
                <button
                  onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex <= 0 || isProcessing}
                  className='p-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title='이전 대화'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                </button>

                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {currentIndex + 1} / {conversations.length}
                </span>

                <button
                  onClick={() =>
                    handleNavigate(
                      Math.min(conversations.length - 1, currentIndex + 1)
                    )
                  }
                  disabled={
                    currentIndex >= conversations.length - 1 || isProcessing
                  }
                  className='p-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title='다음 대화'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 푸터 */}
          <div className='p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'>
            <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
              <span>Powered by OpenManager AI</span>
              <span>{conversations.length}개 대화</span>
            </div>
          </div>
        </div>
      </div>

      {/* 기능 메뉴 (오른쪽) */}
      <div className='w-16 bg-gradient-to-b from-purple-500 to-pink-500 flex flex-col items-center py-2 gap-0.5'>
        {FUNCTION_MENU.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`relative group p-1 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-lg transform scale-110'
                  : 'hover:bg-white/20 hover:scale-105'
              }`}
              title={item.label}
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? item.color : 'text-white'
                }`}
              />

              {/* 툴팁 (왼쪽에 표시) */}
              <div className='absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
