/**
 * 🚀 GCP 무료 한도 모니터링 대시보드
 *
 * 기능:
 * - GCP Functions 무료 한도 사용량 모니터링
 * - 베르셀 부하 감소율 시각화
 * - AI 처리 성능 향상률 추적
 * - 3-Tier Router 성능 메트릭 대시보드
 */

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 동적 import로 차트 컴포넌트들 로드
// 타입 정의는 사용하지 않으므로 제거

const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  ssr: false,
}) as any;

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
) as any;

const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), {
  ssr: false,
}) as any;

const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
) as any;

const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
  ssr: false,
}) as any;

const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), {
  ssr: false,
}) as any;

const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
) as any;

const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
}) as any;

const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), {
  ssr: false,
}) as any;

const Line = dynamic(() => import('recharts').then((mod) => mod.Line), {
  ssr: false,
}) as any;

const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), {
  ssr: false,
}) as any;

const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), {
  ssr: false,
}) as any;

interface GCPQuotaStats {
  freeQuotaUsage: {
    calls: number;
    compute: number;
    network: number;
    callsPercent: number;
    computePercent: number;
    networkPercent: number;
  };
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  engineUsage: {
    korean: number;
    rule: number;
    ml: number;
    fallback: number;
  };
}

interface ThreeTierStats {
  totalRequests: number;
  routingDecisions: {
    local: number;
    gcp: number;
    google: number;
  };
  fallbackTriggers: {
    localToGcp: number;
    gcpToLocal: number;
    toGoogle: number;
  };
  averageResponseTimes: {
    local: number;
    gcp: number;
    google: number;
  };
  performanceMetrics: {
    vercelLoadReduction: number;
    aiPerformanceImprovement: number;
  };
}

interface RouterStatus {
  enabled: boolean;
  _initialized: boolean;
  strategy: 'performance' | 'cost' | 'reliability';
  services: {
    gcp: unknown;
    google: string;
    local: string;
  };
}

export const GCPQuotaMonitoringDashboard: FC = () => {
  const [gcpStats, setGCPStats] = useState<GCPQuotaStats | null>(null);
  const [threeTierStats, setThreeTierStats] = useState<ThreeTierStats | null>(
    null
  );
  const [routerStatus, setRouterStatus] = useState<RouterStatus | null>(null);
  const [historicalData, setHistoricalData] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // GCP Functions 통계 로드
      const gcpResponse = await fetch('/api/ai/gcp-functions/stats');
      const gcpData = await gcpResponse.json();

      // 3-Tier Router 통계 로드 - 레거시 API 비활성화
      // Three-tier API는 더 이상 사용되지 않으므로 기본값 설정
      const threeTierData: ThreeTierStats = {
        totalRequests: 0,
        routingDecisions: {
          local: 0,
          gcp: 0,
          google: 0,
        },
        fallbackTriggers: {
          localToGcp: 0,
          gcpToLocal: 0,
          toGoogle: 0,
        },
        averageResponseTimes: {
          local: 0,
          gcp: 0,
          google: 0,
        },
        performanceMetrics: {
          vercelLoadReduction: 0,
          aiPerformanceImprovement: 0,
        },
      };

      const statusData: RouterStatus = {
        enabled: false,
        _initialized: false,
        strategy: 'performance',
        services: {
          gcp: null,
          google: 'inactive',
          local: 'inactive',
        },
      };

      const historyData: unknown[] = [];

      setGCPStats(gcpData);
      setThreeTierStats(threeTierData);
      setRouterStatus(statusData);
      setHistoricalData(historyData as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    void loadDashboardData();
    const interval = setInterval(() => {
      void loadDashboardData();
    }, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // 사용량 레벨 계산
  const _getUsageLevel = (percent: number) => {
    if (percent < 50) return { color: 'bg-green-500', level: 'LOW' };
    if (percent < 80) return { color: 'bg-yellow-500', level: 'MEDIUM' };
    return { color: 'bg-red-500', level: 'HIGH' };
  };

  // 차트 색상
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          모니터링 대시보드 로드 실패: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            GCP Functions 모니터링 대시보드
          </h1>
          <p className="text-gray-600">
            베르셀 부하 75% 감소 + AI 성능 50% 향상 추적
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={routerStatus?.enabled ? 'default' : 'secondary'}>
            {routerStatus?.enabled ? '활성' : '비활성'}
          </Badge>
          <Badge variant="outline">
            {routerStatus?.strategy?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* 핵심 메트릭 카드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              베르셀 부하 감소
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {threeTierStats?.performanceMetrics.vercelLoadReduction.toFixed(
                1
              )}
              %
            </div>
            <p className="text-xs text-gray-500">목표: 75%</p>
            <Progress
              value={
                threeTierStats?.performanceMetrics.vercelLoadReduction || 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 성능 향상</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {threeTierStats?.performanceMetrics.aiPerformanceImprovement.toFixed(
                1
              )}
              %
            </div>
            <p className="text-xs text-gray-500">목표: 50%</p>
            <Progress
              value={
                threeTierStats?.performanceMetrics.aiPerformanceImprovement || 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              GCP 호출 사용량
            </CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {gcpStats?.freeQuotaUsage.callsPercent.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500">월간 무료 한도</p>
            <Progress
              value={gcpStats?.freeQuotaUsage.callsPercent || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              평균 응답 시간
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {gcpStats?.averageResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-gray-500">전체 평균</p>
            <div className="mt-2 text-sm text-gray-600">
              성공률: {gcpStats?.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 기반 상세 정보 */}
      <Tabs defaultValue="quota" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quota">무료 한도</TabsTrigger>
          <TabsTrigger value="routing">라우팅 분석</TabsTrigger>
          <TabsTrigger value="performance">성능 메트릭</TabsTrigger>
          <TabsTrigger value="history">히스토리</TabsTrigger>
        </TabsList>

        {/* 무료 한도 탭 */}
        <TabsContent value="quota" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GCP Functions 무료 한도 사용량</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">호출 수</span>
                      <span className="text-sm">
                        {gcpStats?.freeQuotaUsage.calls.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={gcpStats?.freeQuotaUsage.callsPercent || 0}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {gcpStats?.freeQuotaUsage.callsPercent.toFixed(2)}% of
                      2M/month
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        컴퓨팅 (GB-초)
                      </span>
                      <span className="text-sm">
                        {gcpStats?.freeQuotaUsage.compute.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={gcpStats?.freeQuotaUsage.computePercent || 0}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {gcpStats?.freeQuotaUsage.computePercent.toFixed(2)}% of
                      400K/month
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">네트워크 (GB)</span>
                      <span className="text-sm">
                        {gcpStats?.freeQuotaUsage.network.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={gcpStats?.freeQuotaUsage.networkPercent || 0}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {gcpStats?.freeQuotaUsage.networkPercent.toFixed(2)}% of
                      25GB/month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>엔진 사용량 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Korean NLP',
                          value: gcpStats?.engineUsage.korean || 0,
                        },
                        {
                          name: 'Rule Engine',
                          value: gcpStats?.engineUsage.rule || 0,
                        },
                        {
                          name: 'Basic ML',
                          value: gcpStats?.engineUsage.ml || 0,
                        },
                        {
                          name: 'Fallback',
                          value: gcpStats?.engineUsage.fallback || 0,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({
                        name,
                        percent,
                      }: {
                        name: string;
                        percent: number;
                      }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {CHART_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 라우팅 분석 탭 */}
        <TabsContent value="routing" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tier별 요청 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Local',
                        value: threeTierStats?.routingDecisions.local || 0,
                      },
                      {
                        name: 'GCP',
                        value: threeTierStats?.routingDecisions.gcp || 0,
                      },
                      {
                        name: 'Google',
                        value: threeTierStats?.routingDecisions.google || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier별 평균 응답 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Local',
                        time: threeTierStats?.averageResponseTimes.local || 0,
                      },
                      {
                        name: 'GCP',
                        time: threeTierStats?.averageResponseTimes.gcp || 0,
                      },
                      {
                        name: 'Google',
                        time: threeTierStats?.averageResponseTimes.google || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value}ms`,
                        'Response Time',
                      ]}
                    />
                    <Bar dataKey="time" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>폴백 이벤트 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {threeTierStats?.fallbackTriggers.localToGcp || 0}
                  </div>
                  <p className="text-sm text-gray-600">Local → GCP</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {threeTierStats?.fallbackTriggers.gcpToLocal || 0}
                  </div>
                  <p className="text-sm text-gray-600">GCP → Local</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {threeTierStats?.fallbackTriggers.toGoogle || 0}
                  </div>
                  <p className="text-sm text-gray-600">→ Google AI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 성능 메트릭 탭 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>베르셀 부하 감소 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="vercelLoadReduction"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI 성능 향상 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="aiPerformanceImprovement"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>성능 목표 달성률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-green-600">
                    {(
                      ((threeTierStats?.performanceMetrics
                        .vercelLoadReduction || 0) /
                        75) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                  <p className="text-sm text-gray-600">
                    베르셀 부하 감소 목표 달성률
                  </p>
                  <p className="text-xs text-gray-500">(목표: 75%)</p>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-blue-600">
                    {(
                      ((threeTierStats?.performanceMetrics
                        .aiPerformanceImprovement || 0) /
                        50) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                  <p className="text-sm text-gray-600">
                    AI 성능 향상 목표 달성률
                  </p>
                  <p className="text-xs text-gray-500">(목표: 50%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 히스토리 탭 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시간대별 사용량 트렌드</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="totalRequests"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Total Requests"
                  />
                  <Line
                    type="monotone"
                    dataKey="gcpRequests"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="GCP Requests"
                  />
                  <Line
                    type="monotone"
                    dataKey="localRequests"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="Local Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 알림 및 권장사항 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(gcpStats?.freeQuotaUsage.callsPercent || 0) > 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    GCP Functions 호출 한도가 80%를 초과했습니다.
                  </AlertDescription>
                </Alert>
              )}
              {(gcpStats?.successRate || 100) < 95 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    성공률이 95% 미만입니다. 시스템을 확인하세요.
                  </AlertDescription>
                </Alert>
              )}
              {(gcpStats?.averageResponseTime || 0) > 5000 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    평균 응답 시간이 5초를 초과했습니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <span>무료 한도 사용률을 4.5% 이하로 유지하세요.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <span>
                  GCP Functions을 우선 사용하여 베르셀 부하를 감소시키세요.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <span>한국어 쿼리는 GCP Korean NLP 엔진을 활용하세요.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <span>폴백 이벤트가 빈번하면 타임아웃을 조정하세요.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
