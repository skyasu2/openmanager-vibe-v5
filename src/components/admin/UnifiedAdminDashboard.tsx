/**
 * 🎯 통합 관리자 대시보드 v3.0
 *
 * ✅ 성능 모니터링 + 로깅 시스템 통합
 * ✅ AI 엔진 상태 관리
 * ✅ 실시간 알림 시스템
 * ✅ 시스템 헬스 체크
 * ✅ MCP 모니터링
 * ✅ 개발자 도구 통합
 * ✅ 로그 뷰어 통합
 * ✅ 알림 관리 시스템
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  CheckCircle,
  Clock,
  Code,
  Database,
  Download,
  FileText,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Terminal,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 컴포넌트 Import (기존 개별 페이지들의 기능)
import LogDashboard from './LogDashboard';
import PerformanceDashboard from './PerformanceDashboard';

// Dev Tools 컴포넌트들
import AITestPanel from '@/components/dev-tools/AITestPanel';
import KeyManagerPanel from '@/components/dev-tools/KeyManagerPanel';
import MCPDeveloperPanel from '@/components/dev-tools/MCPDeveloperPanel';
import ServiceStatusPanel from '@/components/dev-tools/ServiceStatusPanel';
import { VercelAPITesterPanel } from '@/components/dev-tools/VercelAPITesterPanel';

// 타입 정의
interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  performance: {
    score: number;
    status: 'good' | 'warning' | 'critical';
    metrics: {
      avgResponseTime: number;
      successRate: number;
      errorRate: number;
      fallbackRate: number;
    };
  };
  logging: {
    status: 'active' | 'inactive';
    totalLogs: number;
    errorRate: number;
    lastLogTime?: string;
  };
  engines: {
    active: number;
    total: number;
    engines: Array<{
      name: string;
      status: 'active' | 'inactive' | 'error';
      lastUsed?: string;
      performance?: number;
    }>;
  };
  infrastructure: {
    environment: string;
    uptime: number;
    memoryUsage: number;
    connections: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: 'performance' | 'logging' | 'engine' | 'system';
  acknowledged?: boolean;
}

interface DashboardData {
  status: SystemStatus;
  alerts: SystemAlert[];
  quickStats: {
    totalRequests: number;
    activeUsers: number;
    systemUptime: number;
    lastUpdate: string;
  };
}

// 색상 정의
const STATUS_COLORS = {
  healthy: '#10B981',
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  error: '#EF4444',
  active: '#10B981',
  inactive: '#6B7280',
};

export default function UnifiedAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // 📡 시스템 데이터 가져오기
  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 데이터 요청
      const [performanceRes, logsRes, systemRes] = await Promise.all([
        fetch('/api/performance?summary=true'),
        fetch('/api/logs?summary=true'),
        fetch('/api/system/status'),
      ]);

      const [performanceData, logsData, systemData] = await Promise.all([
        performanceRes.json(),
        logsRes.json(),
        systemRes.json(),
      ]);

      // 데이터 통합
      const combinedData: DashboardData = {
        status: {
          overall: determineOverallStatus(
            performanceData,
            logsData,
            systemData
          ),
          performance: {
            score: performanceData.data?.score || 0,
            status: performanceData.data?.status || 'warning',
            metrics: performanceData.data?.metrics || {
              avgResponseTime: 0,
              successRate: 0,
              errorRate: 0,
              fallbackRate: 0,
            },
          },
          logging: {
            status: logsData.data?.status?.enabled ? 'active' : 'inactive',
            totalLogs: logsData.data?.stats?.totalLogs || 0,
            errorRate: logsData.data?.stats?.errorRate || 0,
            lastLogTime: logsData.data?.status?.lastLogTime,
          },
          engines: {
            active: systemData.data?.engines?.active || 0,
            total: systemData.data?.engines?.total || 0,
            engines: systemData.data?.engines?.list || [],
          },
          infrastructure: {
            environment: systemData.data?.environment || 'Unknown',
            uptime: systemData.data?.uptime || 0,
            memoryUsage: systemData.data?.memoryUsage || 0,
            connections: systemData.data?.connections || 0,
          },
        },
        alerts: combineAlerts(performanceData, logsData, systemData),
        quickStats: {
          totalRequests: performanceData.data?.totalRequests || 0,
          activeUsers: systemData.data?.activeUsers || 0,
          systemUptime: systemData.data?.uptime || 0,
          lastUpdate: new Date().toISOString(),
        },
      };

      setData(combinedData);
      setLastUpdate(new Date());
      setUnreadAlerts(
        combinedData.alerts.filter(alert => !alert.acknowledged).length
      );

      console.log('✅ 통합 대시보드 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 데이터 로드 실패';
      setError(errorMessage);
      console.error('❌ 통합 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 전체 시스템 상태 결정
  const determineOverallStatus = (
    performance: any,
    logs: any,
    system: any
  ): 'healthy' | 'warning' | 'critical' => {
    const criticalIssues = [
      performance.data?.score < 50,
      logs.data?.stats?.errorRate > 0.1,
      system.data?.memoryUsage > 90,
      !system.data?.engines?.active,
    ].filter(Boolean).length;

    const warningIssues = [
      performance.data?.score < 80,
      logs.data?.stats?.errorRate > 0.05,
      system.data?.memoryUsage > 70,
      system.data?.engines?.active < system.data?.engines?.total,
    ].filter(Boolean).length;

    if (criticalIssues > 0) return 'critical';
    if (warningIssues > 1) return 'warning';
    return 'healthy';
  };

  // 알림 통합
  const combineAlerts = (
    performance: any,
    logs: any,
    system: any
  ): SystemAlert[] => {
    const alerts: SystemAlert[] = [];

    // 성능 알림
    if (performance.data?.alerts) {
      alerts.push(
        ...performance.data.alerts.map((alert: any) => ({
          ...alert,
          source: 'performance' as const,
        }))
      );
    }

    // 로그 알림
    if (logs.data?.stats?.errorRate > 0.1) {
      alerts.push({
        id: `log-error-${Date.now()}`,
        type: 'warning' as const,
        title: '높은 에러율 감지',
        message: `로그 에러율이 ${(logs.data.stats.errorRate * 100).toFixed(1)}%입니다.`,
        timestamp: new Date().toISOString(),
        source: 'logging' as const,
      });
    }

    // 시스템 알림
    if (system.data?.memoryUsage > 85) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'critical' as const,
        title: '높은 메모리 사용량',
        message: `메모리 사용량이 ${system.data.memoryUsage}%입니다.`,
        timestamp: new Date().toISOString(),
        source: 'system' as const,
      });
    }

    return alerts.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // 🔄 자동 새로고침
  useEffect(() => {
    fetchSystemData();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemData, 30000); // 30초마다
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 📊 시스템 상태 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
      case 'active':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      case 'critical':
      case 'error':
        return <AlertTriangle className='w-5 h-5 text-red-500' />;
      case 'inactive':
        return <Clock className='w-5 h-5 text-gray-500' />;
      default:
        return <Activity className='w-5 h-5 text-blue-500' />;
    }
  };

  // 🎨 상태 배지 색상
  const getStatusBadgeColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
  };

  // 📥 시스템 리포트 내보내기
  const handleExportReport = async () => {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        systemStatus: data?.status,
        alerts: data?.alerts,
        quickStats: data?.quickStats,
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('리포트 내보내기 실패:', error);
    }
  };

  // 🔔 알림 확인
  const acknowledgeAlert = (alertId: string) => {
    if (data) {
      const updatedAlerts = data.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );
      setData({ ...data, alerts: updatedAlerts });
      setUnreadAlerts(
        updatedAlerts.filter(alert => !alert.acknowledged).length
      );
    }
  };

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className='p-6 space-y-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center gap-2 text-blue-600'>
            <RefreshCw className='w-8 h-8 animate-spin' />
            <span className='text-lg'>시스템 데이터 로딩 중...</span>
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
            시스템 데이터 로드 실패
          </h3>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchSystemData} variant='destructive'>
            <RefreshCw className='w-4 h-4 mr-2' />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

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
            <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <Shield className='w-6 h-6 text-white' />
            </div>
            OpenManager Vibe v5 관리자 대시보드
          </h1>
          <p className='text-gray-600 mt-1'>
            AI 엔진 통합 모니터링 및 시스템 관리
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* 시스템 상태 */}
          <div className='flex items-center gap-2'>
            {getStatusIcon(data.status.overall)}
            <span
              className='px-3 py-1 rounded-full text-sm font-medium text-white'
              style={{
                backgroundColor: getStatusBadgeColor(data.status.overall),
              }}
            >
              {data.status.overall === 'healthy'
                ? '정상'
                : data.status.overall === 'warning'
                  ? '주의'
                  : '위험'}
            </span>
          </div>

          {/* 알림 카운터 */}
          <div className='relative'>
            <Button variant='outline' size='sm'>
              <Bell className='w-4 h-4 mr-2' />
              알림
            </Button>
            {unreadAlerts > 0 && (
              <span className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
                {unreadAlerts}
              </span>
            )}
          </div>

          {/* 자동 새로고침 */}
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

          {/* 리포트 내보내기 */}
          <Button variant='outline' size='sm' onClick={handleExportReport}>
            <Download className='w-4 h-4 mr-2' />
            리포트 내보내기
          </Button>

          {/* 수동 새로고침 */}
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSystemData}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
        </div>
      </motion.div>

      {/* 퀵 스탯 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      >
        {/* 성능 점수 */}
        <Card className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-blue-100 text-sm'>성능 점수</p>
                <p className='text-3xl font-bold'>
                  {data.status.performance.score}
                </p>
                <p className='text-blue-100 text-xs'>/ 100</p>
              </div>
              <BarChart3 className='w-8 h-8 text-blue-200' />
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
                  {data.quickStats.totalRequests.toLocaleString()}
                </p>
              </div>
              <Activity className='w-6 h-6 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        {/* 활성 엔진 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>활성 엔진</p>
                <p className='text-2xl font-bold text-green-600'>
                  {data.status.engines.active} / {data.status.engines.total}
                </p>
              </div>
              <Brain className='w-6 h-6 text-green-500' />
            </div>
          </CardContent>
        </Card>

        {/* 시스템 업타임 */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>시스템 업타임</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {Math.round(data.quickStats.systemUptime / 3600)}h
                </p>
              </div>
              <Clock className='w-6 h-6 text-orange-500' />
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
          <TabsList className='grid w-full grid-cols-7'>
            <TabsTrigger value='overview'>🏠 개요</TabsTrigger>
            <TabsTrigger value='performance'>📊 성능</TabsTrigger>
            <TabsTrigger value='logs'>📝 로그</TabsTrigger>
            <TabsTrigger value='mcp'>🔧 MCP</TabsTrigger>
            <TabsTrigger value='devtools'>💻 개발도구</TabsTrigger>
            <TabsTrigger value='alerts'>🚨 알림</TabsTrigger>
            <TabsTrigger value='engines'>🤖 AI 엔진</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* 시스템 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Server className='w-5 h-5 text-blue-600' />
                    시스템 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>전체 상태</span>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(data.status.overall)}
                      <span className='font-medium'>
                        {data.status.overall === 'healthy'
                          ? '정상'
                          : data.status.overall === 'warning'
                            ? '주의'
                            : '위험'}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>환경</span>
                    <Badge variant='outline'>
                      {data.status.infrastructure.environment}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>메모리 사용량</span>
                    <span className='font-medium'>
                      {data.status.infrastructure.memoryUsage.toFixed(1)}%
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>활성 연결</span>
                    <span className='font-medium'>
                      {data.status.infrastructure.connections}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* AI 엔진 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Brain className='w-5 h-5 text-purple-600' />
                    AI 엔진 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {data.status.engines.engines.map((engine, index) => (
                      <motion.div
                        key={engine.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(engine.status)}
                          <div>
                            <p className='font-medium text-gray-900'>
                              {engine.name}
                            </p>
                            {engine.lastUsed && (
                              <p className='text-xs text-gray-500'>
                                마지막 사용:{' '}
                                {new Date(engine.lastUsed).toLocaleString(
                                  'ko-KR'
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='text-right'>
                          <Badge
                            style={{
                              backgroundColor: getStatusBadgeColor(
                                engine.status
                              ),
                              color: 'white',
                            }}
                          >
                            {engine.status === 'active'
                              ? '활성'
                              : engine.status === 'inactive'
                                ? '비활성'
                                : '오류'}
                          </Badge>
                          {engine.performance && (
                            <p className='text-xs text-gray-500 mt-1'>
                              성능: {engine.performance.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 최근 성능 메트릭 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5 text-green-600' />
                    성능 메트릭
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>평균 응답시간</span>
                    <span className='font-medium'>
                      {Math.round(
                        data.status.performance.metrics.avgResponseTime
                      )}
                      ms
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>성공률</span>
                    <span className='font-medium text-green-600'>
                      {(
                        data.status.performance.metrics.successRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>에러율</span>
                    <span className='font-medium text-red-600'>
                      {(
                        data.status.performance.metrics.errorRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>폴백률</span>
                    <span className='font-medium text-yellow-600'>
                      {(
                        data.status.performance.metrics.fallbackRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 로깅 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-blue-600' />
                    로깅 시스템
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>상태</span>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(data.status.logging.status)}
                      <span className='font-medium'>
                        {data.status.logging.status === 'active'
                          ? '활성'
                          : '비활성'}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>총 로그 수</span>
                    <span className='font-medium'>
                      {data.status.logging.totalLogs.toLocaleString()}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>에러율</span>
                    <span className='font-medium text-red-600'>
                      {(data.status.logging.errorRate * 100).toFixed(1)}%
                    </span>
                  </div>

                  {data.status.logging.lastLogTime && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>마지막 로그</span>
                      <span className='text-xs text-gray-500'>
                        {new Date(
                          data.status.logging.lastLogTime
                        ).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 성능 탭 */}
          <TabsContent value='performance'>
            <PerformanceDashboard />
          </TabsContent>

          {/* 로그 탭 */}
          <TabsContent value='logs'>
            <LogDashboard />
          </TabsContent>

          {/* MCP 모니터링 탭 */}
          <TabsContent value='mcp' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {/* MCP 시스템 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Zap className='w-5 h-5 text-orange-600' />
                    MCP 시스템 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>FastAPI 서버</span>
                    <Badge className='bg-green-100 text-green-800'>정상</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>MCP 연결</span>
                    <Badge className='bg-green-100 text-green-800'>
                      연결됨
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Keep-Alive</span>
                    <Badge className='bg-green-100 text-green-800'>활성</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>평균 지연시간</span>
                    <span className='font-medium'>45ms</span>
                  </div>
                </CardContent>
              </Card>

              {/* MCP 성능 지표 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='w-5 h-5 text-blue-600' />
                    성능 지표
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>총 쿼리</span>
                    <span className='font-medium'>1,247</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>성공률</span>
                    <span className='font-medium text-green-600'>98.5%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>캐시 적중률</span>
                    <span className='font-medium text-blue-600'>87.2%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>평균 응답시간</span>
                    <span className='font-medium'>123ms</span>
                  </div>
                </CardContent>
              </Card>

              {/* MCP 컨텍스트 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Database className='w-5 h-5 text-purple-600' />
                    컨텍스트 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Basic Context</span>
                    <Badge className='bg-green-100 text-green-800'>활성</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Advanced Context
                    </span>
                    <Badge className='bg-green-100 text-green-800'>활성</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Custom Context
                    </span>
                    <Badge className='bg-green-100 text-green-800'>활성</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>문서 수</span>
                    <span className='font-medium'>156</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MCP 제어 버튼 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='w-5 h-5 text-gray-600' />
                  MCP 시스템 제어
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-3'>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <RefreshCw className='w-4 h-4' />
                    시스템 재시작
                  </Button>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <Activity className='w-4 h-4' />
                    연결 테스트
                  </Button>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <Database className='w-4 h-4' />
                    캐시 클리어
                  </Button>
                  <Button variant='outline' className='flex items-center gap-2'>
                    <FileText className='w-4 h-4' />
                    로그 다운로드
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개발자 도구 탭 */}
          <TabsContent value='devtools' className='space-y-6'>
            <div className='space-y-6'>
              {/* Vercel API 테스터 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Code className='w-5 h-5 text-blue-600' />
                    Vercel API 테스터
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VercelAPITesterPanel />
                </CardContent>
              </Card>

              {/* MCP 개발자 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Terminal className='w-5 h-5 text-green-600' />
                    MCP 개발자 도구
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MCPDeveloperPanel />
                </CardContent>
              </Card>

              {/* 서비스 상태 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Server className='w-5 h-5 text-purple-600' />
                    서비스 상태 모니터링
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceStatusPanel autoRefresh={autoRefresh} />
                </CardContent>
              </Card>

              {/* 키 관리자 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='w-5 h-5 text-red-600' />키 관리자
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <KeyManagerPanel />
                </CardContent>
              </Card>

              {/* AI 테스트 패널 */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Brain className='w-5 h-5 text-orange-600' />
                    AI 엔진 테스트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AITestPanel />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 알림 탭 */}
          <TabsContent value='alerts' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bell className='w-5 h-5 text-red-600' />
                  시스템 알림 ({data.alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  <AnimatePresence>
                    {data.alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.type === 'critical'
                            ? 'bg-red-50 border-red-500'
                            : alert.type === 'error'
                              ? 'bg-red-50 border-red-400'
                              : alert.type === 'warning'
                                ? 'bg-yellow-50 border-yellow-500'
                                : 'bg-blue-50 border-blue-500'
                        } ${alert.acknowledged ? 'opacity-60' : ''}`}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <Badge
                                variant={
                                  alert.type === 'critical' ||
                                  alert.type === 'error'
                                    ? 'destructive'
                                    : alert.type === 'warning'
                                      ? 'secondary'
                                      : 'default'
                                }
                              >
                                {alert.type.toUpperCase()}
                              </Badge>
                              <span className='text-sm font-medium text-gray-600'>
                                {alert.source}
                              </span>
                            </div>
                            <h4 className='font-medium text-gray-900 mb-1'>
                              {alert.title}
                            </h4>
                            <p className='text-sm text-gray-700 mb-2'>
                              {alert.message}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {new Date(alert.timestamp).toLocaleString(
                                'ko-KR'
                              )}
                            </p>
                          </div>

                          {!alert.acknowledged && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className='w-3 h-3 mr-1' />
                              확인
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {data.alerts.length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      <CheckCircle className='w-12 h-12 mx-auto mb-2 text-green-500' />
                      <p>현재 활성 알림이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 엔진 탭 */}
          <TabsContent value='engines' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Brain className='w-5 h-5 text-purple-600' />
                  AI 엔진 상세 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {data.status.engines.engines.map((engine, index) => (
                    <motion.div
                      key={engine.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='font-semibold text-gray-900'>
                          {engine.name}
                        </h3>
                        <Badge
                          style={{
                            backgroundColor: getStatusBadgeColor(engine.status),
                            color: 'white',
                          }}
                        >
                          {engine.status === 'active'
                            ? '활성'
                            : engine.status === 'inactive'
                              ? '비활성'
                              : '오류'}
                        </Badge>
                      </div>

                      <div className='space-y-2 text-sm'>
                        {engine.performance && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>성능:</span>
                            <span className='font-medium'>
                              {engine.performance.toFixed(1)}%
                            </span>
                          </div>
                        )}

                        {engine.lastUsed && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>마지막 사용:</span>
                            <span className='text-xs text-gray-500'>
                              {new Date(engine.lastUsed).toLocaleString(
                                'ko-KR'
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className='mt-4 flex gap-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Settings className='w-3 h-3 mr-1' />
                          설정
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Activity className='w-3 h-3 mr-1' />
                          테스트
                        </Button>
                      </div>
                    </motion.div>
                  ))}
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
          <span>OpenManager Vibe v5.21.0</span>
          <span>환경: {data.status.infrastructure.environment}</span>
          <span>
            업타임: {Math.round(data.status.infrastructure.uptime / 3600)}시간
          </span>
        </div>

        {lastUpdate && (
          <span>마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}</span>
        )}
      </motion.div>
    </div>
  );
}
