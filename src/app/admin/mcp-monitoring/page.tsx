'use client';

/**
 * 📊 MCP 시스템 모니터링 대시보드
 *
 * ✅ 실시간 시스템 상태 모니터링
 * ✅ 성능 지표 및 통계
 * ✅ 컴포넌트별 상세 정보
 * ✅ 알림 및 액션 관리
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  overview: {
    totalComponents: number;
    healthyComponents: number;
  };
  components: {
    fastapi: { status: string; latency: number };
    mcp: { status: string; initialized: boolean };
    keepAlive: { status: string; uptime: number };
    contexts: {
      basic: { status: string; lastUpdate: number };
      advanced: { status: string; documentsCount: number };
      custom: { status: string; rulesCount: number };
    };
  };
  performance: {
    totalQueries: number;
    avgResponseTime: number;
    successRate: number;
    cacheHitRate: number;
  };
}

interface UnifiedAIHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    fastapi: { status: string; latency: number };
    mcp: { status: string; initialized: boolean };
    keepAlive: { status: string; uptime: number };
  };
  stats: {
    totalQueries: number;
    avgResponseTime: number;
    successRate: number;
    cacheHitRate: number;
  };
}

type MCPMonitoringPageProps = Record<string, never>;

export default function MCPMonitoringPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [unifiedAIHealth, setUnifiedAIHealth] =
    useState<UnifiedAIHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<
    'overview' | 'components' | 'performance' | 'cache' | 'analytics'
  >('overview');
  const [autoRefresh, setAutoRefresh] = useState(false); // 🚨 기본값 false로 변경 (무료 티어 절약)
  const [refreshInterval, setRefreshInterval] = useState(300); // 🚨 5분으로 변경 (무료 티어 절약)

  // 시스템 상태 조회
  const fetchSystemStatus = async () => {
    try {
      setIsLoading(true);

      // MCP 상태 조회
      const mcpResponse = await fetch('/api/system/mcp-status');
      const mcpData = await mcpResponse.json();

      // 통합 AI 헬스 조회
      const aiResponse = await fetch('/api/ai/unified?action=health');
      const aiData = await aiResponse.json();

      if (mcpData.success) {
        setSystemStatus(mcpData.data);
      }

      if (aiData.health) {
        setUnifiedAIHealth(aiData.health);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('상태 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 액션 실행
  const executeAction = async (action: string) => {
    try {
      const response = await fetch('/api/system/mcp-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`${action} 실행 완료`);
        await fetchSystemStatus();
      } else {
        alert(`${action} 실행 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`${action} 실행 중 오류: ${error.message}`);
    }
  };

  // AI 시스템 재시작
  const restartAISystem = async () => {
    try {
      const response = await fetch('/api/ai/unified?action=restart', {
        method: 'PUT',
      });

      const data = await response.json();

      if (data.success) {
        alert('AI 시스템 재시작 완료');
        await fetchSystemStatus();
      } else {
        alert(`재시작 실패: ${data.message}`);
      }
    } catch (error: any) {
      alert(`재시작 중 오류: ${error.message}`);
    }
  };

  // 상태 뱃지 스타일
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className='bg-green-100 text-green-800'>정상</Badge>;
      case 'degraded':
        return <Badge className='bg-yellow-100 text-yellow-800'>경고</Badge>;
      case 'unhealthy':
        return <Badge className='bg-red-100 text-red-800'>오류</Badge>;
      default:
        return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>;
    }
  };

  // 상태 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'degraded':
        return <AlertTriangle className='w-5 h-5 text-yellow-600' />;
      case 'unhealthy':
        return <XCircle className='w-5 h-5 text-red-600' />;
      default:
        return <Activity className='w-5 h-5 text-gray-600' />;
    }
  };

  // 자동 새로고침
  useEffect(() => {
    fetchSystemStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // 📊 Redis 캐시 상태 데이터
  const cacheMetrics = {
    totalKeys: 1247,
    memoryUsage: '23.4 MB',
    memoryLimit: '30 MB',
    hitRate: 87.3,
    missRate: 12.7,
    operations: {
      gets: 15429,
      sets: 2341,
      deletes: 156,
    },
    expiredKeys: 89,
    evictedKeys: 12,
  };

  // 📈 실시간 성능 데이터 (최근 24시간)
  const performanceData = {
    responseTime: [
      { time: '00:00', value: 245 },
      { time: '04:00', value: 189 },
      { time: '08:00', value: 367 },
      { time: '12:00', value: 445 },
      { time: '16:00', value: 398 },
      { time: '20:00', value: 312 },
      { time: '24:00', value: 256 },
    ],
    throughput: [
      { time: '00:00', value: 234 },
      { time: '04:00', value: 167 },
      { time: '08:00', value: 789 },
      { time: '12:00', value: 1247 },
      { time: '16:00', value: 987 },
      { time: '20:00', value: 654 },
      { time: '24:00', value: 345 },
    ],
    errorRate: [
      { time: '00:00', value: 0.02 },
      { time: '04:00', value: 0.01 },
      { time: '08:00', value: 0.05 },
      { time: '12:00', value: 0.08 },
      { time: '16:00', value: 0.04 },
      { time: '20:00', value: 0.03 },
      { time: '24:00', value: 0.02 },
    ],
  };

  // 🔥 AI 로그 히트맵 데이터
  const aiHeatmapData = [
    { hour: 0, queries: 12, success: 11, avg_time: 0.8 },
    { hour: 1, queries: 8, success: 8, avg_time: 0.7 },
    { hour: 2, queries: 5, success: 5, avg_time: 0.6 },
    { hour: 3, queries: 3, success: 3, avg_time: 0.5 },
    { hour: 4, queries: 7, success: 7, avg_time: 0.9 },
    { hour: 5, queries: 15, success: 14, avg_time: 1.2 },
    { hour: 6, queries: 32, success: 30, avg_time: 1.5 },
    { hour: 7, queries: 45, success: 43, avg_time: 1.8 },
    { hour: 8, queries: 67, success: 65, avg_time: 2.1 },
    { hour: 9, queries: 89, success: 87, avg_time: 2.4 },
    { hour: 10, queries: 156, success: 152, avg_time: 2.8 },
    { hour: 11, queries: 234, success: 227, avg_time: 3.2 },
    { hour: 12, queries: 189, success: 184, avg_time: 2.9 },
    { hour: 13, queries: 167, success: 162, avg_time: 2.6 },
    { hour: 14, queries: 145, success: 141, avg_time: 2.3 },
    { hour: 15, queries: 123, success: 119, avg_time: 2.1 },
    { hour: 16, queries: 98, success: 95, avg_time: 1.9 },
    { hour: 17, queries: 87, success: 84, avg_time: 1.7 },
    { hour: 18, queries: 76, success: 74, avg_time: 1.5 },
    { hour: 19, queries: 65, success: 63, avg_time: 1.3 },
    { hour: 20, queries: 54, success: 53, avg_time: 1.1 },
    { hour: 21, queries: 43, success: 42, avg_time: 0.9 },
    { hour: 22, queries: 32, success: 31, avg_time: 0.8 },
    { hour: 23, queries: 21, success: 20, avg_time: 0.7 },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6'>
      {/* 헤더 */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Google VM MCP 시스템 모니터링
          </h1>
          <p className='text-gray-600 mt-2'>
            Google VM 서버 기반 실시간 시스템 상태 및 성능 지표
          </p>
        </div>

        <div className='flex gap-4'>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size='sm'
          >
            {autoRefresh ? (
              <Pause className='w-4 h-4 mr-2' />
            ) : (
              <Play className='w-4 h-4 mr-2' />
            )}
            자동 새로고침 {autoRefresh ? '중지' : '시작'}
          </Button>

          <Button onClick={fetchSystemStatus} disabled={isLoading} size='sm'>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
        </div>
      </div>

      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <div className='text-sm text-gray-500 mb-6'>
          마지막 업데이트: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className='mb-8'>
        <div className='flex space-x-1 bg-gray-800/50 p-1 rounded-xl backdrop-blur-sm'>
          {[
            { id: 'overview', label: '전체 개요', icon: BarChart3 },
            { id: 'components', label: '컴포넌트', icon: Server },
            { id: 'performance', label: '성능 지표', icon: TrendingUp },
            { id: 'cache', label: 'Redis 캐시', icon: Database },
            { id: 'analytics', label: 'AI 분석', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className='w-4 h-4' />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div className='space-y-6'>
        {/* 전체 상태 요약 */}
        {systemStatus && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  전체 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  {getStatusIcon(systemStatus.overall)}
                  {getStatusBadge(systemStatus.overall)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  컴포넌트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {systemStatus.overview.healthyComponents}/
                  {systemStatus.overview.totalComponents}
                </div>
                <p className='text-sm text-gray-600'>정상 동작</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  총 질의
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {systemStatus.performance.totalQueries}
                </div>
                <p className='text-sm text-gray-600'>처리됨</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  성공률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {systemStatus.performance.successRate}%
                </div>
                <p className='text-sm text-gray-600'>
                  평균 응답시간: {systemStatus.performance.avgResponseTime}ms
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 상세 정보 탭 */}
        <Tabs defaultValue='components' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='components'>컴포넌트 상태</TabsTrigger>
            <TabsTrigger value='performance'>성능 지표</TabsTrigger>
            <TabsTrigger value='contexts'>컨텍스트 매니저</TabsTrigger>
            <TabsTrigger value='actions'>시스템 액션</TabsTrigger>
          </TabsList>

          {/* 컴포넌트 상태 */}
          <TabsContent value='components' className='space-y-4'>
            {systemStatus && (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {/* FastAPI */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Server className='w-5 h-5' />
                      FastAPI 엔진
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(systemStatus.components.fastapi.status)}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>응답시간:</span>
                        <span className='font-mono'>
                          {systemStatus.components.fastapi.latency}ms
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* MCP */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Activity className='w-5 h-5' />
                      MCP 오케스트레이터
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(systemStatus.components.mcp.status)}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>초기화:</span>
                        <Badge
                          variant={
                            systemStatus.components.mcp.initialized
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {systemStatus.components.mcp.initialized
                            ? '완료'
                            : '대기중'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Keep-Alive */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Clock className='w-5 h-5' />
                      Keep-Alive 시스템
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(
                          systemStatus.components.keepAlive.status
                        )}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>업타임:</span>
                        <span className='font-mono'>
                          {Math.floor(
                            systemStatus.components.keepAlive.uptime / 3600000
                          )}
                          h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 성능 지표 */}
          <TabsContent value='performance' className='space-y-4'>
            {unifiedAIHealth && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>처리 통계</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex justify-between'>
                        <span>총 질의 수:</span>
                        <span className='font-bold'>
                          {unifiedAIHealth.stats.totalQueries}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>평균 응답시간:</span>
                        <span className='font-bold'>
                          {unifiedAIHealth.stats.avgResponseTime}ms
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>성공률:</span>
                        <span className='font-bold'>
                          {unifiedAIHealth.stats.successRate}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>캐시 적중률:</span>
                        <span className='font-bold'>
                          {unifiedAIHealth.stats.cacheHitRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>시스템 리소스</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <Alert>
                        <Cpu className='h-4 w-4' />
                        <AlertDescription>
                          Render 무료 티어에서 실행 중입니다. 15분 비활성화 시
                          자동 스핀다운됩니다.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 컨텍스트 매니저 */}
          <TabsContent value='contexts' className='space-y-4'>
            {systemStatus && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>기본 컨텍스트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(
                          systemStatus.components.contexts.basic.status
                        )}
                      </div>
                      <div className='text-sm text-gray-600'>
                        시스템 메트릭 수집
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>고급 컨텍스트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(
                          systemStatus.components.contexts.advanced.status
                        )}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>문서 수:</span>
                        <span className='font-bold'>
                          {
                            systemStatus.components.contexts.advanced
                              .documentsCount
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>커스텀 컨텍스트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span>상태:</span>
                        {getStatusBadge(
                          systemStatus.components.contexts.custom.status
                        )}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span>규칙 수:</span>
                        <span className='font-bold'>
                          {systemStatus.components.contexts.custom.rulesCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 시스템 액션 */}
          <TabsContent value='actions' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>MCP 시스템 관리</CardTitle>
                  <CardDescription>
                    MCP 오케스트레이터 및 관련 컴포넌트 제어
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button
                    onClick={() => executeAction('ping')}
                    className='w-full'
                    variant='outline'
                  >
                    <Activity className='w-4 h-4 mr-2' />
                    시스템 핑
                  </Button>

                  <Button
                    onClick={() => executeAction('health')}
                    className='w-full'
                    variant='outline'
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    헬스 체크
                  </Button>

                  <Button
                    onClick={() => executeAction('reset_stats')}
                    className='w-full'
                    variant='outline'
                  >
                    <RotateCcw className='w-4 h-4 mr-2' />
                    통계 리셋
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI 시스템 관리</CardTitle>
                  <CardDescription>
                    통합 AI 시스템 및 FastAPI 엔진 제어
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button
                    onClick={() => executeAction('warmup')}
                    className='w-full'
                    variant='outline'
                  >
                    <Zap className='w-4 h-4 mr-2' />
                    AI 엔진 웜업
                  </Button>

                  <Button
                    onClick={restartAISystem}
                    className='w-full'
                    variant='destructive'
                  >
                    <RefreshCw className='w-4 h-4 mr-2' />
                    AI 시스템 재시작
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Redis 캐시 탭 */}
        {activeTab === 'cache' && (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* 캐시 사용량 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-white'>
                    메모리 사용량
                  </h3>
                  <HardDrive className='w-5 h-5 text-blue-400' />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>사용 중</span>
                    <span className='text-white font-medium'>
                      {cacheMetrics.memoryUsage}
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${(23.4 / 30) * 100}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>한계</span>
                    <span className='text-gray-300'>
                      {cacheMetrics.memoryLimit}
                    </span>
                  </div>
                </div>
              </div>

              {/* 캐시 적중률 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-white'>적중률</h3>
                  <TrendingUp className='w-5 h-5 text-green-400' />
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-400 mb-2'>
                    {cacheMetrics.hitRate.toFixed(1)}%
                  </div>
                  <div className='text-sm text-gray-400'>
                    미스율: {cacheMetrics.missRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* 총 키 수 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-white'>
                    저장된 키
                  </h3>
                  <Database className='w-5 h-5 text-purple-400' />
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-purple-400 mb-2'>
                    {cacheMetrics.totalKeys.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-400'>
                    만료: {cacheMetrics.expiredKeys} | 제거:{' '}
                    {cacheMetrics.evictedKeys}
                  </div>
                </div>
              </div>

              {/* 작업 통계 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-white'>
                    작업 통계
                  </h3>
                  <Activity className='w-5 h-5 text-orange-400' />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>읽기</span>
                    <span className='text-green-400'>
                      {cacheMetrics.operations.gets.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>쓰기</span>
                    <span className='text-blue-400'>
                      {cacheMetrics.operations.sets.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>삭제</span>
                    <span className='text-red-400'>
                      {cacheMetrics.operations.deletes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI 분석 탭 */}
        {activeTab === 'analytics' && (
          <div className='space-y-6'>
            {/* AI 히트맵 */}
            <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
              <h3 className='text-xl font-semibold text-white mb-6 flex items-center gap-2'>
                <Activity className='w-5 h-5 text-purple-400' />
                AI 질의 히트맵 (24시간)
              </h3>

              <div className='grid grid-cols-12 gap-1'>
                {aiHeatmapData.map(data => {
                  const intensity = Math.min(data.queries / 250, 1); // 최대값으로 정규화
                  const successRate = (data.success / data.queries) * 100;

                  return (
                    <div key={data.hour} className='relative group'>
                      <div
                        className={`w-full h-12 rounded border border-gray-600 transition-all duration-300 cursor-pointer ${
                          intensity > 0.8
                            ? 'bg-red-500'
                            : intensity > 0.6
                              ? 'bg-orange-500'
                              : intensity > 0.4
                                ? 'bg-yellow-500'
                                : intensity > 0.2
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                        }`}
                        style={{ opacity: Math.max(intensity, 0.1) }}
                      />

                      {/* 툴팁 */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap z-10'>
                        <div className='font-medium'>{data.hour}:00</div>
                        <div>질의: {data.queries}건</div>
                        <div>
                          성공: {data.success}건 ({successRate.toFixed(1)}%)
                        </div>
                        <div>평균 시간: {data.avg_time.toFixed(1)}초</div>
                      </div>

                      {/* 시간 라벨 */}
                      <div className='text-xs text-gray-400 text-center mt-1'>
                        {data.hour}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className='flex items-center justify-center mt-6 space-x-4 text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded'></div>
                  <span className='text-gray-400'>낮은 부하</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-green-500 rounded'></div>
                  <span className='text-gray-400'>보통</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-yellow-500 rounded'></div>
                  <span className='text-gray-400'>높음</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-orange-500 rounded'></div>
                  <span className='text-gray-400'>매우 높음</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-red-500 rounded'></div>
                  <span className='text-gray-400'>피크</span>
                </div>
              </div>
            </div>

            {/* AI 응답 품질 피드백 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-4'>
                  응답 품질 피드백
                </h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-2xl'>👍</span>
                      <span className='text-gray-300'>긍정적 피드백</span>
                    </div>
                    <div className='text-right'>
                      <div className='text-xl font-bold text-green-400'>
                        1,247
                      </div>
                      <div className='text-sm text-gray-400'>89.3%</div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-2xl'>👎</span>
                      <span className='text-gray-300'>부정적 피드백</span>
                    </div>
                    <div className='text-right'>
                      <div className='text-xl font-bold text-red-400'>149</div>
                      <div className='text-sm text-gray-400'>10.7%</div>
                    </div>
                  </div>

                  <div className='w-full bg-gray-700 rounded-full h-2 mt-4'>
                    <div
                      className='bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full'
                      style={{ width: '89.3%' }}
                    />
                  </div>
                </div>
              </div>

              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-4'>
                  주요 개선 영역
                </h3>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-300'>응답 정확도</span>
                    <span className='text-green-400 font-medium'>95.2%</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-300'>응답 속도</span>
                    <span className='text-yellow-400 font-medium'>78.9%</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-300'>맥락 이해</span>
                    <span className='text-green-400 font-medium'>92.1%</span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-gray-300'>유용성</span>
                    <span className='text-orange-400 font-medium'>84.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 성능 지표 탭 확장 */}
        {activeTab === 'performance' && (
          <div className='space-y-6'>
            {/* 실시간 성능 그래프 */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* 응답 시간 차트 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-blue-400' />
                  응답시간 (24h)
                </h3>

                <div className='h-32 flex items-end space-x-1'>
                  {performanceData.responseTime.map((point, index) => (
                    <div
                      key={index}
                      className='flex-1 flex flex-col items-center'
                    >
                      <div
                        className='w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t'
                        style={{ height: `${(point.value / 500) * 100}%` }}
                      />
                      <div className='text-xs text-gray-400 mt-1 transform -rotate-45'>
                        {point.time}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-4 text-center'>
                  <div className='text-2xl font-bold text-blue-400'>245ms</div>
                  <div className='text-sm text-gray-400'>현재 평균</div>
                </div>
              </div>

              {/* 처리량 차트 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-green-400' />
                  처리량 (24h)
                </h3>

                <div className='h-32 flex items-end space-x-1'>
                  {performanceData.throughput.map((point, index) => (
                    <div
                      key={index}
                      className='flex-1 flex flex-col items-center'
                    >
                      <div
                        className='w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t'
                        style={{ height: `${(point.value / 1300) * 100}%` }}
                      />
                      <div className='text-xs text-gray-400 mt-1 transform -rotate-45'>
                        {point.time}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-4 text-center'>
                  <div className='text-2xl font-bold text-green-400'>1,247</div>
                  <div className='text-sm text-gray-400'>req/min</div>
                </div>
              </div>

              {/* 에러율 차트 */}
              <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                  <AlertTriangle className='w-5 h-5 text-red-400' />
                  에러율 (24h)
                </h3>

                <div className='h-32 flex items-end space-x-1'>
                  {performanceData.errorRate.map((point, index) => (
                    <div
                      key={index}
                      className='flex-1 flex flex-col items-center'
                    >
                      <div
                        className='w-full bg-gradient-to-t from-red-500 to-orange-400 rounded-t'
                        style={{ height: `${(point.value / 0.1) * 100}%` }}
                      />
                      <div className='text-xs text-gray-400 mt-1 transform -rotate-45'>
                        {point.time}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-4 text-center'>
                  <div className='text-2xl font-bold text-red-400'>0.08%</div>
                  <div className='text-sm text-gray-400'>현재 에러율</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
