'use client';

/**
 * 🖥️ Virtual Servers Management Dashboard
 *
 * 가상 서버 관리 대시보드
 * - 서버 상태 모니터링
 * - 실시간 데이터 생성 제어
 * - AI 분석 결과 표시
 * - 시스템 건강도 모니터링
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Server,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  TrendingUp,
  Brain,
  Zap,
} from 'lucide-react';
import { timerManager } from '../../../utils/TimerManager';

interface VirtualServer {
  id: string;
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  metrics: {
    timestamp: Date;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    response_time: number;
    active_connections: number;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    alerts: string[];
  };
  trends: {
    cpu_trend: 'increasing' | 'decreasing' | 'stable';
    memory_trend: 'increasing' | 'decreasing' | 'stable';
    performance_score: number;
  };
}

interface SystemStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  offlineServers: number;
  averageCpu: number;
  averageMemory: number;
  isGenerating: boolean;
}

interface GenerationStatus {
  isRunning: boolean;
  startTime: Date | null;
  interval: string;
  serversCount: number;
  totalGenerated: number;
}

export default function VirtualServersPage() {
  const [servers, setServers] = useState<VirtualServer[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 데이터 로딩
  const loadData = useCallback(async () => {
    try {
      // 서버 목록 조회
      const serversResponse = await fetch(
        '/api/virtual-servers?action=servers'
      );
      if (serversResponse.ok) {
        const serversData = await serversResponse.json();
        setServers(serversData.data.servers || []);
      }

      // 시스템 상태 조회
      const statusResponse = await fetch('/api/virtual-servers?action=status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData.data.system);
        setGenerationStatus(statusData.data.generation);
      }

      // AI 분석 결과 조회
      const aiResponse = await fetch(
        '/api/ai-agent/virtual-analysis?action=system-overview'
      );
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiAnalysis(aiData.data);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) {
      timerManager.unregister('admin-virtual-servers-refresh');
      return;
    }

    timerManager.register({
      id: 'admin-virtual-servers-refresh',
      callback: loadData,
      interval: 5000,
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister('admin-virtual-servers-refresh');
    };
  }, [autoRefresh, loadData]);

  // 시스템 초기화
  const handleInitialize = async () => {
    setActionLoading('initialize');
    try {
      const response = await fetch('/api/virtual-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('초기화 실패:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 실시간 데이터 생성 시작
  const handleStartRealtime = async () => {
    setActionLoading('start');
    try {
      const response = await fetch('/api/virtual-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-realtime' }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('실시간 시작 실패:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 실시간 데이터 생성 중지
  const handleStopRealtime = async () => {
    setActionLoading('stop');
    try {
      const response = await fetch('/api/virtual-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop-realtime' }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('실시간 중지 실패:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 전체 시스템 설정
  const handleFullSetup = async () => {
    setActionLoading('full-setup');
    try {
      const response = await fetch('/api/virtual-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-setup' }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('전체 설정 실패:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // 상태 색상 반환 (현재 사용하지 않지만 향후 확장을 위해 유지)
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'healthy': return 'text-green-600';
  //     case 'warning': return 'text-yellow-600';
  //     case 'critical': return 'text-red-600';
  //     case 'offline': return 'text-gray-600';
  //     default: return 'text-gray-600';
  //   }
  // };

  // 상태 아이콘 반환
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
      case 'critical':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'offline':
        return <XCircle className='h-4 w-4 text-gray-600' />;
      default:
        return <Server className='h-4 w-4 text-gray-600' />;
    }
  };

  // 트렌드 아이콘 반환
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      case 'decreasing':
        return <TrendingUp className='h-4 w-4 text-green-500 rotate-180' />;
      case 'stable':
        return <Activity className='h-4 w-4 text-blue-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>가상 서버 시스템 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>가상 서버 관리</h1>
          <p className='text-gray-600 mt-1'>
            가상 서버 시스템 모니터링 및 AI 분석 대시보드
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className='h-4 w-4 mr-2' />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={loadData}
            disabled={loading}
          >
            <RotateCcw className='h-4 w-4 mr-2' />
            새로고침
          </Button>
        </div>
      </div>

      {/* 시스템 상태 카드 */}
      {systemStatus && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>총 서버</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {systemStatus.totalServers}
                  </p>
                </div>
                <Server className='h-8 w-8 text-blue-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>정상 서버</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {systemStatus.healthyServers}
                  </p>
                </div>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>경고 서버</p>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {systemStatus.warningServers}
                  </p>
                </div>
                <AlertTriangle className='h-8 w-8 text-yellow-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>심각 서버</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {systemStatus.criticalServers}
                  </p>
                </div>
                <XCircle className='h-8 w-8 text-red-600' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 제어 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Zap className='h-5 w-5 mr-2' />
            시스템 제어
          </CardTitle>
          <CardDescription>
            가상 서버 시스템 초기화 및 실시간 데이터 생성 제어
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Button
              onClick={handleInitialize}
              disabled={actionLoading === 'initialize'}
              variant='outline'
            >
              <Server className='h-4 w-4 mr-2' />
              {actionLoading === 'initialize' ? '초기화 중...' : '서버 초기화'}
            </Button>

            <Button
              onClick={handleStartRealtime}
              disabled={
                actionLoading === 'start' || generationStatus?.isRunning
              }
              variant='outline'
            >
              <Play className='h-4 w-4 mr-2' />
              {actionLoading === 'start' ? '시작 중...' : '실시간 시작'}
            </Button>

            <Button
              onClick={handleStopRealtime}
              disabled={
                actionLoading === 'stop' || !generationStatus?.isRunning
              }
              variant='outline'
            >
              <Pause className='h-4 w-4 mr-2' />
              {actionLoading === 'stop' ? '중지 중...' : '실시간 중지'}
            </Button>

            <Button
              onClick={handleFullSetup}
              disabled={actionLoading === 'full-setup'}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Zap className='h-4 w-4 mr-2' />
              {actionLoading === 'full-setup'
                ? '설정 중...'
                : '전체 시스템 설정'}
            </Button>
          </div>

          {generationStatus && (
            <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>실시간 생성 상태:</span>
                <Badge
                  variant={generationStatus.isRunning ? 'default' : 'secondary'}
                >
                  {generationStatus.isRunning ? '실행 중' : '중지됨'}
                </Badge>
              </div>
              {generationStatus.isRunning && (
                <div className='mt-2 text-sm text-gray-600'>
                  <p>간격: {generationStatus.interval}</p>
                  <p>서버 수: {generationStatus.serversCount}개</p>
                  <p>총 생성: {generationStatus.totalGenerated}개</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메인 탭 */}
      <Tabs defaultValue='servers' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='servers'>서버 목록</TabsTrigger>
          <TabsTrigger value='metrics'>시스템 메트릭</TabsTrigger>
          <TabsTrigger value='ai-analysis'>AI 분석</TabsTrigger>
          <TabsTrigger value='monitoring'>모니터링</TabsTrigger>
        </TabsList>

        {/* 서버 목록 탭 */}
        <TabsContent value='servers' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
            {servers.map(server => (
              <Card
                key={server.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>{server.name}</CardTitle>
                    {getStatusIcon(server.metrics.status)}
                  </div>
                  <CardDescription>
                    {server.hostname} • {server.type} • {server.environment}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {/* CPU */}
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center'>
                        <Cpu className='h-4 w-4 mr-2 text-blue-600' />
                        <span>CPU</span>
                        {getTrendIcon(server.trends.cpu_trend)}
                      </div>
                      <span className='font-medium'>
                        {server.metrics.cpu_usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={server.metrics.cpu_usage}
                      className='h-2'
                    />
                  </div>

                  {/* 메모리 */}
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center'>
                        <MemoryStick className='h-4 w-4 mr-2 text-green-600' />
                        <span>메모리</span>
                        {getTrendIcon(server.trends.memory_trend)}
                      </div>
                      <span className='font-medium'>
                        {server.metrics.memory_usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={server.metrics.memory_usage}
                      className='h-2'
                    />
                  </div>

                  {/* 디스크 */}
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex items-center'>
                        <HardDrive className='h-4 w-4 mr-2 text-purple-600' />
                        <span>디스크</span>
                      </div>
                      <span className='font-medium'>
                        {server.metrics.disk_usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={server.metrics.disk_usage}
                      className='h-2'
                    />
                  </div>

                  {/* 네트워크 */}
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center'>
                      <Network className='h-4 w-4 mr-2 text-orange-600' />
                      <span>응답시간</span>
                    </div>
                    <span className='font-medium'>
                      {server.metrics.response_time.toFixed(0)}ms
                    </span>
                  </div>

                  {/* 성능 점수 */}
                  <div className='flex items-center justify-between text-sm'>
                    <span>성능 점수</span>
                    <Badge
                      variant={
                        server.trends.performance_score > 80
                          ? 'default'
                          : server.trends.performance_score > 60
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {server.trends.performance_score}점
                    </Badge>
                  </div>

                  {/* 알림 */}
                  {server.metrics.alerts.length > 0 && (
                    <div className='mt-3'>
                      <Alert>
                        <AlertTriangle className='h-4 w-4' />
                        <AlertTitle>
                          알림 ({server.metrics.alerts.length}개)
                        </AlertTitle>
                        <AlertDescription>
                          {server.metrics.alerts[0]}
                          {server.metrics.alerts.length > 1 &&
                            ` 외 ${server.metrics.alerts.length - 1}개`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full mt-3'
                    onClick={() => console.log('서버 상세 보기:', server.id)}
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    상세 보기
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {servers.length === 0 && (
            <Card>
              <CardContent className='p-8 text-center'>
                <Server className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  서버가 없습니다
                </h3>
                <p className='text-gray-600 mb-4'>
                  가상 서버 시스템을 초기화하여 서버를 생성하세요.
                </p>
                <Button
                  onClick={handleInitialize}
                  disabled={actionLoading === 'initialize'}
                >
                  <Server className='h-4 w-4 mr-2' />
                  {actionLoading === 'initialize'
                    ? '초기화 중...'
                    : '서버 초기화'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 시스템 메트릭 탭 */}
        <TabsContent value='metrics' className='space-y-4'>
          {systemStatus && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>평균 CPU 사용률</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>현재</span>
                      <span className='font-medium'>
                        {systemStatus.averageCpu.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={systemStatus.averageCpu} className='h-3' />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>평균 메모리 사용률</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>현재</span>
                      <span className='font-medium'>
                        {systemStatus.averageMemory.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={systemStatus.averageMemory}
                      className='h-3'
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* AI 분석 탭 */}
        <TabsContent value='ai-analysis' className='space-y-4'>
          {aiAnalysis ? (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Brain className='h-5 w-5 mr-2' />
                    시스템 분석 요약
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span>전체 상태</span>
                    <Badge
                      variant={
                        aiAnalysis.summary.status === 'healthy'
                          ? 'default'
                          : aiAnalysis.summary.status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {aiAnalysis.summary.status}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>성능 점수</span>
                    <span className='font-medium'>
                      {aiAnalysis.summary.performanceScore}점
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>총 이슈</span>
                    <span className='font-medium'>
                      {aiAnalysis.summary.totalIssues}개
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>심각 이슈</span>
                    <span className='font-medium text-red-600'>
                      {aiAnalysis.summary.criticalIssues}개
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI 권장사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {aiAnalysis.summary.recommendations.map(
                      (rec: string, index: number) => (
                        <div key={index} className='flex items-start space-x-2'>
                          <div className='w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0'></div>
                          <p className='text-sm text-gray-700'>{rec}</p>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='p-8 text-center'>
                <Brain className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  AI 분석 데이터 없음
                </h3>
                <p className='text-gray-600'>
                  가상 서버 시스템을 시작하면 AI 분석 결과를 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value='monitoring' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>실시간 모니터링</CardTitle>
              <CardDescription>
                시스템 상태 및 성능 지표 실시간 모니터링
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <Activity className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  모니터링 대시보드
                </h3>
                <p className='text-gray-600'>
                  실시간 차트 및 상세 모니터링 기능이 곧 추가될 예정입니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
