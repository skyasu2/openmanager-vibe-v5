'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Brain,
  RefreshCw,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Settings,
  Play,
  Pause,
  BarChart3,
  Calendar,
  Clock4,
  Zap,
} from 'lucide-react';

interface GeminiLearningStatus {
  enabled: boolean;
  dailyRequestCount: number;
  maxDailyRequests: number;
  remainingRequests: number;
  pendingSuggestions: number;
  lastReset: string;
  config: {
    batchSize: number;
    requestInterval: number;
    confidenceThreshold: number;
  };
}

interface ContextSuggestion {
  id: string;
  title: string;
  type: 'document' | 'pattern' | 'template' | 'knowledge';
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImprovement: number;
  sourceLogCount: number;
  reasoning: string;
  timestamp: string;
}

interface LearningExecutionResult {
  success: boolean;
  message: string;
  suggestionsCount: number;
  executionTime: number;
  suggestions: ContextSuggestion[];
  timestamp: string;
}

export default function GeminiLearningDashboard() {
  const [status, setStatus] = useState<GeminiLearningStatus | null>(null);
  const [suggestions, setSuggestions] = useState<ContextSuggestion[]>([]);
  const [executionHistory, setExecutionHistory] = useState<
    LearningExecutionResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadStatus();
    loadSuggestions();
    loadExecutionHistory();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/gemini-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error('상태 로드 실패:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('제안 로드 실패:', error);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/history');
      if (response.ok) {
        const data = await response.json();
        setExecutionHistory(data.history || []);
      }
    } catch (error) {
      console.error('실행 히스토리 로드 실패:', error);
    }
  };

  const executeManualLearning = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/cron/gemini-learning', {
        method: 'POST',
        headers: {
          'x-session-id': 'admin-session-id', // 실제 구현에서는 세션 ID 사용
        },
      });

      const result = await response.json();

      if (result.success) {
        // 상태 및 데이터 새로고침
        await loadStatus();
        await loadSuggestions();
        await loadExecutionHistory();

        alert(`✅ 학습 분석 완료!\n${result.message}`);
      } else {
        alert(`❌ 학습 분석 실패:\n${result.error}`);
      }
    } catch (error) {
      console.error('수동 실행 실패:', error);
      alert('수동 실행 중 오류가 발생했습니다.');
    } finally {
      setIsExecuting(false);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    await Promise.all([
      loadStatus(),
      loadSuggestions(),
      loadExecutionHistory(),
    ]);
    setIsLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'pattern':
        return '🔍';
      case 'template':
        return '📝';
      case 'knowledge':
        return '🧠';
      default:
        return '💡';
    }
  };

  if (!status) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
        <span className='ml-2'>Gemini 학습 상태 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Brain className='w-6 h-6 text-purple-600' />
            🤖 Gemini 학습 엔진
          </h2>
          <p className='text-gray-600 mt-1'>
            실패 로그 기반 자동 컨텍스트 개선 시스템
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={refreshAll}
            disabled={isLoading}
            variant='outline'
            size='sm'
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
          <Button
            onClick={executeManualLearning}
            disabled={
              isExecuting || !status.enabled || status.remainingRequests <= 0
            }
            size='sm'
          >
            <Play
              className={`w-4 h-4 mr-2 ${isExecuting ? 'animate-pulse' : ''}`}
            />
            {isExecuting ? '분석 중...' : '수동 실행'}
          </Button>
        </div>
      </div>

      {/* 상태 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>엔진 상태</p>
                <div className='flex items-center gap-2 mt-1'>
                  <div
                    className={`w-2 h-2 rounded-full ${status.enabled ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span className='font-semibold'>
                    {status.enabled ? '활성화' : '비활성화'}
                  </span>
                </div>
              </div>
              <Settings className='w-5 h-5 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>일일 할당량</p>
                <p className='text-xl font-bold'>
                  {status.remainingRequests} / {status.maxDailyRequests}
                </p>
                <div className='w-full bg-gray-200 rounded-full h-1 mt-2'>
                  <div
                    className='bg-purple-600 h-1 rounded-full'
                    style={{
                      width: `${(status.dailyRequestCount / status.maxDailyRequests) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <BarChart3 className='w-5 h-5 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>대기 제안</p>
                <p className='text-xl font-bold'>{suggestions.length}</p>
                <p className='text-xs text-gray-500 mt-1'>관리자 승인 대기</p>
              </div>
              <Lightbulb className='w-5 h-5 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>마지막 리셋</p>
                <p className='text-sm font-semibold'>
                  {new Date(status.lastReset).toLocaleDateString('ko-KR')}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {new Date(status.lastReset).toLocaleTimeString('ko-KR')}
                </p>
              </div>
              <Clock4 className='w-5 h-5 text-gray-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue='suggestions' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='suggestions'>개선 제안</TabsTrigger>
          <TabsTrigger value='history'>실행 히스토리</TabsTrigger>
          <TabsTrigger value='config'>설정</TabsTrigger>
        </TabsList>

        <TabsContent value='suggestions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Lightbulb className='w-5 h-5' />
                컨텍스트 개선 제안 ({suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Lightbulb className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>현재 대기 중인 개선 제안이 없습니다.</p>
                  <p className='text-sm mt-1'>
                    실패 로그가 분석되면 자동으로 제안이 생성됩니다.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-lg'>
                              {getTypeIcon(suggestion.type)}
                            </span>
                            <h4 className='font-semibold'>
                              {suggestion.title}
                            </h4>
                            <Badge
                              className={getPriorityColor(suggestion.priority)}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>
                            {suggestion.reasoning}
                          </p>
                          <div className='flex items-center gap-4 text-xs text-gray-500'>
                            <span>
                              신뢰도: {Math.round(suggestion.confidence * 100)}%
                            </span>
                            <span>
                              개선 예상:{' '}
                              {Math.round(
                                suggestion.estimatedImprovement * 100
                              )}
                              %
                            </span>
                            <span>
                              소스 로그: {suggestion.sourceLogCount}개
                            </span>
                            <span>
                              {new Date(
                                suggestion.timestamp
                              ).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='w-5 h-5' />
                실행 히스토리
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executionHistory.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Clock className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>실행 히스토리가 없습니다.</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {executionHistory.map((execution, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        {execution.success ? (
                          <CheckCircle className='w-5 h-5 text-green-600' />
                        ) : (
                          <AlertTriangle className='w-5 h-5 text-red-600' />
                        )}
                        <div>
                          <p className='font-medium'>{execution.message}</p>
                          <p className='text-sm text-gray-600'>
                            제안 {execution.suggestionsCount}개 • 실행시간{' '}
                            {execution.executionTime}ms
                          </p>
                        </div>
                      </div>
                      <div className='text-sm text-gray-500'>
                        {new Date(execution.timestamp).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='config' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='w-5 h-5' />
                학습 엔진 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>배치 크기</label>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <span className='text-lg font-bold'>
                      {status.config.batchSize}
                    </span>
                    <p className='text-xs text-gray-600'>개 로그/배치</p>
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>요청 간격</label>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <span className='text-lg font-bold'>
                      {status.config.requestInterval}
                    </span>
                    <p className='text-xs text-gray-600'>초</p>
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>신뢰도 임계값</label>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <span className='text-lg font-bold'>
                      {Math.round(status.config.confidenceThreshold * 100)}%
                    </span>
                    <p className='text-xs text-gray-600'>제안 생성 기준</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
