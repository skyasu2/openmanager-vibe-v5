'use client';

/**
 * 🤖 AI 사이드바 전체 기능 통합 컴포넌트
 *
 * - 자연어 질의 입력 (순환하는 질문 예시)
 * - 채팅 인터페이스
 * - 실시간 보고서 생성
 * - AI 인사이트 표시
 * - ✅ 실제 서버 데이터 기반 응답
 */

import {
  AlertTriangle,
  Bot,
  Brain,
  Clock,
  FileText,
  Lightbulb,
  Send,
  TrendingUp,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AIAssistantIconPanel, {
  type AIAssistantFunction,
} from '@/components/ai/AIAssistantIconPanel';
// AIModeSelector 제거 - 지능형 라우팅으로 자동 선택
import FreeTierMonitor from '@/components/ai/FreeTierMonitor';
import ThinkingProcessVisualizer from '@/components/ai/ThinkingProcessVisualizer';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import type { ThinkingStep } from '@/domains/ai-sidebar/types/ai-sidebar-types';
import type { EnhancedServerMetrics } from '@/types/server';
import AIInsightsCard from './AIInsightsCard';

/**
 * Helper function to extract numeric value from ServerMetrics union type
 */
function extractNumericValue(
  value:
    | number
    | { usage: number; [key: string]: unknown }
    | { in: number; out: number; [key: string]: unknown }
    | { used: number; [key: string]: unknown }
): number {
  if (typeof value === 'number') {
    return value;
  }
  // Handle network type with 'in' and 'out'
  if ('in' in value && 'out' in value) {
    const inValue = typeof value.in === 'number' ? value.in : 0;
    const outValue = typeof value.out === 'number' ? value.out : 0;
    return (inValue + outValue) / 2; // Average of in/out
  }
  // Handle disk type with 'used'
  if ('used' in value && typeof value.used === 'number') {
    return value.used;
  }
  // Handle other types with 'usage'
  if ('usage' in value && typeof value.usage === 'number') {
    return value.usage;
  }
  return 0;
}

interface AISidebarContentProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type?: 'text' | 'report' | 'analysis';
  error?: boolean;
  thinkingSteps?: ThinkingStep[];
  engine?: string;
  responseTime?: number;
}

// 질문 예시 배열
const QUESTION_EXAMPLES = [
  '현재 시스템의 전반적인 성능 상태는 어떤가요?',
  'CPU 사용률이 높은 서버들을 분석해주세요',
  '메모리 사용량 트렌드를 분석해주세요',
  '보안상 위험한 서버나 패턴이 있나요?',
  '향후 1시간 내 장애 가능성이 있는 서버는?',
  '전체 인프라의 상태를 종합적으로 분석해주세요',
];

export default function AISidebarContent({ onClose }: AISidebarContentProps) {
  // 실시간 서버 데이터 가져오기
  const servers = useServerDataStore(
    (state: { servers: EnhancedServerMetrics[] }) => state.servers
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content:
        '안녕하세요! 실시간 서버 데이터 기반으로 시스템 모니터링 분석을 제공합니다. 질문을 입력해주세요.',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'reports' | 'insights'>(
    'chat'
  );
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  // AI 모드는 지능형 라우팅으로 자동 선택 (사용자 선택 불필요)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🚀 실제 AI API 호출
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        // 실시간 서버 통계 계산
        const totalServers = servers.length;
        const onlineServers = servers.filter(
          (s: EnhancedServerMetrics) => s.status === 'online'
        ).length;
        const warningServers = servers.filter(
          (s: EnhancedServerMetrics) => s.status === 'warning'
        ).length;
        const criticalServers = servers.filter(
          (s: EnhancedServerMetrics) => s.status === 'critical'
        ).length;

        const avgCpu =
          servers.length > 0
            ? Math.round(
                servers.reduce(
                  (sum: number, s: EnhancedServerMetrics) =>
                    sum + extractNumericValue(s.cpu ?? 0),
                  0
                ) / servers.length
              )
            : 0;
        const avgMemory =
          servers.length > 0
            ? Math.round(
                servers.reduce(
                  (sum: number, s: EnhancedServerMetrics) =>
                    sum + extractNumericValue(s.memory ?? 0),
                  0
                ) / servers.length
              )
            : 0;

        // 🎯 실제 API 호출 (지능형 라우팅 자동 선택)
        const response = await fetch('/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: content,
            context: 'dashboard',
            // mode 제거 - 백엔드에서 자동 라우팅
            temperature: 0.7,
            maxTokens: 1000,
            includeThinking: true, // 사고 과정 포함
            // 실시간 서버 메타데이터 포함
            metadata: {
              totalServers,
              onlineServers,
              warningServers,
              criticalServers,
              avgCpu,
              avgMemory,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();

        // AI 응답을 메시지로 추가 (사고 과정 포함)
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response || data.answer || '응답을 받지 못했습니다.',
          role: 'assistant',
          timestamp: new Date(),
          type: content.includes('보고서') ? 'report' : 'text',
          thinkingSteps: data.thinkingSteps || [],
          engine: data.engine,
          responseTime: data.responseTime,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // 성공 로그
        console.log('✅ AI 응답 성공:', {
          engine: data.engine,
          responseTime: data.responseTime,
          confidence: data.confidence,
        });
      } catch (error) {
        console.error('❌ AI API 호출 실패:', error);

        // 에러 메시지 추가
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `죄송합니다. 일시적인 오류가 발생했습니다.\n\n현재 ${servers.length}개의 서버가 모니터링 중입니다:\n- 정상: ${servers.filter((s: EnhancedServerMetrics) => s.status === 'online').length}개\n- 경고: ${servers.filter((s: EnhancedServerMetrics) => s.status === 'warning').length}개\n- 심각: ${servers.filter((s: EnhancedServerMetrics) => s.status === 'critical').length}개\n\n잠시 후 다시 시도해주세요.`,
          role: 'assistant',
          timestamp: new Date(),
          error: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, servers]
  );

  // AI 기능 변경 시 자동 처리
  useEffect(() => {
    if (selectedFunction === 'auto-report') {
      // 자동 장애 보고서 생성
      void handleSendMessage('시스템 전체 장애 보고서를 생성해주세요');
      // 채팅 탭으로 자동 전환
      setActiveTab('chat');
      // auto-report 실행 후 다시 chat으로 돌아가기
      setTimeout(() => setSelectedFunction('chat'), 100);
    } else if (selectedFunction === 'free-tier-monitor') {
      // 무료 티어 모니터 탭으로 전환
      setActiveTab('insights');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction, handleSendMessage]);

  // Placeholder 순환 (5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % QUESTION_EXAMPLES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col bg-white shadow-lg">
      {/* 헤더 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                AI 어시스턴트
              </h2>
              <p className="text-xs text-gray-500">
                실시간 {servers.length}개 서버 분석
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI 기능 아이콘 패널 */}
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              isMobile={true}
              className="max-w-xs"
            />
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mt-4 flex gap-1">
          {[
            { id: 'chat', label: '채팅', icon: Bot },
            { id: 'reports', label: '보고서', icon: FileText },
            { id: 'insights', label: '인사이트', icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'chat' | 'reports' | 'insights')
              }
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <>
            {/* AI 모드 선택기 제거 - 지능형 라우팅 자동 선택 */}

            {/* 채팅 메시지 */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}
                  >
                    {/* 사고 과정 시각화 (AI 응답만) */}
                    {message.role === 'assistant' &&
                      message.thinkingSteps &&
                      message.thinkingSteps.length > 0 && (
                        <div className="mb-2">
                          <ThinkingProcessVisualizer
                            steps={message.thinkingSteps}
                            isActive={false}
                          />
                        </div>
                      )}

                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.error
                            ? 'border border-red-200 bg-red-50 text-red-800'
                            : message.type === 'report'
                              ? 'border border-purple-200 bg-purple-50'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <div
                        className={`mt-1 flex items-center justify-between text-xs opacity-70 ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        <span>
                          {message.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {message.engine && message.responseTime && (
                          <span className="ml-2">
                            {message.engine} · {message.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'order-1 mr-2 bg-blue-500'
                        : 'order-2 ml-2 bg-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 p-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <span className="text-sm">AI 분석 중...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      void handleSendMessage(inputValue);
                    }
                  }}
                  placeholder={QUESTION_EXAMPLES[placeholderIndex]}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    void handleSendMessage(inputValue);
                  }}
                  disabled={!inputValue.trim() || isLoading}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium text-gray-800">
                    실시간 시스템 리포트
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 총 서버: {servers.length}개</div>
                  <div>
                    • 정상:{' '}
                    {
                      servers.filter(
                        (s: EnhancedServerMetrics) => s.status === 'online'
                      ).length
                    }
                    개
                  </div>
                  <div>
                    • 경고:{' '}
                    {
                      servers.filter(
                        (s: EnhancedServerMetrics) => s.status === 'warning'
                      ).length
                    }
                    개
                  </div>
                  <div>
                    • 심각:{' '}
                    {
                      servers.filter(
                        (s: EnhancedServerMetrics) => s.status === 'critical'
                      ).length
                    }
                    개
                  </div>
                  <div>
                    • 마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  void handleSendMessage(
                    '시스템 전체 장애 보고서를 생성해주세요'
                  );
                }}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-3 font-medium text-white transition-all hover:from-green-600 hover:to-emerald-700"
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  상세 보고서 생성
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    void handleSendMessage('성능 분석 보고서');
                  }}
                  className="rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  성능 분석
                </button>
                <button
                  onClick={() => {
                    void handleSendMessage('보안 상태 보고서');
                  }}
                  className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  보안 점검
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="overflow-y-auto p-4">
            {/* 무료 티어 모니터 (선택 시 상단 표시) */}
            {selectedFunction === 'free-tier-monitor' && (
              <div className="mb-4">
                <FreeTierMonitor />
              </div>
            )}

            <AIInsightsCard className="mb-4" />

            {/* 🆕 Phase 3A: AI Analysis & Trends Visualization */}
            <div className="mb-4 space-y-3">
              {servers.map(
                (server) =>
                  server.aiAnalysis &&
                  server.trends && (
                    <div
                      key={server.id}
                      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
                    >
                      {/* Server Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {server.name}
                          </h4>
                          <p className="text-xs text-gray-500">{server.ip}</p>
                        </div>
                        {/* Anomaly Score Badge */}
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            server.aiAnalysis.anomalyScore > 0.7
                              ? 'bg-red-100 text-red-700'
                              : server.aiAnalysis.anomalyScore > 0.4
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          이상도:{' '}
                          {(server.aiAnalysis.anomalyScore * 100).toFixed(0)}%
                        </div>
                      </div>

                      {/* Trends */}
                      <div className="grid grid-cols-4 gap-2">
                        {(['cpu', 'memory', 'disk', 'network'] as const).map(
                          (metric) => {
                            const trend = server.trends![metric];
                            return (
                              <div key={metric} className="text-center">
                                <div className="mb-1 text-xs uppercase text-gray-500">
                                  {metric}
                                </div>
                                <div
                                  className={`text-lg font-semibold ${
                                    trend === 'increasing'
                                      ? 'text-red-600'
                                      : trend === 'decreasing'
                                        ? 'text-blue-600'
                                        : 'text-gray-600'
                                  }`}
                                >
                                  {trend === 'increasing'
                                    ? '↑'
                                    : trend === 'decreasing'
                                      ? '↓'
                                      : '→'}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Predicted Issues */}
                      {server.aiAnalysis.predictedIssues.length > 0 && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <h5 className="text-sm font-medium text-gray-700">
                              예측된 문제
                            </h5>
                          </div>
                          <ul className="space-y-1">
                            {server.aiAnalysis.predictedIssues.map(
                              (issue, i) => (
                                <li key={i} className="text-xs text-orange-700">
                                  • {issue}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {server.aiAnalysis.recommendations.length > 0 && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-purple-500" />
                            <h5 className="text-sm font-medium text-gray-700">
                              권장 사항
                            </h5>
                          </div>
                          <ul className="space-y-1">
                            {server.aiAnalysis.recommendations
                              .slice(0, 3)
                              .map((rec, i) => (
                                <li key={i} className="text-xs text-purple-700">
                                  {rec}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Confidence */}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <span className="text-xs text-gray-500">
                          분석 신뢰도
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${
                                server.aiAnalysis.confidence > 0.7
                                  ? 'bg-green-500'
                                  : server.aiAnalysis.confidence > 0.4
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${server.aiAnalysis.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {(server.aiAnalysis.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-purple-800">AI 추천</h3>
                </div>
                <p className="text-sm text-purple-700">
                  {servers.filter(
                    (s: EnhancedServerMetrics) => s.status === 'critical'
                  ).length > 0
                    ? `심각 상태 서버 ${servers.filter((s: EnhancedServerMetrics) => s.status === 'critical').length}개를 즉시 확인하세요.`
                    : servers.filter(
                          (s: EnhancedServerMetrics) => s.status === 'warning'
                        ).length > 0
                      ? `경고 상태 서버 ${servers.filter((s: EnhancedServerMetrics) => s.status === 'warning').length}개를 모니터링하세요.`
                      : '모든 서버가 정상 상태입니다.'}
                </p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">주의 사항</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  평균 CPU 사용률:{' '}
                  {servers.length > 0
                    ? Math.round(
                        servers.reduce(
                          (sum: number, s: EnhancedServerMetrics) =>
                            sum + extractNumericValue(s.cpu ?? 0),
                          0
                        ) / servers.length
                      )
                    : 0}
                  %
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-green-800">시스템 상태</h3>
                </div>
                <p className="text-sm text-green-700">
                  {servers.length}개 서버 중{' '}
                  {
                    servers.filter(
                      (s: EnhancedServerMetrics) => s.status === 'online'
                    ).length
                  }
                  개가 정상 동작 중입니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
