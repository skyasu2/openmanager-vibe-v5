/**
 * 🤖 MCP 기반 서버 모니터링 에이전트 채팅
 * 
 * 특징:
 * - 생각과정 애니메이션
 * - 타이핑 효과 답변
 * - 실시간 인사이트
 * - 장애보고서 자동 생성
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useMCPMonitoring } from '@/hooks/api/useMCPMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  User, 
  Send, 
  Brain, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  FileText,
  Lightbulb
} from 'lucide-react';
import type { ThinkingStep, MonitoringInsight } from '@/core/mcp/ServerMonitoringAgent';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  thinkingSteps?: ThinkingStep[];
  insights?: MonitoringInsight[];
}

export default function MCPMonitoringChat() {
  const {
    isProcessing,
    isTyping,
    isConnected,
    error,
    currentQuery,
    response,
    thinkingSteps,
    currentStep,
    typedAnswer,
    typingProgress,
    insights,
    askQuestionStreaming,
    generateIncidentReport,
    checkAgentHealth,
    resetState,
    cancel,
    getThinkingProgress,
    getCurrentThinkingMessage
  } = useMCPMonitoring({ enableStreaming: true });

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showThinking, setShowThinking] = useState(true);
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 초기 에이전트 상태 확인
  useEffect(() => {
    checkAgentHealth();
  }, [checkAgentHealth]);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, typedAnswer, thinkingSteps]);

  // 응답 완료시 메시지 추가
  useEffect(() => {
    if (response && !isProcessing) {
      const newMessage: ChatMessage = {
        id: response.id,
        type: 'assistant',
        content: response.answer,
        timestamp: response.timestamp,
        thinkingSteps: response.thinkingSteps,
        insights: response.insights
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  }, [response, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing || !isConnected) return;

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // 스트리밍 질의응답 시작
    await askQuestionStreaming(query.trim());
    
    setQuery('');
    inputRef.current?.focus();
  };

  const handleQuickQuery = async (quickQuery: string) => {
    setQuery(quickQuery);
    await new Promise(resolve => setTimeout(resolve, 100)); // UI 업데이트 대기
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const renderThinkingSteps = () => {
    if (!showThinking || thinkingSteps.length === 0) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            AI 생각과정
            <Badge variant="outline" className="ml-auto">
              {Math.round(getThinkingProgress() * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={getThinkingProgress() * 100} className="h-2" />
          
          {thinkingSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-1">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : step.status === 'error' ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
                {step.duration && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {step.duration}ms
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {currentStep && (
            <div className="text-sm text-blue-600 font-medium animate-pulse">
              {getCurrentThinkingMessage()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTypingAnswer = () => {
    if (!isTyping && !typedAnswer) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600" />
            AI 응답
            {isTyping && (
              <Badge variant="secondary" className="ml-auto">
                타이핑 중... {Math.round(typingProgress * 100)}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">
            {typedAnswer}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
          {isTyping && (
            <Progress value={typingProgress * 100} className="h-1 mt-2" />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderInsights = (messageInsights?: MonitoringInsight[]) => {
    const insightsToRender = messageInsights || insights;
    if (insightsToRender.length === 0) return null;

    const filteredInsights = selectedInsightType === 'all' 
      ? insightsToRender 
      : insightsToRender.filter(insight => insight.type === selectedInsightType);

    const getInsightIcon = (type: MonitoringInsight['type']) => {
      switch (type) {
        case 'performance': return <Zap className="w-4 h-4" />;
        case 'cost': return <DollarSign className="w-4 h-4" />;
        case 'security': return <Shield className="w-4 h-4" />;
        case 'availability': return <Activity className="w-4 h-4" />;
        case 'trend': return <TrendingUp className="w-4 h-4" />;
        default: return <Lightbulb className="w-4 h-4" />;
      }
    };

    const getImpactColor = (impact: MonitoringInsight['impact']) => {
      switch (impact) {
        case 'high': return 'text-red-600 bg-red-100';
        case 'medium': return 'text-yellow-600 bg-yellow-100';
        case 'low': return 'text-green-600 bg-green-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            스마트 인사이트
            <div className="ml-auto flex gap-1">
              {['all', 'performance', 'cost', 'availability', 'security', 'trend'].map(type => (
                <Button
                  key={type}
                  variant={selectedInsightType === type ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setSelectedInsightType(type)}
                >
                  {type === 'all' ? '전체' : type}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredInsights.map((insight, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-blue-600">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      신뢰도 {Math.round(insight.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    💡 {insight.recommendation}
                  </p>
                  {insight.estimatedCost && (
                    <p className="text-xs text-green-600 mt-1">
                      예상 절약: ${insight.estimatedCost}
                    </p>
                  )}
                  {insight.affectedServers.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      영향받는 서버: {insight.affectedServers.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const quickQueries = [
    '현재 서버 상태는 어떤가요?',
    '장애가 발생한 서버가 있나요?',
    '성능 분석 결과를 알려주세요',
    '비용 최적화 방안을 추천해주세요',
    '시스템 예측 분석을 해주세요',
    '전체적인 개선방안을 제안해주세요'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            MCP 서버 모니터링 AI 어시스턴트
            <div className="ml-auto flex items-center gap-2">
              {isConnected ? (
                <Badge variant="secondary" className="text-green-600 bg-green-100">
                  연결됨
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-red-600 bg-red-100">
                  연결 안됨
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={checkAgentHealth}
                disabled={isProcessing}
              >
                상태 확인
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 빠른 질의 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">빠른 질의</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickQueries.map((quickQuery, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left"
                onClick={() => handleQuickQuery(quickQuery)}
                disabled={isProcessing || !isConnected}
              >
                {quickQuery}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 채팅 영역 */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            대화
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThinking(!showThinking)}
              >
                {showThinking ? '생각과정 숨기기' : '생각과정 보기'}
              </Button>
              {isProcessing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancel}
                >
                  중단
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
                disabled={isProcessing}
              >
                초기화
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 스크롤 영역 */}
          <div 
            className="h-[500px] overflow-y-auto pr-4" 
            ref={scrollAreaRef}
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    </div>
                  </div>
                  
                  {/* 메시지별 인사이트 */}
                  {message.insights && renderInsights(message.insights)}
                </div>
              ))}

              {/* 현재 진행중인 응답 */}
              {isProcessing && (
                <div className="space-y-4">
                  {renderThinkingSteps()}
                  {renderTypingAnswer()}
                </div>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t my-4" />
          
          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="서버에 대해 궁금한 것을 물어보세요..."
              disabled={isProcessing || !isConnected}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <Button 
              type="submit" 
              disabled={!query.trim() || isProcessing || !isConnected}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 현재 인사이트 */}
      {insights.length > 0 && renderInsights()}
    </div>
  );
} 