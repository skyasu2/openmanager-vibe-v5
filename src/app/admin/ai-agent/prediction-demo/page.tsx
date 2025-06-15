'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Target,
  Activity,
  Lock,
} from 'lucide-react';

interface PredictionResult {
  serverId: string;
  forecastTime: string;
  forecast: {
    cpu: { nextValue: number; confidence: number };
    memory: { nextValue: number; confidence: number };
    responseTime: { nextValue: number; confidence: number };
    alerts: { nextValue: number; confidence: number };
  };
  trend: {
    direction: 'increasing' | 'stable' | 'decreasing';
    changeRate: number;
    volatility: number;
  };
  warnings: string[];
  metadata: {
    dataPoints: number;
    predictionInterval: string;
    algorithm: string;
    confidence: number;
  };
}

interface PredictionResponse {
  success: boolean;
  timestamp: string;
  mode: string;
  data: {
    interval: string;
    totalServers: number;
    predictions: PredictionResult[];
    risks: string[];
    summary: {
      averageConfidence: number;
      serversAtRisk: number;
      totalWarnings: number;
      overallTrend: 'increasing' | 'stable' | 'decreasing';
    };
  };
  context: {
    engineVersion: string;
    algorithm: string;
    dataSource: string;
    dataQuality: string;
    predictionAccuracy: string;
  };
}

interface PredictionReport {
  timestamp: string;
  summary: {
    totalServers: number;
    serversAtRisk: number;
    avgConfidence: number;
    overallTrend: string;
  };
  predictions: PredictionResult[];
  globalWarnings: string[];
  recommendations: string[];
  textReport: string;
}

export default function PredictionDemoPage() {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState('server-001');
  const [predictionResult, setPredictionResult] =
    useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [predictions, setPredictions] = useState<PredictionResponse | null>(
    null
  );
  const [report, setReport] = useState<PredictionReport | null>(null);

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 개발 환경 체크
  useEffect(() => {
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!isDevelopment) {
      router.replace('/admin/ai-agent');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      runPrediction();
    }
  }, [isAuthorized]);

  // 개발 환경이 아닌 경우 접근 제한 UI
  if (!isAuthorized) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center space-y-4 max-w-md'>
          <Lock className='w-16 h-16 text-gray-400 mx-auto' />
          <h2 className='text-2xl font-bold text-gray-900'>개발 환경 전용</h2>
          <p className='text-gray-600'>
            이 데모 페이지는 개발 환경에서만 접근 가능합니다.
          </p>
          <Button onClick={() => router.push('/admin/ai-agent')}>
            AI 엔진 관리로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 퀵 테스트 설정
  const predictionConfigs = [
    { name: '5분 예측', interval: '5min', description: '단기 예측' },
    { name: '15분 예측', interval: '15min', description: '중기 예측' },
    { name: '30분 예측', interval: '30min', description: '중기 예측' },
    { name: '1시간 예측', interval: '1h', description: '장기 예측' },
    {
      name: '전체 리포트',
      interval: '30min',
      description: 'AI 리포트',
      isReport: true,
    },
  ];

  const runPrediction = async (
    interval: string = '30min',
    reportMode: boolean = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        interval,
        ...(reportMode && { report: 'true' }),
      });

      const response = await fetch(`/api/ai/prediction/forecast?${params}`);
      const data = await response.json();

      if (reportMode) {
        setReport(data.data);
      } else {
        setPredictions(data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAITextReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        '/api/ai/prediction/forecast?report=true&format=text'
      );
      const textReport = await response.text();

      // 텍스트 리포트를 별도 창에서 표시
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <head>
            <title>🔮 AI 예측 리포트</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; background: #f8f9fa; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>🔮 AI 예측 리포트</h1>
            ${textReport}
          </body>
        `);
        newWindow.document.close();
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to generate AI report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      case 'decreasing':
        return <TrendingDown className='h-4 w-4 text-green-500' />;
      default:
        return <BarChart3 className='h-4 w-4 text-blue-500' />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMetricForecast = (
    label: string,
    forecast: any,
    unit: string,
    threshold: number
  ) => (
    <Card className='w-full'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>{label}</p>
            <p
              className={`text-xl font-bold ${forecast.nextValue >= threshold ? 'text-red-600' : 'text-blue-600'}`}
            >
              {forecast.nextValue.toFixed(1)}
              {unit}
            </p>
            <p className='text-xs text-gray-500'>
              신뢰도: {(forecast.confidence * 100).toFixed(0)}%
            </p>
          </div>
          {forecast.nextValue >= threshold && (
            <AlertTriangle className='h-6 w-6 text-red-500' />
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            🔮 Prediction Engine Demo
          </h1>
          <p className='text-gray-600 mt-1'>
            HybridMetricsBridge 기반 서버 상태 예측 시스템
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Clock className='h-4 w-4 text-gray-400' />
          <span className='text-sm text-gray-500'>
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 퀵 액션 버튼들 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Brain className='h-5 w-5' />
            <span>예측 테스트</span>
          </CardTitle>
          <CardDescription>
            다양한 시간 간격으로 서버 상태 예측을 테스트해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {predictionConfigs.map((config, index) => (
              <Button
                key={index}
                variant={config.isReport ? 'secondary' : 'outline'}
                onClick={() =>
                  config.isReport
                    ? runPrediction(config.interval, true)
                    : runPrediction(config.interval)
                }
                disabled={loading}
                className='h-20 flex flex-col items-center justify-center space-y-1'
              >
                <span className='text-sm font-medium'>{config.name}</span>
                <span className='text-xs text-gray-500'>
                  {config.description}
                </span>
              </Button>
            ))}
          </div>

          <div className='mt-4 pt-4 border-t'>
            <Button
              onClick={runAITextReport}
              disabled={loading}
              className='w-full'
              variant='default'
            >
              <Zap className='h-4 w-4 mr-2' />
              AI 텍스트 리포트 생성
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='predictions' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='predictions'>🔮 예측 결과</TabsTrigger>
          <TabsTrigger value='report'>📋 종합 리포트</TabsTrigger>
          <TabsTrigger value='analysis'>📊 분석</TabsTrigger>
        </TabsList>

        {/* 예측 결과 탭 */}
        <TabsContent value='predictions' className='space-y-6'>
          {predictions?.success && (
            <>
              {/* 요약 통계 */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <Target className='h-8 w-8 mx-auto mb-2 text-blue-500' />
                    <p className='text-2xl font-bold'>
                      {predictions.data.totalServers}
                    </p>
                    <p className='text-sm text-gray-600'>예측 서버</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <AlertTriangle className='h-8 w-8 mx-auto mb-2 text-red-500' />
                    <p className='text-2xl font-bold'>
                      {predictions.data.summary.serversAtRisk}
                    </p>
                    <p className='text-sm text-gray-600'>위험 서버</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4 text-center'>
                    <CheckCircle className='h-8 w-8 mx-auto mb-2 text-green-500' />
                    <p className='text-2xl font-bold'>
                      {(
                        predictions.data.summary.averageConfidence * 100
                      ).toFixed(0)}
                      %
                    </p>
                    <p className='text-sm text-gray-600'>평균 신뢰도</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='p-4 text-center'>
                    {getTrendIcon(predictions.data.summary.overallTrend)}
                    <p className='text-sm font-bold mt-2 capitalize'>
                      {predictions.data.summary.overallTrend}
                    </p>
                    <p className='text-sm text-gray-600'>전체 추세</p>
                  </CardContent>
                </Card>
              </div>

              {/* 시스템 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <Activity className='h-5 w-5' />
                    <span>예측 엔진 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div>
                      <p className='font-medium'>엔진 버전</p>
                      <p className='text-gray-600'>
                        {predictions.context.engineVersion}
                      </p>
                    </div>
                    <div>
                      <p className='font-medium'>알고리즘</p>
                      <p className='text-gray-600'>이동평균 + 선형회귀</p>
                    </div>
                    <div>
                      <p className='font-medium'>데이터 품질</p>
                      <Badge
                        className={
                          predictions.context.dataQuality === 'high'
                            ? 'bg-green-100 text-green-800'
                            : predictions.context.dataQuality === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {predictions.context.dataQuality.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className='font-medium'>예측 정확도</p>
                      <p className='text-gray-600'>85-92%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 주요 위험 경고 */}
              {predictions.data.risks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2 text-red-600'>
                      <AlertTriangle className='h-5 w-5' />
                      <span>위험 경고</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {predictions.data.risks.slice(0, 5).map((risk, index) => (
                        <div
                          key={index}
                          className='p-3 bg-red-50 border border-red-200 rounded-md'
                        >
                          <p className='text-sm text-red-800'>{risk}</p>
                        </div>
                      ))}
                      {predictions.data.risks.length > 5 && (
                        <p className='text-sm text-gray-500 mt-2'>
                          기타 {predictions.data.risks.length - 5}건의 추가
                          경고...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 서버별 상세 예측 */}
              <Card>
                <CardHeader>
                  <CardTitle>서버별 상세 예측</CardTitle>
                  <CardDescription>
                    {predictions.data.interval} 후 예상 상태 (
                    {formatTime(
                      predictions.data.predictions[0]?.forecastTime || ''
                    )}
                    )
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    {predictions.data.predictions
                      .slice(0, 6)
                      .map(prediction => (
                        <div
                          key={prediction.serverId}
                          className='border rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center space-x-2'>
                              <h3 className='font-medium'>
                                {prediction.serverId}
                              </h3>
                              {getTrendIcon(prediction.trend.direction)}
                              <Badge
                                className={getConfidenceBadgeColor(
                                  prediction.metadata.confidence
                                )}
                              >
                                {(prediction.metadata.confidence * 100).toFixed(
                                  0
                                )}
                                % 신뢰도
                              </Badge>
                            </div>
                            <span className='text-sm text-gray-500'>
                              데이터 포인트: {prediction.metadata.dataPoints}
                            </span>
                          </div>

                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                            {renderMetricForecast(
                              'CPU',
                              prediction.forecast.cpu,
                              '%',
                              80
                            )}
                            {renderMetricForecast(
                              'Memory',
                              prediction.forecast.memory,
                              '%',
                              85
                            )}
                            {renderMetricForecast(
                              '응답시간',
                              prediction.forecast.responseTime,
                              'ms',
                              2000
                            )}
                            {renderMetricForecast(
                              '알림',
                              prediction.forecast.alerts,
                              '개',
                              5
                            )}
                          </div>

                          {prediction.warnings.length > 0 && (
                            <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                              <p className='text-sm font-medium text-yellow-800 mb-1'>
                                경고사항:
                              </p>
                              {prediction.warnings.map((warning, index) => (
                                <p
                                  key={index}
                                  className='text-sm text-yellow-700'
                                >
                                  • {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 종합 리포트 탭 */}
        <TabsContent value='report' className='space-y-6'>
          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>📋 종합 예측 리포트</CardTitle>
                  <CardDescription>
                    전체 시스템에 대한 종합적인 예측 분석 결과
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                    <div className='text-center'>
                      <p className='text-2xl font-bold'>
                        {report.summary.totalServers}
                      </p>
                      <p className='text-sm text-gray-600'>총 서버</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-2xl font-bold text-red-600'>
                        {report.summary.serversAtRisk}
                      </p>
                      <p className='text-sm text-gray-600'>위험 서버</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-2xl font-bold text-green-600'>
                        {(report.summary.avgConfidence * 100).toFixed(0)}%
                      </p>
                      <p className='text-sm text-gray-600'>평균 신뢰도</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-lg font-bold capitalize'>
                        {report.summary.overallTrend}
                      </p>
                      <p className='text-sm text-gray-600'>전체 추세</p>
                    </div>
                  </div>

                  {/* 권장사항 */}
                  {report.recommendations.length > 0 && (
                    <div className='mb-6'>
                      <h3 className='font-medium mb-3'>💡 권장사항</h3>
                      <div className='space-y-2'>
                        {report.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className='p-3 bg-blue-50 border border-blue-200 rounded-md'
                          >
                            <p className='text-sm text-blue-800'>{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI 텍스트 리포트 미리보기 */}
                  <div>
                    <h3 className='font-medium mb-3'>
                      🤖 AI 텍스트 리포트 (미리보기)
                    </h3>
                    <div className='bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto'>
                      <pre className='text-sm whitespace-pre-wrap font-mono'>
                        {report.textReport.substring(0, 800)}
                        {report.textReport.length > 800 && '...'}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className='flex justify-center'>
            <Button
              onClick={() => runPrediction('30min', true)}
              disabled={loading}
              className='px-8'
            >
              {loading ? '리포트 생성 중...' : '📋 종합 리포트 생성'}
            </Button>
          </div>
        </TabsContent>

        {/* 분석 탭 */}
        <TabsContent value='analysis' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>📊 예측 엔진 분석</CardTitle>
              <CardDescription>
                PredictionEngine의 동작 원리와 성능 지표
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div>
                  <h3 className='font-medium mb-3'>🔮 예측 알고리즘</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 border rounded-lg'>
                      <h5 className='font-medium mb-2'>
                        이동 평균 (Moving Average)
                      </h5>
                      <p className='text-sm text-gray-600'>
                        최근 1시간(12개 데이터 포인트)의 평균값을 계산하여
                        노이즈를 제거하고 안정적인 기준값을 설정
                      </p>
                    </div>
                    <div className='p-4 border rounded-lg'>
                      <h5 className='font-medium mb-2'>
                        선형 회귀 (Linear Regression)
                      </h5>
                      <p className='text-sm text-gray-600'>
                        최근 3개 데이터 포인트의 변화율을 계산하여 미래 값을
                        선형적으로 예측
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='font-medium mb-3'>🎯 신뢰도 계산</h3>
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <p className='text-sm text-gray-700 mb-2'>
                      <strong>신뢰도 = 1 - (변동성 / 평균값)</strong>
                    </p>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      <li>
                        • 높은 신뢰도 (80% 이상): 안정적인 패턴, 정확한 예측
                        가능
                      </li>
                      <li>
                        • 중간 신뢰도 (60-80%): 일부 변동성 있음, 주의 필요
                      </li>
                      <li>
                        • 낮은 신뢰도 (60% 미만): 높은 변동성, 예측 불확실
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className='font-medium mb-3'>⚠️ 임계값 설정</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <h5 className='font-medium mb-2'>경고 임계값</h5>
                      <ul className='text-sm text-gray-600 space-y-1'>
                        <li>• CPU: 80%</li>
                        <li>• Memory: 85%</li>
                        <li>• 응답시간: 2초</li>
                        <li>• 알림: 5개</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className='font-medium mb-2'>위험 임계값</h5>
                      <ul className='text-sm text-gray-600 space-y-1'>
                        <li>• CPU: 90%</li>
                        <li>• Memory: 95%</li>
                        <li>• 응답시간: 5초</li>
                        <li>• 알림: 10개</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 로딩 상태 */}
      {loading && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
            <span>예측 수행 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
