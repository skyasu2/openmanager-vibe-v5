/**
 * 🎯 하이브리드 AI 데모 컴포넌트
 * 
 * 무료 티어 최적화된 AI 시스템 시연
 * - 실시간 생각중 상태 표시
 * - 캐시 히트율 시각화
 * - 서비스별 응답 시간 표시
 */

'use client';

import { useState } from 'react';
import { useHybridAI } from '@/hooks/useHybridAI-v2';
import type { UnifiedAIResponse } from '@/services/ai/formatters/unified-response-formatter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Database, Brain, Server, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// 샘플 질문들
const SAMPLE_QUESTIONS = [
  '서버 모니터링의 주요 지표는 무엇인가요?',
  'Redis 캐싱 전략을 설명해주세요',
  'Kubernetes 클러스터 상태를 확인하는 방법은?',
  '네트워크 지연 시간을 줄이는 방법은?',
  'CPU 사용률이 높을 때 대처 방법은?',
  '한국어로 서버 상태를 모니터링하는 방법은?', // 한국어 NLP 테스트
];

// 서비스 아이콘 매핑
const SERVICE_ICONS = {
  'redis-cache': <Database className="w-4 h-4" />,
  'supabase-rag': <Brain className="w-4 h-4" />,
  'gcp-korean-nlp': <Server className="w-4 h-4" />,
  'gcp-ml-analytics': <Zap className="w-4 h-4" />,
  'edge-router': <Zap className="w-4 h-4 text-blue-500" />,
  'google-ai': <Brain className="w-4 h-4 text-blue-500" />,
  'local-rag': <Database className="w-4 h-4 text-green-500" />,
  'korean-nlp': <Server className="w-4 h-4 text-purple-500" />,
} as const;

// 서비스 색상 매핑
const SERVICE_COLORS = {
  'redis-cache': 'bg-red-100 text-red-800',
  'supabase-rag': 'bg-green-100 text-green-800',
  'gcp-korean-nlp': 'bg-blue-100 text-blue-800',
  'gcp-ml-analytics': 'bg-purple-100 text-purple-800',
  'edge-router': 'bg-gray-100 text-gray-800',
  'google-ai': 'bg-blue-100 text-blue-800',
  'local-rag': 'bg-green-100 text-green-800',
  'korean-nlp': 'bg-purple-100 text-purple-800',
} as const;

// 연결 상태 표시 컴포넌트
function ConnectionStatus({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) {
  const statusConfig = {
    connecting: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      text: '연결 중...',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    connected: {
      icon: <Wifi className="w-4 h-4" />,
      text: 'Realtime 연결됨',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    disconnected: {
      icon: <WifiOff className="w-4 h-4" />,
      text: '연결 끊김',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant="secondary" 
      className={cn(config.bgColor, config.color, 'flex items-center gap-1')}
    >
      {config.icon}
      <span>{config.text}</span>
    </Badge>
  );
}

export function HybridAIDemo() {
  const [query, setQuery] = useState('');
  const {
    isLoading,
    response,
    thinkingSteps,
    error,
    stats,
    isStreaming,
    cacheSize,
    queueSize,
    connectionStatus,
    query: submitQuery,
    clearCache,
    resetStats,
  } = useHybridAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    await submitQuery(query);
  };

  const handleSampleQuestion = (question: string) => {
    setQuery(question);
    submitQuery(question);
  };

  // 캐시 히트율 계산
  const cacheHitRate = stats.totalRequests > 0
    ? Math.round((stats.cacheHits / stats.totalRequests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🎯 하이브리드 AI 시스템 데모 v2</CardTitle>
              <CardDescription>
                Supabase Realtime + GCP + Upstash Redis 기반 분산 AI 아키텍처
              </CardDescription>
            </div>
            <ConnectionStatus status={connectionStatus} />
          </div>
        </CardHeader>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">총 요청</div>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">캐시 히트율</div>
            <div className="text-2xl font-bold">{cacheHitRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">평균 응답시간</div>
            <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">로컬 캐시</div>
            <div className="text-2xl font-bold">{cacheSize} / {queueSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* 질문 입력 */}
      <Card>
        <CardHeader>
          <CardTitle>AI에게 질문하기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="서버 모니터링에 대해 물어보세요..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리중
                  </>
                ) : (
                  '질문하기'
                )}
              </Button>
            </div>

            {/* 샘플 질문 */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 생각중 단계 (실시간) */}
      {(isStreaming || thinkingSteps.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`h-4 w-4 ${isStreaming ? 'animate-spin' : ''}`} />
              생각중... (Supabase Realtime)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {thinkingSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : step.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.step}</span>
                      {step.service && SERVICE_ICONS[step.service as keyof typeof SERVICE_ICONS] && (
                        <Badge 
                          variant="secondary" 
                          className={SERVICE_COLORS[step.service as keyof typeof SERVICE_COLORS] || 'bg-gray-100 text-gray-800'}
                        >
                          {SERVICE_ICONS[step.service as keyof typeof SERVICE_ICONS]}
                          <span className="ml-1">{step.service}</span>
                        </Badge>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    )}
                    {step.duration && (
                      <p className="text-xs text-muted-foreground">{step.duration}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 응답 결과 */}
      {response && !isLoading && (response as UnifiedAIResponse).answer && (
          <Card>
            <CardHeader>
              <CardTitle>AI 응답</CardTitle>
              <CardDescription>
                {(response as UnifiedAIResponse).metadata?.mode || 'hybrid'} 모드 | 
                신뢰도: {Math.round(((response as UnifiedAIResponse).confidence || 0) * 100)}% | 
                {(response as UnifiedAIResponse).metadata?.cacheHit ? ' 캐시 히트 ✓' : ' 새로운 응답'} |
                엔진: {((response as UnifiedAIResponse).additionalData?.engine as string) || 'unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 답변 */}
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{(response as UnifiedAIResponse).answer}</p>
              </div>

              {/* 처리 정보 */}
              {(response as UnifiedAIResponse).processing && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">처리 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {(response as UnifiedAIResponse).processing.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="flex items-center gap-1">
                          {SERVICE_ICONS[service.name as keyof typeof SERVICE_ICONS] || <Server className="w-4 h-4" />}
                          {service.name}
                        </span>
                        <span className="text-muted-foreground">{service.time}ms</span>
                      </div>
                    ))}
                  </div>
                  {(response as UnifiedAIResponse).processing.totalTime && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      총 처리 시간: {(response as UnifiedAIResponse).processing.totalTime}ms
                    </div>
                  )}
                </div>
              )}

              {/* 소스 정보 */}
              {(() => {
                const typedResponse = response as UnifiedAIResponse;
                return typedResponse.context?.sources && typedResponse.context.sources.length > 0 ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">참조 소스</h4>
                    <div className="space-y-2">
                      {typedResponse.context.sources.map((source, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded">
                          <Badge variant="outline" className="mb-1">
                            {source.type} | 관련도: {Math.round(source.relevance * 100)}%
                          </Badge>
                          <p className="text-muted-foreground line-clamp-2">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* 한국어 NLP 정보 (있는 경우) */}
              {(() => {
                const typedResponse = response as UnifiedAIResponse;
                return typedResponse.additionalData?.koreanNLP ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">한국어 분석 정보</h4>
                    <div className="text-sm space-y-1">
                      <p>의도: {(typedResponse.additionalData.intent as string) || '분석 중'}</p>
                      {typedResponse.additionalData.entities && Array.isArray(typedResponse.additionalData.entities) && typedResponse.additionalData.entities.length > 0 ? (
                        <p>엔티티: {(typedResponse.additionalData.entities as any[]).map((e: any) => 
                          typeof e === 'object' && e !== null && 'type' in e && 'value' in e ? `${e.type}(${e.value})` : ''
                        ).filter(Boolean).join(', ')}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        )}

      {/* 에러 표시 */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관리 버튼 */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={clearCache}>
          캐시 초기화
        </Button>
        <Button variant="outline" onClick={resetStats}>
          통계 리셋
        </Button>
      </div>
    </div>
  );
}