'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

// Recharts 컴포넌트 직접 import (Next.js 15에서 SSR 지원)
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line,
  Cell,
  Pie,
  Area,
} from 'recharts';

interface LogAnalyticsData {
  overview: {
    totalInteractions: number;
    activeEngines: number;
    averageResponseTime: number;
    successRate: number;
    currentQuality: number;
  };
  enginePerformance: Array<{
    engine: string;
    requests: number;
    avgResponseTime: number;
    successRate: number;
    reliability: number;
  }>;
  hourlyTrend: Array<{
    hour: string;
    interactions: number;
    avgResponseTime: number;
    successRate: number;
  }>;
  qualityMetrics: Array<{
    timestamp: string;
    confidence: number;
    userSatisfaction: number;
    accuracyScore: number;
  }>;
  tierDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function LogAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30초

  // 로그 분석 데이터 조회
  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useQuery<LogAnalyticsData>({
    queryKey: ['logAnalytics', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/logs/analytics?timeRange=${selectedTimeRange}`
      );
      if (!response.ok) {
        throw new Error('로그 분석 데이터를 가져오는데 실패했습니다');
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
    staleTime: 5000,
  });

  // 실시간 업데이트 토글
  const toggleRealtime = () => {
    setRefreshInterval((current) => (current === 30000 ? 0 : 30000));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">로그 데이터 분석 중...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <p className="text-gray-600">로그 분석 데이터를 불러올 수 없습니다.</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📊 로그 분석 대시보드
          </h2>
          <p className="text-gray-600">AI 상호작용 로그 및 성능 메트릭 분석</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">최근 1시간</option>
            <option value="6h">최근 6시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
          </select>

          <Button
            variant={refreshInterval > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={toggleRealtime}
          >
            <Activity className="mr-2 h-4 w-4" />
            {refreshInterval > 0 ? '실시간 ON' : '실시간 OFF'}
          </Button>
        </div>
      </div>

      {/* 개요 메트릭 카드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 상호작용</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.overview.totalInteractions.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 엔진</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.overview.activeEngines}
                </p>
              </div>
              <Brain className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  평균 응답시간
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.overview.averageResponseTime}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">성공률</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.overview.successRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">현재 품질</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.overview.currentQuality}/10
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 탭 */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">엔진 성능</TabsTrigger>
          <TabsTrigger value="trends">시간별 트렌드</TabsTrigger>
          <TabsTrigger value="quality">품질 메트릭</TabsTrigger>
          <TabsTrigger value="distribution">티어 분포</TabsTrigger>
        </TabsList>

        {/* 엔진 성능 탭 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>엔진별 요청 수</CardTitle>
                <CardDescription>각 AI 엔진의 처리 요청 수</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.enginePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="engine" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>엔진별 응답시간</CardTitle>
                <CardDescription>평균 응답 시간 비교</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.enginePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="engine" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgResponseTime" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 엔진 상세 정보 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>엔진 상세 성능</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">엔진</th>
                      <th className="p-2 text-right">요청 수</th>
                      <th className="p-2 text-right">응답시간 (ms)</th>
                      <th className="p-2 text-right">성공률</th>
                      <th className="p-2 text-right">신뢰도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.enginePerformance.map((engine, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{engine.engine}</td>
                        <td className="p-2 text-right">
                          {engine.requests.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          {engine.avgResponseTime}
                        </td>
                        <td className="p-2 text-right">
                          <Badge
                            variant={
                              engine.successRate >= 95 ? 'default' : 'secondary'
                            }
                          >
                            {engine.successRate}%
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Badge
                            variant={
                              engine.reliability >= 0.9
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {(engine.reliability * 100).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시간별 트렌드 탭 */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시간별 상호작용 트렌드</CardTitle>
              <CardDescription>시간대별 AI 상호작용 패턴</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>응답시간 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.hourlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#f59e0b"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>성공률 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.hourlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 품질 메트릭 탭 */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 품질 메트릭 트렌드</CardTitle>
              <CardDescription>
                신뢰도, 사용자 만족도, 정확도 추이
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.qualityMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="신뢰도"
                  />
                  <Line
                    type="monotone"
                    dataKey="userSatisfaction"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="사용자 만족도"
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracyScore"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="정확도"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 티어 분포 탭 */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Graceful Degradation 티어 분포</CardTitle>
                <CardDescription>AI 처리 단계별 사용 비율</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) =>
                        `${entry.tier} (${entry.percentage}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.tierDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>티어별 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.tierDistribution.map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{tier.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {tier.count.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tier.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
