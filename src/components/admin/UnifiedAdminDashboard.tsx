/**
 * 🎯 통합 관리자 대시보드 v5.0 - 2025.06.27 KST
 *
 * ✅ 통합 실시간 스토어 사용
 * ✅ 중복 API 호출 제거
 * ✅ 30초 통일 폴링 간격
 * ✅ 메모리 최적화
 * ✅ 성능 향상
 */

'use client';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Database,
  FileText,
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

// 통합 실시간 스토어 사용
import {
  usePerformanceData,
  useRealtimeControl,
  useServerList,
  useSystemStatus,
} from '@/stores/globalRealtimeStore';

// 실제 컴포넌트 Import
import LogDashboard from './LogDashboard';
import PerformanceDashboard from './PerformanceDashboard';

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔄 통합 실시간 데이터 사용
  const {
    systemStatus,
    lastUpdate: systemLastUpdate,
    error: systemError,
  } = useSystemStatus();
  const {
    performanceData,
    lastUpdate: performanceLastUpdate,
    error: performanceError,
  } = usePerformanceData();
  const {
    servers,
    lastUpdate: serverLastUpdate,
    error: serverError,
  } = useServerList();
  const { isPolling, startPolling, stopPolling, clearError } =
    useRealtimeControl();

  // 🎬 컴포넌트 마운트시 실시간 폴링 시작
  useEffect(() => {
    console.log('🎯 관리자 대시보드 마운트 - 통합 실시간 폴링 시작');
    startPolling();

    return () => {
      console.log('🎯 관리자 대시보드 언마운트 - 통합 실시간 폴링 중단');
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // 🔄 수동 새로고침
  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearError();

    // 잠시 폴링을 중단하고 다시 시작하여 즉시 업데이트
    stopPolling();
    setTimeout(() => {
      startPolling();
      setIsRefreshing(false);
    }, 1000);
  };

  // 🎨 한국시간 포맷
  const formatKSTTime = (date: Date | null) => {
    if (!date) return '업데이트 없음';
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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

  // 전체 에러 상태
  const hasError = systemError || performanceError || serverError;
  const latestUpdate = [
    systemLastUpdate,
    performanceLastUpdate,
    serverLastUpdate,
  ]
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      {/* 🎯 헤더 */}
      <div className='bg-white border-b border-gray-200 shadow-sm'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Shield className='w-8 h-8 text-amber-600' />
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    관리자 대시보드
                  </h1>
                  <p className='text-sm text-gray-500'>
                    OpenManager Vibe v5 시스템 제어
                  </p>
                </div>
              </div>

              {/* 실시간 상태 표시 */}
              <div className='flex items-center space-x-2'>
                {isPolling ? (
                  <div className='flex items-center space-x-1 text-green-600'>
                    <Wifi className='w-4 h-4' />
                    <span className='text-sm font-medium'>실시간 연결됨</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-1 text-red-600'>
                    <WifiOff className='w-4 h-4' />
                    <span className='text-sm font-medium'>연결 끊김</span>
                  </div>
                )}

                {hasError && (
                  <Badge variant='destructive' className='text-xs'>
                    오류 발생
                  </Badge>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              {/* 마지막 업데이트 시간 */}
              <div className='text-right'>
                <p className='text-xs text-gray-500'>마지막 업데이트</p>
                <p className='text-sm font-medium text-gray-700'>
                  {formatKSTTime(latestUpdate)}
                </p>
              </div>

              {/* 새로고침 버튼 */}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant='outline'
                size='sm'
                className='flex items-center space-x-2'
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>{isRefreshing ? '새로고침 중...' : '새로고침'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 에러 표시 */}
      {hasError && (
        <div className='max-w-7xl mx-auto px-6 py-3'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
              <div>
                <h3 className='text-sm font-medium text-red-800'>
                  시스템 오류 발생
                </h3>
                <p className='text-sm text-red-700 mt-1'>
                  {systemError || performanceError || serverError}
                </p>
              </div>
              <Button
                onClick={clearError}
                variant='outline'
                size='sm'
                className='ml-auto'
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 메인 콘텐츠 */}
      <div className='max-w-7xl mx-auto px-6 py-6'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          {/* 탭 네비게이션 */}
          <TabsList className='grid w-full grid-cols-5 bg-white border border-gray-200 rounded-lg p-1'>
            <TabsTrigger
              value='overview'
              className='flex items-center space-x-2'
            >
              <TrendingUp className='w-4 h-4' />
              <span>개요</span>
            </TabsTrigger>
            <TabsTrigger
              value='services'
              className='flex items-center space-x-2'
            >
              <Server className='w-4 h-4' />
              <span>서비스</span>
            </TabsTrigger>
            <TabsTrigger
              value='performance'
              className='flex items-center space-x-2'
            >
              <BarChart3 className='w-4 h-4' />
              <span>성능</span>
            </TabsTrigger>
            <TabsTrigger value='logs' className='flex items-center space-x-2'>
              <FileText className='w-4 h-4' />
              <span>로그</span>
            </TabsTrigger>
            <TabsTrigger value='alerts' className='flex items-center space-x-2'>
              <Bell className='w-4 h-4' />
              <span>알림</span>
            </TabsTrigger>
          </TabsList>

          {/* 🏠 개요 탭 */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
              {/* 시스템 상태 카드 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    시스템 상태
                  </CardTitle>
                  {getStatusIcon(systemStatus?.health || 'offline')}
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {systemStatus?.health?.toUpperCase() || 'OFFLINE'}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    업타임:{' '}
                    {systemStatus?.uptime
                      ? `${Math.floor(systemStatus.uptime / 3600)}시간`
                      : '0시간'}
                  </p>
                </CardContent>
              </Card>

              {/* 메모리 사용률 카드 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    메모리 사용률
                  </CardTitle>
                  <Database className='w-4 h-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {systemStatus?.memoryUsage?.percentage || 0}%
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {systemStatus?.memoryUsage?.used || 0}MB /{' '}
                    {systemStatus?.memoryUsage?.total || 0}MB
                  </p>
                </CardContent>
              </Card>

              {/* 성능 점수 카드 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    성능 점수
                  </CardTitle>
                  <Zap className='w-4 h-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {performanceData?.metrics?.performanceScore || 0}점
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    응답시간: {performanceData?.metrics?.avgResponseTime || 0}ms
                  </p>
                </CardContent>
              </Card>

              {/* 서버 현황 카드 */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    서버 현황
                  </CardTitle>
                  <Activity className='w-4 h-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {servers.filter(s => s.status === 'healthy').length}/
                    {servers.length}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    정상 서버 / 전체 서버
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 최근 서버 목록 (상위 8개) */}
            <Card>
              <CardHeader>
                <CardTitle>서버 현황 (실시간)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {servers.slice(0, 8).map(server => (
                    <div
                      key={server.id}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        {getStatusIcon(server.status)}
                        <div>
                          <p className='font-medium'>{server.name}</p>
                          <p className='text-sm text-gray-500'>
                            CPU: {server.cpu}% | 메모리: {server.memory}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          server.status === 'healthy'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {server.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ⚙️ 서비스 탭 */}
          <TabsContent value='services' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>핵심 서비스 상태</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {Object.entries(systemStatus?.processes || {}).map(
                    ([name, process]) => (
                      <div key={name} className='p-4 border rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <h3 className='font-medium'>{name}</h3>
                          {getStatusIcon((process as any)?.status || 'offline')}
                        </div>
                        <p className='text-sm text-gray-600'>
                          PID: {(process as any)?.pid || 'N/A'}
                        </p>
                        <p className='text-sm text-gray-600'>
                          상태: {(process as any)?.status || 'offline'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 📊 성능 탭 */}
          <TabsContent value='performance'>
            <PerformanceDashboard />
          </TabsContent>

          {/* 📝 로그 탭 */}
          <TabsContent value='logs'>
            <LogDashboard />
          </TabsContent>

          {/* 🚨 알림 탭 */}
          <TabsContent value='alerts' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>시스템 알림</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8'>
                  <Bell className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>새로운 알림이 없습니다</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
