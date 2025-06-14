'use client';

import { useState, useEffect } from 'react';
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
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import {
  Activity,
  Database,
  TrendingUp,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Lock,
} from 'lucide-react';

interface TimeSeriesPoint {
  timestamp: string;
  serverId: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
    alerts: number;
    network?: {
      bytesIn: number;
      bytesOut: number;
    };
  };
}

interface MergedTimeSeriesResponse {
  success: boolean;
  timestamp: string;
  data: {
    serverCount: number;
    totalPoints: number;
    timeWindow: {
      start: string;
      end: string;
      duration: string;
    };
    dataSource: {
      dailyPoints: number;
      realtimePoints: number;
      coverage: number;
    };
    metadata: {
      lastUpdated: string;
      interpolatedPoints: number;
      missingDataRanges: Array<{ start: string; end: string }>;
    };
    timeSeries: Record<string, TimeSeriesPoint[]>;
  };
  context: {
    bridgeVersion: string;
    dataQuality: 'high' | 'medium' | 'low';
    recommendedUsage: string;
  };
}

interface AnalysisData {
  success: boolean;
  data: {
    analysisMode: boolean;
    timeRange: string;
    serverCount: number;
    summary: {
      avgCpu: number;
      avgMemory: number;
      avgDisk: number;
      anomalyCount: number;
      trendDirection: 'increasing' | 'decreasing' | 'stable';
    };
    timeSeries: Record<string, TimeSeriesPoint[]>;
  };
}

export default function MetricsBridgeDemoPage() {
  const router = useRouter();
  const [mergedData, setMergedData] = useState<MergedTimeSeriesResponse | null>(
    null
  );
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState('');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h'>(
    '24h'
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 개발 환경 체크
  useEffect(() => {
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!isDevelopment) {
      // 프로덕션 환경에서는 접근 제한
      router.replace('/admin/ai-agent');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadMergedData();
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
            이 페이지는 개발 환경에서만 접근 가능합니다.
          </p>
          <Button onClick={() => router.push('/admin/ai-agent')}>
            AI 엔진 관리로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 데모 설정
  const demoConfigs = [
    { name: '전체 시계열 조회', duration: '24h', analysis: false },
    { name: '6시간 데이터', duration: '6h', analysis: false },
    { name: 'AI 분석 모드', duration: '24h', analysis: true },
    { name: '1시간 집중 분석', duration: '1h', analysis: true },
  ];

  const loadMergedData = async (
    duration: string = '24h',
    analysis: boolean = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        duration,
        ...(analysis && { analysis: 'true' }),
      });

      const response = await fetch(`/api/metrics/hybrid-bridge?${params}`);
      const data = await response.json();

      if (analysis) {
        setAnalysisData(data);
      } else {
        setMergedData(data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServerSpecificData = async () => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        serverId: selectedServer,
        duration: timeRange,
      });

      const response = await fetch(`/api/metrics/hybrid-bridge?${params}`);
      const data = await response.json();

      console.log('Server specific data:', data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load server data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performCacheOperation = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/metrics/hybrid-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      console.log(`${action} result:`, result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    unit: string
  ) => (
    <Card className='w-full'>
      <CardContent className='p-4'>
        <div className='flex items-center space-x-2'>
          {icon}
          <div>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <p className='text-2xl font-bold'>
              {value.toFixed(1)}
              {unit}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      case 'decreasing':
        return <TrendingUp className='h-4 w-4 text-green-500 rotate-180' />;
      default:
        return <BarChart3 className='h-4 w-4 text-blue-500' />;
    }
  };

  return (
    <main>
      <div className='container mx-auto p-6 space-y-6'>
        {/* 헤더 */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              🔗 Hybrid Metrics Bridge Demo
            </h1>
            <p className='text-gray-600 mt-1'>
              시계열 데이터 병합 및 AI 분석 시스템 테스트
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
              <Activity className='h-5 w-5' />
              <span>퀵 테스트</span>
            </CardTitle>
            <CardDescription>
              다양한 시나리오로 HybridMetricsBridge 기능을 테스트해보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {demoConfigs.map((config, index) => (
                <Button
                  key={index}
                  variant={config.analysis ? 'secondary' : 'outline'}
                  onClick={() =>
                    loadMergedData(config.duration, config.analysis)
                  }
                  disabled={loading}
                  className='h-20 flex flex-col items-center justify-center space-y-1'
                >
                  <span className='text-sm font-medium'>{config.name}</span>
                  <span className='text-xs text-gray-500'>
                    {config.duration}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>📊 개요</TabsTrigger>
            <TabsTrigger value='analysis'>🧠 AI 분석</TabsTrigger>
            <TabsTrigger value='server'>🖥️ 서버별</TabsTrigger>
            <TabsTrigger value='operations'>⚙️ 운영</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview' className='space-y-6'>
            {mergedData?.success && (
              <>
                {/* 데이터 품질 및 개요 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center justify-between'>
                        <span>데이터 품질</span>
                        <Badge
                          className={getQualityBadgeColor(
                            mergedData.context.dataQuality
                          )}
                        >
                          {mergedData.context.dataQuality.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <p className='text-sm'>
                          <span className='font-medium'>커버리지:</span>
                          {(mergedData.data.dataSource.coverage * 100).toFixed(
                            1
                          )}
                          %
                        </p>
                        <p className='text-sm'>
                          <span className='font-medium'>총 포인트:</span>
                          {mergedData.data.totalPoints.toLocaleString()}개
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>
                          {mergedData.context.recommendedUsage}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center space-x-2'>
                        <Database className='h-5 w-5' />
                        <span>데이터 소스</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-sm'>Daily:</span>
                          <span className='font-medium'>
                            {mergedData.data.dataSource.dailyPoints}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-sm'>Realtime:</span>
                          <span className='font-medium'>
                            {mergedData.data.dataSource.realtimePoints}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-sm'>보간:</span>
                          <span className='font-medium'>
                            {mergedData.data.metadata.interpolatedPoints}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center space-x-2'>
                        <Clock className='h-5 w-5' />
                        <span>시간 윈도우</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <p className='text-sm'>
                          <span className='font-medium'>기간:</span>
                          {mergedData.data.timeWindow.duration}
                        </p>
                        <p className='text-sm'>
                          <span className='font-medium'>서버 수:</span>
                          {mergedData.data.serverCount}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {new Date(
                            mergedData.data.timeWindow.start
                          ).toLocaleString()}{' '}
                          ~
                          {new Date(
                            mergedData.data.timeWindow.end
                          ).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 서버별 최신 메트릭 미리보기 */}
                <Card>
                  <CardHeader>
                    <CardTitle>서버별 최신 메트릭</CardTitle>
                    <CardDescription>
                      각 서버의 가장 최신 메트릭 데이터
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {Object.entries(mergedData.data.timeSeries)
                        .slice(0, 6)
                        .map(([serverId, timeSeries]) => {
                          const latestPoint = timeSeries[timeSeries.length - 1];
                          if (!latestPoint) return null;

                          return (
                            <Card
                              key={serverId}
                              className='border-l-4 border-l-blue-500'
                            >
                              <CardContent className='p-4'>
                                <div className='flex items-center justify-between mb-2'>
                                  <h4 className='font-medium text-sm'>
                                    {serverId}
                                  </h4>
                                  <span className='text-xs text-gray-500'>
                                    {new Date(
                                      latestPoint.timestamp
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className='grid grid-cols-2 gap-2 text-xs'>
                                  <div className='flex items-center space-x-1'>
                                    <Cpu className='h-3 w-3' />
                                    <span>
                                      CPU: {latestPoint.metrics.cpu.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    <HardDrive className='h-3 w-3' />
                                    <span>
                                      MEM:{' '}
                                      {latestPoint.metrics.memory.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    <HardDrive className='h-3 w-3' />
                                    <span>
                                      DISK:{' '}
                                      {latestPoint.metrics.disk.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    <Wifi className='h-3 w-3' />
                                    <span>
                                      RT:{' '}
                                      {latestPoint.metrics.responseTime.toFixed(
                                        0
                                      )}
                                      ms
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* AI 분석 탭 */}
          <TabsContent value='analysis' className='space-y-6'>
            {analysisData?.success && (
              <>
                {/* AI 분석 요약 */}
                <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                  {renderMetricCard(
                    'Average CPU',
                    analysisData.data.summary.avgCpu,
                    <Cpu className='h-4 w-4 text-blue-500' />,
                    '%'
                  )}
                  {renderMetricCard(
                    'Average Memory',
                    analysisData.data.summary.avgMemory,
                    <HardDrive className='h-4 w-4 text-green-500' />,
                    '%'
                  )}
                  {renderMetricCard(
                    'Average Disk',
                    analysisData.data.summary.avgDisk,
                    <HardDrive className='h-4 w-4 text-yellow-500' />,
                    '%'
                  )}
                  <Card className='w-full'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <AlertTriangle className='h-4 w-4 text-red-500' />
                        <div>
                          <p className='text-sm font-medium text-gray-600'>
                            Anomalies
                          </p>
                          <p className='text-2xl font-bold'>
                            {analysisData.data.summary.anomalyCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='w-full'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        {getTrendIcon(analysisData.data.summary.trendDirection)}
                        <div>
                          <p className='text-sm font-medium text-gray-600'>
                            Trend
                          </p>
                          <p className='text-sm font-bold capitalize'>
                            {analysisData.data.summary.trendDirection}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI 분석 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <BarChart3 className='h-5 w-5' />
                      <span>AI 분석 결과</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='text-center'>
                        <p className='text-2xl font-bold'>
                          {analysisData.data.serverCount}
                        </p>
                        <p className='text-sm text-gray-600'>분석된 서버</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-2xl font-bold'>
                          {analysisData.data.timeRange}
                        </p>
                        <p className='text-sm text-gray-600'>분석 기간</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-2xl font-bold'>
                          {Object.values(analysisData.data.timeSeries).reduce(
                            (sum, series) => sum + series.length,
                            0
                          )}
                        </p>
                        <p className='text-sm text-gray-600'>
                          총 데이터 포인트
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <div className='flex justify-center'>
              <Button
                onClick={() => loadMergedData('24h', true)}
                disabled={loading}
                className='px-8'
              >
                {loading ? '분석 중...' : '🧠 AI 분석 실행'}
              </Button>
            </div>
          </TabsContent>

          {/* 서버별 탭 */}
          <TabsContent value='server' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>특정 서버 시계열 조회</CardTitle>
                <CardDescription>
                  개별 서버의 상세 시계열 데이터를 조회할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label
                      htmlFor='serverId'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      서버 ID
                    </label>
                    <input
                      id='serverId'
                      type='text'
                      placeholder='server-001'
                      value={selectedServer}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSelectedServer(e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='timeRange'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      시간 범위
                    </label>
                    <select
                      id='timeRange'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      value={timeRange}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setTimeRange(
                          e.target.value as '1h' | '6h' | '12h' | '24h'
                        )
                      }
                    >
                      <option value='1h'>1시간</option>
                      <option value='6h'>6시간</option>
                      <option value='12h'>12시간</option>
                      <option value='24h'>24시간</option>
                    </select>
                  </div>
                  <div className='flex items-end'>
                    <Button
                      onClick={loadServerSpecificData}
                      disabled={loading || !selectedServer}
                      className='w-full'
                    >
                      조회
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 운영 탭 */}
          <TabsContent value='operations' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>시스템 운영</CardTitle>
                <CardDescription>
                  HybridMetricsBridge 캐시 관리 및 시스템 동기화
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <Button
                    variant='outline'
                    onClick={() => performCacheOperation('sync_health_checker')}
                    disabled={loading}
                    className='h-20 flex flex-col items-center justify-center space-y-1'
                  >
                    <CheckCircle className='h-6 w-6' />
                    <span className='text-sm'>동기화</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => performCacheOperation('cleanup_cache')}
                    disabled={loading}
                    className='h-20 flex flex-col items-center justify-center space-y-1'
                  >
                    <Database className='h-6 w-6' />
                    <span className='text-sm'>캐시 정리</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => performCacheOperation('get_current_window')}
                    disabled={loading}
                    className='h-20 flex flex-col items-center justify-center space-y-1'
                  >
                    <Clock className='h-6 w-6' />
                    <span className='text-sm'>현재 윈도우</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => loadMergedData()}
                    disabled={loading}
                    className='h-20 flex flex-col items-center justify-center space-y-1'
                  >
                    <Activity className='h-6 w-6' />
                    <span className='text-sm'>전체 새로고침</span>
                  </Button>
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
              <span>데이터 로딩 중...</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
