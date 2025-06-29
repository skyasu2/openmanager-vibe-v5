/**
 * 🎯 통합 관리자 대시보드 v4.0 - 2025.01.27 KST
 *
 * ✅ 실제 API 데이터만 사용 (목업 제거)
 * ✅ 간소화된 UI/UX 디자인
 * ✅ 핵심 기능 중심 재구성
 * ✅ 성능 최적화된 렌더링
 * ✅ 한국 시간대 기준 표시
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Database,
  Download,
  RefreshCw,
  Server,
  Shield,
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

// 실제 컴포넌트 Import
import LogDashboard from './LogDashboard';
import PerformanceDashboard from './PerformanceDashboard';

// 간소화된 타입 정의
interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  memoryUsage: number;
  environment: string;
  version: string;
  services: Array<{
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime?: number;
  }>;
}

interface QuickStats {
  totalRequests: number;
  activeConnections: number;
  errorRate: number;
  avgResponseTime: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

interface DashboardData {
  status: SystemStatus;
  stats: QuickStats;
  alerts: SystemAlert[];
  lastUpdate: string;
}

// 한국시간 포맷터
const formatKST = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function UnifiedAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 🚀 실제 시스템 데이터 가져오기 (목업 제거)
  const fetchRealSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 실제 시스템 상태 API 호출
      const systemResponse = await fetch('/api/system/status');

      if (!systemResponse.ok) {
        throw new Error(
          `시스템 API 오류: ${systemResponse.status} ${systemResponse.statusText}`
        );
      }

      const systemData = await systemResponse.json();

      // 성능 요약 데이터 가져오기
      let performanceData: any = {
        data: { totalRequests: 0, avgResponseTime: 0, errorRate: 0 },
      };
      try {
        const perfResponse = await fetch('/api/performance?summary=true');
        if (perfResponse.ok) {
          performanceData = await perfResponse.json();
        }
      } catch (perfError) {
        console.warn('⚠️ 성능 데이터 로드 실패 (선택사항):', perfError);
      }

      // 알림 데이터 생성 (실제 시스템 상태 기반)
      const alerts: SystemAlert[] = [];

      // 메모리 사용량 체크
      if (systemData.memoryUsage?.used > 100) {
        alerts.push({
          id: `memory-${Date.now()}`,
          type: 'warning',
          title: '메모리 사용량 주의',
          message: `현재 메모리 사용량: ${systemData.memoryUsage.used}MB`,
          timestamp: new Date().toISOString(),
        });
      }

      // 서비스 상태 체크
      if (systemData.processes) {
        Object.entries(systemData.processes).forEach(
          ([name, process]: [string, any]) => {
            if (process.status !== 'running') {
              alerts.push({
                id: `service-${name}-${Date.now()}`,
                type: 'error',
                title: `서비스 상태 이상`,
                message: `${name} 서비스가 ${process.status} 상태입니다`,
                timestamp: new Date().toISOString(),
              });
            }
          }
        );
      }

      // 전체 시스템 상태 결정
      const overallStatus: 'healthy' | 'warning' | 'critical' = alerts.some(
        a => a.type === 'critical'
      )
        ? 'critical'
        : alerts.some(a => a.type === 'error')
          ? 'warning'
          : alerts.some(a => a.type === 'warning')
            ? 'warning'
            : 'healthy';

      // 서비스 목록 구성
      const services = systemData.processes
        ? Object.entries(systemData.processes).map(
            ([name, process]: [string, any]) => ({
              name: name.replace('-', ' ').toUpperCase(),
              status:
                process.status === 'running'
                  ? ('running' as const)
                  : ('error' as const),
              uptime: systemData.uptime,
            })
          )
        : [];

      // 통합 대시보드 데이터 구성
      const dashboardData: DashboardData = {
        status: {
          overall: overallStatus,
          timestamp: systemData.timestamp || new Date().toISOString(),
          uptime: systemData.uptime || 0,
          memoryUsage: systemData.memoryUsage?.used || 0,
          environment: systemData.environment || 'development',
          version: systemData.version || '5.44.3',
          services,
        },
        stats: {
          totalRequests: performanceData.data?.totalRequests || 0,
          activeConnections: systemData.connections || 0,
          errorRate: performanceData.data?.errorRate || 0,
          avgResponseTime: performanceData.data?.avgResponseTime || 0,
        },
        alerts,
        lastUpdate: new Date().toISOString(),
      };

      setData(dashboardData);
      setLastUpdate(new Date());
      console.log('✅ 관리자 대시보드 실제 데이터 업데이트 완료 (KST)');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '시스템 데이터 로드 실패';
      setError(errorMessage);
      console.error('❌ 관리자 대시보드 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 자동 새로고침 (30초 간격)
  useEffect(() => {
    fetchRealSystemData();

    if (autoRefresh) {
      const interval = setInterval(fetchRealSystemData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 상태 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      case 'critical':
      case 'error':
        return <AlertTriangle className='w-5 h-5 text-red-500' />;
      default:
        return <Clock className='w-5 h-5 text-gray-500' />;
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // 알림 확인 처리
  const acknowledgeAlert = (alertId: string) => {
    if (data) {
      const updatedAlerts = data.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );
      setData({ ...data, alerts: updatedAlerts });
    }
  };

  // 리포트 내보내기
  const handleExportReport = () => {
    if (!data) return;

    const reportData = {
      exportTime: formatKST(new Date().toISOString()),
      systemStatus: data.status,
      statistics: data.stats,
      alerts: data.alerts,
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
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 로딩 상태
  if (loading && !data) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center'
        >
          <RefreshCw className='w-12 h-12 text-blue-600 animate-spin mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-700'>
            시스템 데이터 로딩 중...
          </h2>
          <p className='text-gray-500 mt-2'>
            실제 시스템 상태를 확인하고 있습니다
          </p>
        </motion.div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-lg shadow-lg p-8 max-w-md text-center'
        >
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>
            시스템 연결 실패
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <Button onClick={fetchRealSystemData} className='w-full'>
            <RefreshCw className='w-4 h-4 mr-2' />
            다시 시도
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 🎨 개선된 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white border-b border-gray-200 px-6 py-4'
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
              <Shield className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                시스템 관리자
              </h1>
              <p className='text-sm text-gray-600'>
                OpenManager Vibe {data.status.version} •{' '}
                {data.status.environment.toUpperCase()}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* 시스템 상태 표시 */}
            <div className='flex items-center gap-2'>
              {getStatusIcon(data.status.overall)}
              <span
                className='px-3 py-1 rounded-full text-sm font-medium text-white'
                style={{ backgroundColor: getStatusColor(data.status.overall) }}
              >
                {data.status.overall === 'healthy'
                  ? '정상'
                  : data.status.overall === 'warning'
                    ? '주의'
                    : '위험'}
              </span>
            </div>

            {/* 알림 버튼 */}
            <div className='relative'>
              <Button variant='outline' size='sm'>
                <Bell className='w-4 h-4 mr-2' />
                알림
              </Button>
              {data.alerts.filter(a => !a.acknowledged).length > 0 && (
                <span className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
                  {data.alerts.filter(a => !a.acknowledged).length}
                </span>
              )}
            </div>

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
              {autoRefresh ? 'AUTO' : 'MANUAL'}
            </Button>

            {/* 새로고침 버튼 */}
            <Button
              variant='outline'
              size='sm'
              onClick={fetchRealSystemData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>

            {/* 리포트 내보내기 */}
            <Button variant='outline' size='sm' onClick={handleExportReport}>
              <Download className='w-4 h-4 mr-2' />
              리포트
            </Button>
          </div>
        </div>
      </motion.header>

      {/* 📊 핵심 통계 카드 (간소화) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='p-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {/* 업타임 */}
          <Card className='bg-gradient-to-r from-green-500 to-emerald-600 text-white'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-100 text-sm'>시스템 업타임</p>
                  <p className='text-2xl font-bold'>
                    {Math.floor(data.status.uptime / 3600)}h{' '}
                    {Math.floor((data.status.uptime % 3600) / 60)}m
                  </p>
                </div>
                <Clock className='w-8 h-8 text-green-200' />
              </div>
            </CardContent>
          </Card>

          {/* 메모리 사용량 */}
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-600 text-sm'>메모리 사용량</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {data.status.memoryUsage}MB
                  </p>
                </div>
                <Database className='w-6 h-6 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          {/* 총 요청 */}
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-600 text-sm'>총 요청</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {data.stats.totalRequests.toLocaleString()}
                  </p>
                </div>
                <Activity className='w-6 h-6 text-purple-500' />
              </div>
            </CardContent>
          </Card>

          {/* 활성 서비스 */}
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-600 text-sm'>활성 서비스</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    {
                      data.status.services.filter(s => s.status === 'running')
                        .length
                    }
                    /{data.status.services.length}
                  </p>
                </div>
                <Server className='w-6 h-6 text-orange-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📋 탭 시스템 (간소화) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className='grid w-full grid-cols-5 mb-6'>
              <TabsTrigger value='overview'>🏠 개요</TabsTrigger>
              <TabsTrigger value='services'>⚙️ 서비스</TabsTrigger>
              <TabsTrigger value='performance'>📊 성능</TabsTrigger>
              <TabsTrigger value='logs'>📝 로그</TabsTrigger>
              <TabsTrigger value='alerts'>🚨 알림</TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value='overview' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* 시스템 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Server className='w-5 h-5 text-blue-600' />
                      시스템 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>버전</span>
                      <Badge variant='outline'>{data.status.version}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>환경</span>
                      <Badge variant='outline'>{data.status.environment}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>시작 시간</span>
                      <span className='text-sm text-gray-700'>
                        {formatKST(data.status.timestamp)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>마지막 업데이트</span>
                      <span className='text-sm text-gray-700'>
                        {lastUpdate ? formatKST(lastUpdate.toISOString()) : '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 성능 요약 */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <TrendingUp className='w-5 h-5 text-green-600' />
                      성능 요약
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>평균 응답시간</span>
                      <span className='font-medium'>
                        {data.stats.avgResponseTime}ms
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>에러율</span>
                      <span
                        className={`font-medium ${data.stats.errorRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {(data.stats.errorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>활성 연결</span>
                      <span className='font-medium'>
                        {data.stats.activeConnections}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 서비스 탭 */}
            <TabsContent value='services' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Zap className='w-5 h-5 text-orange-600' />
                    시스템 서비스 ({data.status.services.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {data.status.services.map((service, index) => (
                      <motion.div
                        key={service.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(service.status)}
                          <div>
                            <p className='font-medium text-gray-900'>
                              {service.name}
                            </p>
                            {service.uptime && (
                              <p className='text-xs text-gray-500'>
                                업타임: {Math.floor(service.uptime / 3600)}시간
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: getStatusColor(service.status),
                            color: 'white',
                          }}
                        >
                          {service.status === 'running' ? '실행중' : '중지됨'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 성능 탭 */}
            <TabsContent value='performance'>
              <PerformanceDashboard />
            </TabsContent>

            {/* 로그 탭 */}
            <TabsContent value='logs'>
              <LogDashboard />
            </TabsContent>

            {/* 알림 탭 */}
            <TabsContent value='alerts' className='space-y-4'>
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
                              </div>
                              <h4 className='font-medium text-gray-900 mb-1'>
                                {alert.title}
                              </h4>
                              <p className='text-sm text-gray-700 mb-2'>
                                {alert.message}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {formatKST(alert.timestamp)}
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
          </Tabs>
        </motion.div>
      </motion.section>

      {/* 푸터 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className='border-t border-gray-200 bg-white px-6 py-4 text-sm text-gray-500'
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <span>OpenManager Vibe {data.status.version}</span>
            <span>환경: {data.status.environment.toUpperCase()}</span>
            <span>업타임: {Math.floor(data.status.uptime / 3600)}시간</span>
          </div>
          {lastUpdate && (
            <span>마지막 업데이트: {formatKST(lastUpdate.toISOString())}</span>
          )}
        </div>
      </motion.footer>
    </div>
  );
}
