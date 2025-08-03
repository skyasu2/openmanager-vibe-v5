/**
 * 📝 로깅 시스템 대시보드 v2.0
 *
 * ✅ 실시간 로그 모니터링
 * ✅ 고급 검색 및 필터링
 * ✅ 로그 분석 및 통계
 * ✅ 로그 내보내기 및 관리
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Filter,
  Info,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

// 동적 import로 차트 컴포넌트들 로드
import type {
  BarChart as BarChartType,
  LineChart as LineChartType,
  PieChart as PieChartType,
  ResponsiveContainer as ResponsiveContainerType,
  XAxis as XAxisType,
  YAxis as YAxisType,
  CartesianGrid as CartesianGridType,
  Tooltip as TooltipType,
  Bar as BarType,
  Line as LineType,
  Cell as CellType,
  Pie as PieType,
} from 'recharts';

const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof BarChartType>>;

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof LineChartType>>;

const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof PieChartType>>;

const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof ResponsiveContainerType>>;

const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as any),
  {
    ssr: false,
  }
) as React.ComponentType<React.ComponentProps<typeof XAxisType>>;

const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  {
    ssr: false,
  }
) as React.ComponentType<React.ComponentProps<typeof YAxisType>>;

const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof CartesianGridType>>;

const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof TooltipType>>;

const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof BarType>>;

const Line = dynamic(() => import('recharts').then((mod) => mod.Line as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof LineType>>;

const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof CellType>>;

const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof PieType>>;

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 타입 정의
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type LogCategory =
  | 'ai-engine'
  | 'fallback'
  | 'performance'
  | 'mcp'
  | 'google-ai'
  | 'rag'
  | 'system'
  | 'user'
  | 'security';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  source: string;
  message: string;
  data?: unknown;
  metadata?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    engine?: string;
    mode?: string;
    responseTime?: number;
    success?: boolean;
  };
  tags?: string[];
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LogStats {
  totalLogs: number;
  levelBreakdown: Record<LogLevel, number>;
  categoryBreakdown: Record<LogCategory, number>;
  errorRate: number;
  recentErrors: LogEntry[];
  timeRange: {
    oldest: string;
    newest: string;
  };
}

interface LogData {
  logs: LogEntry[];
  count: number;
  stats?: LogStats;
  status?: {
    enabled: boolean;
    logCount: number;
    lastLogTime?: string;
    config: Record<string, unknown>;
  };
}

// 색상 정의
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
  critical: '#DC2626',
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  'ai-engine': '#8B5CF6',
  fallback: '#F59E0B',
  performance: '#10B981',
  mcp: '#6366F1',
  'google-ai': '#3B82F6',
  rag: '#059669',
  system: '#6B7280',
  user: '#EC4899',
  security: '#DC2626',
};

export default function LogDashboard() {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('logs');

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<LogCategory[]>(
    []
  );
  const [selectedSource, setSelectedSource] = useState('');
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [limit, setLimit] = useState(100);

  // UI 상태
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // 📡 로그 데이터 가져오기
  const fetchLogData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (selectedLevels.length > 0) {
        params.append('levels', selectedLevels.join(','));
      }
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }
      if (selectedSource) {
        params.append('source', selectedSource);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (timeRange.start && timeRange.end) {
        params.append('startTime', timeRange.start);
        params.append('endTime', timeRange.end);
      }
      params.append('limit', limit.toString());
      params.append('includeStats', 'true');
      params.append('includeStatus', 'true');

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `API 응답 오류: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '로그 데이터 로드 실패');
      }

      setData(result.data);
      console.log('✅ 로그 대시보드 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      console.error('❌ 로그 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedLevels,
    selectedCategories,
    selectedSource,
    timeRange,
    limit,
  ]);

  // 🔄 자동 새로고침
  useEffect(() => {
    fetchLogData();

    if (autoRefresh) {
      // 🎯 데이터 생성기와 동기화: 30초 간격
      const interval = setInterval(fetchLogData, 30000);
      return () => clearInterval(interval);
    }
    return;
  }, [autoRefresh, fetchLogData]);

  // 📊 차트 데이터 변환
  const getLevelDistributionData = () => {
    if (!data?.stats?.levelBreakdown) return [];

    return Object.entries(data.stats.levelBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        name: level.toUpperCase(),
        value: count,
        color: LEVEL_COLORS[level as LogLevel],
      }));
  };

  const getCategoryDistributionData = () => {
    if (!data?.stats?.categoryBreakdown) return [];

    return Object.entries(data.stats.categoryBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        name: category,
        value: count,
        color: CATEGORY_COLORS[category as LogCategory],
      }));
  };

  const getHourlyLogsData = () => {
    if (!data?.logs) return [];

    const hourlyData: Record<string, number> = {};

    data.logs.forEach((log) => {
      const hour =
        new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({
        time: new Date(hour).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        count,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // 🎨 로그 레벨 아이콘
  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return <Eye className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // 🎨 커스텀 툴팁
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      name: string;
      value: number | string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 📥 로그 내보내기
  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLevels.length > 0)
        params.append('levels', selectedLevels.join(','));
      if (selectedCategories.length > 0)
        params.append('categories', selectedCategories.join(','));
      if (selectedSource) params.append('source', selectedSource);
      if (searchQuery) params.append('search', searchQuery);
      params.append('export', 'json');

      const response = await fetch(`/api/logs?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('로그 내보내기 실패:', error);
    }
  };

  // 🗑️ 로그 삭제
  const handleClearLogs = async () => {
    if (
      !confirm('모든 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    ) {
      return;
    }

    try {
      const response = await fetch('/api/logs?confirm=true', {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        await fetchLogData();
        alert('로그가 성공적으로 삭제되었습니다.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('로그 삭제 실패:', error);
      alert('로그 삭제에 실패했습니다.');
    }
  };

  // 🔄 필터 리셋
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLevels([]);
    setSelectedCategories([]);
    setSelectedSource('');
    setTimeRange({ start: '', end: '' });
    setLimit(100);
  };

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>로그 데이터 로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-red-800">
            데이터 로드 실패
          </h3>
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={fetchLogData} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const levelData = getLevelDistributionData();
  const categoryData = getCategoryDistributionData();
  const hourlyData = getHourlyLogsData();

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-blue-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            로깅 시스템 대시보드
          </h1>
          <p className="mt-1 text-gray-600">실시간 로그 모니터링 및 분석</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>

          <Button variant="destructive" size="sm" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            로그 삭제
          </Button>
        </div>
      </motion.div>

      {/* 요약 통계 */}
      {data.stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 로그</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.stats.totalLogs.toLocaleString()}
                  </p>
                </div>
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">에러율</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(data.stats.errorRate * 100).toFixed(1)}%
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">최근 에러</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.stats.recentErrors.length}
                  </p>
                </div>
                <XCircle className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">상태</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.status?.enabled ? '활성' : '비활성'}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 메인 대시보드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">📝 로그 뷰어</TabsTrigger>
            <TabsTrigger value="analytics">📊 분석</TabsTrigger>
            <TabsTrigger value="trends">📈 트렌드</TabsTrigger>
            <TabsTrigger value="settings">⚙️ 설정</TabsTrigger>
          </TabsList>

          {/* 로그 뷰어 탭 */}
          <TabsContent value="logs" className="space-y-6">
            {/* 검색 및 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  검색 및 필터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 검색 */}
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="로그 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                {/* 필터 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* 레벨 필터 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      레벨
                    </label>
                    <select
                      multiple
                      value={selectedLevels}
                      onChange={(e) =>
                        setSelectedLevels(
                          Array.from(
                            e.target.selectedOptions,
                            (option) => option.value as LogLevel
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      {Object.keys(LEVEL_COLORS).map((level) => (
                        <option key={level} value={level}>
                          {level.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 카테고리 필터 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      카테고리
                    </label>
                    <select
                      multiple
                      value={selectedCategories}
                      onChange={(e) =>
                        setSelectedCategories(
                          Array.from(
                            e.target.selectedOptions,
                            (option) => option.value as LogCategory
                          )
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      {Object.keys(CATEGORY_COLORS).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 소스 필터 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      소스
                    </label>
                    <input
                      type="text"
                      placeholder="소스 이름..."
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  {/* 제한 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      제한
                    </label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                      <option value={1000}>1000</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={fetchLogData} size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    검색
                  </Button>
                  <Button onClick={resetFilters} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    리셋
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 로그 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    로그 목록 ({data.count})
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  <AnimatePresence>
                    {data.logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                        onClick={() =>
                          setExpandedLog(expandedLog === log.id ? null : log.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-center gap-3">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded text-xs text-white"
                              style={{
                                backgroundColor: LEVEL_COLORS[log.level],
                              }}
                            >
                              {getLevelIcon(log.level)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <Badge
                                  style={{
                                    backgroundColor:
                                      CATEGORY_COLORS[log.category],
                                    color: 'white',
                                  }}
                                >
                                  {log.category}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900">
                                  {log.source}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleString(
                                    'ko-KR'
                                  )}
                                </span>
                              </div>
                              <p className="truncate text-sm text-gray-700">
                                {log.message}
                              </p>
                            </div>
                          </div>

                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>

                        {/* 확장된 로그 상세 */}
                        <AnimatePresence>
                          {expandedLog === log.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 border-t border-gray-200 pt-3"
                            >
                              {log.data != null && (
                                <div className="mb-2">
                                  <p className="mb-1 text-xs font-medium text-gray-600">
                                    데이터:
                                  </p>
                                  <pre className="overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.metadata && (
                                <div className="mb-2">
                                  <p className="mb-1 text-xs font-medium text-gray-600">
                                    메타데이터:
                                  </p>
                                  <div className="space-y-1 text-xs text-gray-500">
                                    {Object.entries(log.metadata).map(
                                      ([key, value]) => (
                                        <div key={key}>
                                          <span className="font-medium">
                                            {key}:
                                          </span>{' '}
                                          {String(value)}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {log.error && (
                                <div className="mb-2">
                                  <p className="mb-1 text-xs font-medium text-red-600">
                                    에러:
                                  </p>
                                  <div className="rounded bg-red-50 p-2 text-xs text-red-700">
                                    <p>
                                      <span className="font-medium">이름:</span>{' '}
                                      {log.error.name}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        메시지:
                                      </span>{' '}
                                      {log.error.message}
                                    </p>
                                    {log.error.stack && (
                                      <pre className="mt-1 overflow-x-auto text-xs">
                                        {log.error.stack}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              )}

                              {log.tags && log.tags.length > 0 && (
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-600">
                                    태그:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {log.tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {data.logs.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                      <p>조건에 맞는 로그가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 레벨별 분포 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    로그 레벨 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={levelData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {levelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 카테고리별 분포 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    카테고리별 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 트렌드 탭 */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  시간별 로그 트렌드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        name="로그 수"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  로깅 시스템 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.status && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          상태
                        </label>
                        <p className="text-lg">
                          {data.status.enabled ? '활성' : '비활성'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          총 로그 수
                        </label>
                        <p className="text-lg">
                          {data.status.logCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {data.status.lastLogTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          마지막 로그 시간
                        </label>
                        <p className="text-lg">
                          {new Date(data.status.lastLogTime).toLocaleString(
                            'ko-KR'
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        설정
                      </label>
                      <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                        {JSON.stringify(data.status.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
