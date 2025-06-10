'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PatternQueryResult {
  confidenceScore: number;
  matchedPatterns: string[];
  sourceContext: 'basic' | 'advanced' | 'custom';
  fallbackLevel: number;
  response: string;
  dynamicMetrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network_in?: number;
    network_out?: number;
    responseTime?: number;
  };
  metaData: {
    queryAnalysis: {
      keywords: string[];
      intent: string;
      complexity: 'simple' | 'moderate' | 'complex';
    };
    responseGeneration: {
      templateUsed: string;
      contextDocuments: string[];
      healthDataIntegrated: boolean;
    };
  };
}

/**
 * 🧠 AI 에이전트 고도화 패턴 매칭 데모 페이지
 */
export default function PatternDemoPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PatternQueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 예시 질의들
  const exampleQueries = [
    'CPU랑 메모리가 동시에 높아요',
    'CPU가 많이 올라갔어요',
    '메모리 부족해요',
    '디스크 용량이 꽉 찼어요',
    '네트워크가 느려요',
    '서버가 전체적으로 느려요',
    '시스템 상태 확인',
    '프로세서 과부하 문제',
  ];

  const handleQuery = async () => {
    if (!query.trim()) {
      setError('질의를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-agent/pattern-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || '요청 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('API 호출 중 오류가 발생했습니다.');
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFallbackLevelText = (level: number) => {
    switch (level) {
      case 1:
        return 'Primary (고신뢰도)';
      case 2:
        return 'Secondary (중신뢰도)';
      case 3:
        return 'Fallback (저신뢰도)';
      default:
        return `Level ${level}`;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold text-gray-900'>
          🧠 AI 에이전트 고도화 패턴 매칭 시스템
        </h1>
        <p className='text-gray-600'>
          다중 패턴 매칭 + 서버 상태 진단 연계 + 신뢰도 기반 응답 시스템
        </p>
      </div>

      {/* 질의 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 질의 입력</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex space-x-2'>
            <input
              type='text'
              placeholder='질의를 입력하세요 (예: CPU랑 메모리가 동시에 높아요)'
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === 'Enter' && handleQuery()
              }
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Button
              onClick={handleQuery}
              disabled={loading}
              className='min-w-[100px]'
            >
              {loading ? '분석 중...' : '분석하기'}
            </Button>
          </div>

          {/* 예시 질의 버튼들 */}
          <div className='space-y-2'>
            <p className='text-sm text-gray-600 font-medium'>💡 예시 질의:</p>
            <div className='flex flex-wrap gap-2'>
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant='outline'
                  size='sm'
                  onClick={() => setQuery(example)}
                  className='text-xs'
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-600 text-sm'>❌ {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {result && (
        <div className='space-y-6'>
          {/* 메인 응답 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                💬 AI 응답
                <Badge className={getConfidenceColor(result.confidenceScore)}>
                  신뢰도: {(result.confidenceScore * 100).toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-gray-800 leading-relaxed'>
                  {result.response}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 매칭 정보 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>🎯 패턴 매칭 정보</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    매칭된 패턴:
                  </p>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {result.matchedPatterns.map((pattern, index) => (
                      <Badge key={index} variant='secondary'>
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    응답 단계:
                  </p>
                  <Badge variant='outline'>
                    {getFallbackLevelText(result.fallbackLevel)}
                  </Badge>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    문서 출처:
                  </p>
                  <Badge variant='outline'>{result.sourceContext}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 쿼리 분석 */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 쿼리 분석</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>키워드:</p>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {result.metaData.queryAnalysis.keywords.map(
                      (keyword, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='text-xs'
                        >
                          {keyword}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-600'>의도:</p>
                  <Badge variant='outline'>
                    {result.metaData.queryAnalysis.intent}
                  </Badge>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-600'>복잡도:</p>
                  <Badge
                    className={getComplexityColor(
                      result.metaData.queryAnalysis.complexity
                    )}
                  >
                    {result.metaData.queryAnalysis.complexity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 동적 메트릭 데이터 */}
          {result.dynamicMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>📊 실시간 시스템 메트릭</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
                  {Object.entries(result.dynamicMetrics).map(([key, value]) => {
                    const numValue = Number(value);
                    const getMetricColor = (val: number) => {
                      if (val >= 85)
                        return 'text-red-600 bg-red-50 border-red-200';
                      if (val >= 70)
                        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                      return 'text-green-600 bg-green-50 border-green-200';
                    };

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border-2 ${getMetricColor(numValue)}`}
                      >
                        <p className='text-xs font-medium uppercase tracking-wide'>
                          {key.replace('_', ' ')}
                        </p>
                        <p className='text-xl font-bold'>
                          {numValue.toFixed(1)}
                          {key !== 'responseTime' ? '%' : 'ms'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 기술 메타데이터 */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 기술 메타데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    응답 생성 정보:
                  </p>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span>템플릿:</span>
                      <Badge variant='outline' className='text-xs'>
                        {result.metaData.responseGeneration.templateUsed}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span>헬스 데이터 통합:</span>
                      <Badge
                        variant={
                          result.metaData.responseGeneration
                            .healthDataIntegrated
                            ? 'default'
                            : 'secondary'
                        }
                        className='text-xs'
                      >
                        {result.metaData.responseGeneration.healthDataIntegrated
                          ? '✅ 통합됨'
                          : '❌ 미통합'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    시스템 정보:
                  </p>
                  <div className='space-y-2 text-sm text-gray-600'>
                    <div>• 패턴 매칭 엔진: PredictivePatternMatcher</div>
                    <div>• 서버 상태 연계: SystemHealthChecker</div>
                    <div>• 응답 단계: 3단계 Fallback 지원</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
