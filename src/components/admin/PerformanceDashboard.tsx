/**
 * 📊 성능 모니터링 대시보드 v2.0
 *
 * ✅ 실시간 AI 엔진 성능 추적
 * ✅ 폴백 시스템 모니터링
 * ✅ 성능 알림 및 경고
 * ✅ 트렌드 분석 및 예측
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BellOff,
  Brain,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 타입 정의
interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  fallbackRate: number;
  engineStats: Record<
    string,
    {
      requests: number;
      averageResponseTime: number;
      successRate: number;
      confidence: number;
    }
  >;
  modeStats: Record<
    string,
    {
      requests: number;
      averageResponseTime: number;
      successRate: number;
    }
  >;
  hourlyStats: Array<{
    hour: string;
    requests: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  lastUpdated: string;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  engine: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface PerformanceData {
  stats: PerformanceMetrics;
  alerts: PerformanceAlert[];
  status: {
    enabled: boolean;
    metricsCount: number;
    alertsCount: number;
    lastMetricTime?: string;
  };
}

// 색상 팔레트
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
};

const ENGINE_COLORS: Record<string, string> = {
  'supabase-rag': COLORS.success,
  'google-ai': COLORS.primary,
  'mcp-context': COLORS.purple,
  'korean-ai': COLORS.pink,
  transformers: COLORS.indigo,
  fallback: COLORS.warning,
  emergency: COLORS.danger,
};

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('60'); // 분 단위
  const [selectedTab, setSelectedTab] = useState('overview');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 📡 성능 데이터 가져오기
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/performance?timeRange=${selectedTimeRange}&includeAlerts=true&includeStatus=true`
      );

      if (!response.ok) {
        throw new Error(
          `API 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '성능 데이터 로드 실패');
      }

      setData(result.data);
      setLastUpdate(new Date());

      console.log('✅ 성능 대시보드 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('❌ 성능 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // 🔄 자동 새로고침
  useEffect(() => {
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // 30초마다
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchPerformanceData]);

  // 📊 차트 데이터 변환
  const getEnginePerformanceData = () => {
    if (!data?.stats.engineStats) return [];

    return Object.entries(data.stats.engineStats).map(([engine, stats]) => ({
      name: engine,
      requests: stats.requests,
      responseTime: stats.averageResponseTime,
      successRate: stats.successRate * 100,
      confidence: stats.confidence * 100,
      color: ENGINE_COLORS[engine] || COLORS.info,
    }));
  };

  const getModeDistributionData = () => {
    if (!data?.stats.modeStats) return [];

    return Object.entries(data.stats.modeStats).map(([mode, stats]) => ({
      name: mode,
      value: stats.requests,
      successRate: stats.successRate * 100,
    }));
  };

  const getHourlyTrendsData = () => {
    if (!data?.stats.hourlyStats) return [];

    return data.stats.hourlyStats.map(stat => ({
      time: new Date(stat.hour).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      requests: stat.requests,
      responseTime: stat.averageResponseTime,
      successRate: stat.successRate * 100,
    }));
  };

  // 🚨 알림 필터링
  const getFilteredAlerts = () => {
    if (!data?.alerts) return [];

    let filtered = data.alerts;

    if (filterEngine !== 'all') {
      filtered = filtered.filter(alert => alert.engine === filterEngine);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        alert =>
          alert.message.toLowerCase().includes(query) ||
          alert.engine.toLowerCase().includes(query)
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // 🎨 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white p-3 border border-gray-200 rounded-lg shadow-lg'>
          <p className='font-semibold text-gray-800'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className='text-sm'>
              {entry.name}:{' '}
              {typeof entry.value === 'number'
                ? entry.value.toFixed(1)
                : entry.value}
              {entry.name.includes('Rate') || entry.name.includes('confidence')
                ? '%'
                : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 🎯 성능 점수 계산
  const calculatePerformanceScore = () => {
    if (!data?.stats) return 0;

    const { successRate, averageResponseTime, errorRate } = data.stats;

    // 성공률 (40%), 응답시간 (40%), 에러율 (20%) 가중치
    const successScore = successRate * 40;
    const responseScore = Math.max(0, (5000 - averageResponseTime) / 5000) * 40;
    const errorScore = Math.max(0, (0.1 - errorRate) / 0.1) * 20;

    return Math.round(successScore + responseScore + errorScore);
  };

  // 🔄 수동 새로고침
  const handleManualRefresh = () => {
    fetchPerformanceData();
  };

  // 📥 데이터 내보내기
  const handleExportData = async () => {
    try {
      const response = await fetch(
        `/api/performance?timeRange=${selectedTimeRange}&export=true`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
    }
  };

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className='p-6 space-y-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center gap-2 text-blue-600'>
            <RefreshCw className='w-6 h-6 animate-spin' />
            <span>성능 데이터 로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-red-800 mb-2'>
            데이터 로드 실패
          </h3>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={handleManualRefresh} variant='destructive'>
            <RefreshCw className='w-4 h-4 mr-2' />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const performanceScore = calculatePerformanceScore();
  const engineData = getEnginePerformanceData();
  const modeData = getModeDistributionData();
  const trendsData = getHourlyTrendsData();
  const filteredAlerts = getFilteredAlerts();

  return (
    <div className='p-6 space-y-6 bg-gray-50 min-h-screen'>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex items-center justify-between'
      >
        <div>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <Activity className='w-6 h-6 text-white' />
            </div>
            AI 성능 모니터링 대시보드
          </h1>
          <p className='text-gray-600 mt-1'>실시간 AI 엔진 성능 추적 및 분석</p>
        </div>

        <div className='flex items-center gap-4'>
          {/* 시간 범위 선택 */}
          <select
            value={selectedTimeRange}
            onChange={e => setSelectedTimeRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          >
            <option value='30'>최근 30분</option>
            <option value='60'>최근 1시간</option>
            <option value='360'>최근 6시간</option>
            <option value='1440'>최근 24시간</option>
          </select>

          {/* 자동 새로고침 토글 */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <Wifi className='w-4 h-4 mr-2' />
            ) : (
              <WifiOff className='w-4 h-4 mr-2' />
            )}
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          {/* 알림 토글 */}
          <Button
            variant={alertsEnabled ? 'default' : 'outline'}
            size='sm'
            onClick={() => setAlertsEnabled(!alertsEnabled)}
          >
            {alertsEnabled ? (
              <Bell className='w-4 h-4 mr-2' />
            ) : (
              <BellOff className='w-4 h-4 mr-2' />
            )}
            알림 {alertsEnabled ? 'ON' : 'OFF'}
          </Button>

          {/* 수동 새로고침 */}
          <Button
            variant='outline'
            size='sm'
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>

          {/* 데이터 내보내기 */}
          <Button variant='outline' size='sm' onClick={handleExportData}>
            <Download className='w-4 h-4 mr-2' />
            내보내기
          </Button>
        </div>
      </motion.div>

      {/* 요약 메트릭 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'
      >
        {/* 성능 점수 */}
        <Card className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-100 text-sm'>성능 점수</p>
                <p className='text-3xl font-bold'>{performanceScore}</p>
                <p className='text-blue-100 text-xs'>/ 100</p>
              </div>
              <Target className='w-8 h-8 text-blue-200' />
            </div>
          </CardContent>
        </Card>

        {/* 총 요청 수 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>총 요청</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {data.stats.totalRequests.toLocaleString()}
                </p>
              </div>
              <BarChart3 className='w-6 h-6 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        {/* 평균 응답시간 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>평균 응답시간</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {Math.round(data.stats.averageResponseTime)}ms
                </p>
              </div>
              <Clock className='w-6 h-6 text-orange-500' />
            </div>
          </CardContent>
        </Card>

        {/* 성공률 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>성공률</p>
                <p className='text-2xl font-bold text-green-600'>
                  {(data.stats.successRate * 100).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className='w-6 h-6 text-green-500' />
            </div>
          </CardContent>
        </Card>

        {/* 폴백률 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>폴백률</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {(data.stats.fallbackRate * 100).toFixed(1)}%
                </p>
              </div>
              <Zap className='w-6 h-6 text-yellow-500' />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 메인 대시보드 탭 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>📊 개요</TabsTrigger>
            <TabsTrigger value='engines'>🤖 엔진 성능</TabsTrigger>
            <TabsTrigger value='trends'>📈 트렌드</TabsTrigger>
            <TabsTrigger value='alerts'>🚨 알림</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* 모드별 분포 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Brain className='w-5 h-5 text-purple-600' />
                    AI 모드 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={modeData}
                          cx='50%'
                          cy='50%'
                          outerRadius={80}
                          dataKey='value'
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {modeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                Object.values(COLORS)[
                                  index % Object.values(COLORS).length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 시간별 요청 트렌드 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5 text-blue-600' />
                    시간별 요청 트렌드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={trendsData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='time' />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type='monotone'
                          dataKey='requests'
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 엔진 성능 탭 */}
          <TabsContent value='engines' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='w-5 h-5 text-yellow-600' />
                  엔진별 성능 비교
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-96'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={engineData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='name' />
                      <YAxis yAxisId='left' />
                      <YAxis yAxisId='right' orientation='right' />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        yAxisId='left'
                        dataKey='requests'
                        fill={COLORS.primary}
                        name='요청 수'
                      />
                      <Bar
                        yAxisId='left'
                        dataKey='responseTime'
                        fill={COLORS.warning}
                        name='응답시간(ms)'
                      />
                      <Bar
                        yAxisId='right'
                        dataKey='successRate'
                        fill={COLORS.success}
                        name='성공률(%)'
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 트렌드 탭 */}
          <TabsContent value='trends' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-green-600' />
                  성능 트렌드 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-96'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='time' />
                      <YAxis yAxisId='left' />
                      <YAxis yAxisId='right' orientation='right' />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId='left'
                        type='monotone'
                        dataKey='responseTime'
                        stroke={COLORS.warning}
                        strokeWidth={2}
                        name='응답시간(ms)'
                      />
                      <Line
                        yAxisId='right'
                        type='monotone'
                        dataKey='successRate'
                        stroke={COLORS.success}
                        strokeWidth={2}
                        name='성공률(%)'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 알림 탭 */}
          <TabsContent value='alerts' className='space-y-6'>
            {/* 알림 필터 */}
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Filter className='w-4 h-4 text-gray-500' />
                <select
                  value={filterEngine}
                  onChange={e => setFilterEngine(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-lg'
                >
                  <option value='all'>모든 엔진</option>
                  {Object.keys(ENGINE_COLORS).map(engine => (
                    <option key={engine} value={engine}>
                      {engine}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-2 flex-1'>
                <Search className='w-4 h-4 text-gray-500' />
                <input
                  type='text'
                  placeholder='알림 검색...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg'
                />
              </div>
            </div>

            {/* 알림 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <AlertTriangle className='w-5 h-5 text-red-600' />
                  성능 알림 ({filteredAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  <AnimatePresence>
                    {filteredAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.type === 'critical'
                            ? 'bg-red-50 border-red-500'
                            : 'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <Badge
                                variant={
                                  alert.type === 'critical'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {alert.type === 'critical'
                                  ? 'CRITICAL'
                                  : 'WARNING'}
                              </Badge>
                              <span className='text-sm font-medium text-gray-900'>
                                {alert.engine}
                              </span>
                            </div>
                            <p className='text-sm text-gray-700 mb-2'>
                              {alert.message}
                            </p>
                            <div className='flex items-center gap-4 text-xs text-gray-500'>
                              <span>
                                {alert.metric}: {alert.value.toFixed(2)}
                                {alert.metric.includes('Rate')
                                  ? '%'
                                  : alert.metric.includes('Time')
                                    ? 'ms'
                                    : ''}
                              </span>
                              <span>
                                임계값: {alert.threshold}
                                {alert.metric.includes('Rate')
                                  ? '%'
                                  : alert.metric.includes('Time')
                                    ? 'ms'
                                    : ''}
                              </span>
                              <span>
                                {new Date(alert.timestamp).toLocaleString(
                                  'ko-KR'
                                )}
                              </span>
                            </div>
                          </div>
                          <AlertTriangle
                            className={`w-5 h-5 ${
                              alert.type === 'critical'
                                ? 'text-red-500'
                                : 'text-yellow-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredAlerts.length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      <CheckCircle className='w-12 h-12 mx-auto mb-2 text-green-500' />
                      <p>현재 활성 알림이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* 하단 상태 정보 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className='flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200'
      >
        <div className='flex items-center gap-4'>
          <span>모니터링 상태: {data.status.enabled ? '활성' : '비활성'}</span>
          <span>메트릭 수: {data.status.metricsCount.toLocaleString()}</span>
          <span>알림 수: {data.status.alertsCount}</span>
        </div>

        {lastUpdate && (
          <span>마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}</span>
        )}
      </motion.div>
    </div>
  );
}
