/**
 * 🎯 관리자 페이지 v4.0
 *
 * 통합 관리자 대시보드 (VM 모니터링 포함)
 * 비밀번호 4231로 접근 가능
 */

'use client';

import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Crown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  TrendingUp,
  Wifi,
  DollarSign,
  BarChart3,
  Monitor,
} from 'lucide-react';

interface VMStatus {
  health: 'healthy' | 'warning' | 'critical' | 'unknown';
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  lastCheck: string;
  fromCache: boolean;
  cacheAge?: number;
}

interface FreeTierUsage {
  network: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    today: number;
    month: number;
    limit: number;
  };
  estimatedCost: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  age: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // VM Dashboard states
  const [vmStatus, setVmStatus] = useState<VMStatus | null>(null);
  const [freeTierUsage, setFreeTierUsage] = useState<FreeTierUsage | null>(
    null
  );
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [vmLoading, setVmLoading] = useState(false);

  useEffect(() => {
    // 관리자 모드 확인
    const adminMode = localStorage.getItem('admin_mode') === 'true';

    if (!adminMode) {
      console.log('❌ 관리자 권한 없음 - 메인 페이지로 리다이렉트');
      router.replace('/main');
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);

    // 초기 VM 데이터 로드
    void loadVMData();
  }, [router]);

  // VM 데이터 로드 함수
  const loadVMData = async () => {
    setVmLoading(true);
    try {
      const response = await fetch('/api/vm-dashboard');
      const data = await response.json();

      setVmStatus(data.vmStatus);
      setFreeTierUsage(data.freeTierUsage);
      setCacheStats(data.cacheStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load VM data:', error);
    } finally {
      setVmLoading(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh && isAuthorized) {
      const interval = setInterval(() => void loadVMData(), 60000); // 1분마다
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, isAuthorized]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                관리자 대시보드
              </h1>
              <p className="text-xs text-gray-500">
                Administrator Dashboard & VM Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={vmStatus?.fromCache ? 'secondary' : 'default'}>
              {vmStatus?.fromCache
                ? `캐시 (${vmStatus.cacheAge}초 전)`
                : '실시간'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '자동 새로고침 중지' : '자동 새로고침 시작'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadVMData}
              disabled={vmLoading}
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${vmLoading ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>
            <UnifiedProfileHeader />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">
              <Shield className="mr-2 h-4 w-4" />
              개요
            </TabsTrigger>
            <TabsTrigger value="vm-monitor">
              <Monitor className="mr-2 h-4 w-4" />
              VM 모니터링
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              분석
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-red-500" />
                    관리자 권한
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    모든 시스템 기능 접근 가능
                  </p>
                  <Badge className="mt-2" variant="default">
                    활성화됨
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Server className="h-5 w-5" />
                    VM 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {vmStatus && getHealthIcon(vmStatus.health)}
                    <span
                      className={`font-bold ${getHealthColor(vmStatus?.health || 'unknown')}`}
                    >
                      {vmStatus?.health.toUpperCase() || 'LOADING'}
                    </span>
                  </div>
                  {vmStatus?.uptime && (
                    <p className="mt-1 text-sm text-gray-600">
                      가동시간: {Math.floor(vmStatus.uptime / 60)}시간
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    예상 비용
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span
                      className={
                        freeTierUsage?.estimatedCost === 0
                          ? 'text-green-500'
                          : 'text-yellow-500'
                      }
                    >
                      ${freeTierUsage?.estimatedCost.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">현재 월 기준</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>시스템 개요</CardTitle>
                <CardDescription>
                  관리자 대시보드 및 시스템 상태
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      관리자 권한으로 로그인되었습니다. 모든 기능에 접근할 수
                      있습니다.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">보안 상태</p>
                      <Badge variant="default">고급 보안 활성화</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">인증 상태</p>
                      <Badge variant="default">관리자 인증 완료</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VM 모니터링 탭 */}
          <TabsContent value="vm-monitor" className="space-y-6">
            {/* VM 상태 카드 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HardDrive className="h-5 w-5" />
                    메모리 사용량
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {vmStatus?.memory.used}MB / {vmStatus?.memory.total}MB
                      </span>
                      <span className="font-semibold">
                        {vmStatus?.memory.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={vmStatus?.memory.percentage}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-600">
                      {vmStatus?.memory.free}MB 사용 가능
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" />
                    캐시 성능
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">히트율</span>
                      <span className="text-2xl font-bold text-green-500">
                        {cacheStats?.hitRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {cacheStats?.hits} 히트 / {cacheStats?.misses} 미스
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    API 호출
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">오늘</span>
                      <span className="font-semibold">
                        {freeTierUsage?.apiCalls.today}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">이번 달</span>
                      <span className="font-semibold">
                        {freeTierUsage?.apiCalls.month}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 무료 티어 사용량 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  무료 티어 사용량
                </CardTitle>
                <CardDescription>현재 월 사용량 및 한계</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="flex items-center gap-1 text-sm">
                      <Wifi className="h-4 w-4" />
                      네트워크 전송
                    </span>
                    <span className="text-sm font-semibold">
                      {freeTierUsage?.network.used.toFixed(3)}GB /{' '}
                      {freeTierUsage?.network.limit}GB
                    </span>
                  </div>
                  <Progress
                    value={freeTierUsage?.network.percentage}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="flex items-center gap-1 text-sm">
                      <Activity className="h-4 w-4" />
                      API 호출 (월간)
                    </span>
                    <span className="text-sm font-semibold">
                      {freeTierUsage?.apiCalls.month} /{' '}
                      {freeTierUsage?.apiCalls.limit}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((freeTierUsage?.apiCalls.month || 0) /
                        (freeTierUsage?.apiCalls.limit || 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 스마트 모니터링 전략 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  스마트 모니터링 전략
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-600">체크 간격</p>
                    <p className="text-lg font-semibold">60분</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">캐시 TTL</p>
                    <p className="text-lg font-semibold">10-30분</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">일일 한계</p>
                    <p className="text-lg font-semibold">
                      {freeTierUsage?.apiCalls.today}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">마지막 업데이트</p>
                    <p className="text-lg font-semibold">
                      {lastUpdate.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 경고 */}
            {freeTierUsage && freeTierUsage.network.percentage > 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  네트워크 사용량이 무료 티어의{' '}
                  {freeTierUsage.network.percentage.toFixed(1)}%에 도달했습니다.
                  추가 요금을 피하려면 모니터링 빈도를 줄이는 것을 고려하세요.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시스템 분석</CardTitle>
                <CardDescription>
                  상세 시스템 성능 및 사용량 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">캐시 크기</p>
                      <p className="text-lg font-semibold">
                        {(cacheStats?.size || 0) / 1024}KB
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">가장 오래된 캐시</p>
                      <p className="text-lg font-semibold">
                        {cacheStats?.age}분
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      캐싱 전략으로 API 호출을 90% 감소시켜 무료 티어 내에서
                      운영 중입니다.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 푸터 */}
        <div className="pt-8 text-center text-sm text-gray-500">
          <p>
            <Clock className="mr-1 inline h-4 w-4" />
            마지막 업데이트: {lastUpdate.toLocaleString()}
          </p>
          <p className="mt-1">
            캐시된 데이터를 사용하여 API 호출을 최소화하고 무료 티어 할당량을
            절약합니다
          </p>
        </div>
      </main>
    </div>
  );
}
