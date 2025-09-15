/**
 * 🎯 관리자 페이지 클라이언트 컴포넌트 v4.0
 *
 * 통합 관리자 대시보드 (VM 모니터링 포함)
 * 환경변수로 설정된 관리자 비밀번호로 접근 가능
 */

'use client';

import React, { useEffect, useState } from 'react';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useRouter } from 'next/navigation';
import { ADMIN_PASSWORD } from '@/config/system-constants';
import { useUserPermissions } from '@/hooks/useUserPermissions';
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

export default function AdminClient() {
  const router = useRouter();
  const permissions = useUserPermissions();
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
    // 새로운 권한 시스템: PIN 인증한 사용자만 관리자 페이지 접근 가능
    if (permissions.canAccessAdminPage) {
      setIsAuthorized(true);
      setIsLoading(false);
      loadVMDashboard();
    } else {
      // 권한 없음 - 대시보드로 리다이렉트 (PIN 인증 가능)
      alert('관리자 페이지 접근 권한이 없습니다. 관리자 모드 인증이 필요합니다.');
      router.push('/dashboard');
    }
    setIsLoading(false);
  }, [permissions.canAccessAdminPage, router]);

  const loadVMDashboard = async () => {
    setVmLoading(true);
    try {
      // VM 상태 로드
      const vmResponse = await fetch('/api/system/status');
      if (vmResponse.ok) {
        const vmData = await vmResponse.json();
        setVmStatus(vmData);
      }

      // 무료 티어 사용량 로드
      const usageResponse = await fetch('/api/cache/free-tier-usage');
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setFreeTierUsage(usageData);
      }

      // 캐시 통계 로드
      const cacheResponse = await fetch('/api/cache/stats');
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        setCacheStats(cacheData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('대시보드 로드 오류:', error);
    } finally {
      setVmLoading(false);
    }
  };

  // 자동 새로고침 효과
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadVMDashboard();
    }, 30000); // 30초마다 새로고침

    return () => clearInterval(interval);
  }, [autoRefresh, loadVMDashboard]); // loadVMDashboard 함수 의존성 복구

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              접근 거부
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <UnifiedProfileHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
              <Crown className="h-8 w-8 text-yellow-500" />
              관리자 대시보드
              <Badge variant="destructive">ADMIN</Badge>
            </h1>
            <p className="mt-2 text-gray-400">
              시스템 상태 모니터링 및 관리
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={loadVMDashboard}
              disabled={vmLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${vmLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            
            <Button
              variant={autoRefresh ? "secondary" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              자동새로고침 {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* 상태 요약 카드 */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4" />
                시스템 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 ${getStatusColor(vmStatus?.health || 'healthy')}`}>
                {getStatusIcon(vmStatus?.health || 'healthy')}
                <span className="font-semibold capitalize">
                  {vmStatus?.health || 'Healthy'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4" />
                메모리 사용량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {vmStatus?.memory?.percentage?.toFixed(1) || '75.2'}%
                </div>
                <Progress value={vmStatus?.memory?.percentage || 75.2} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                업타임
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor((vmStatus?.uptime || 168) / 24)}일
              </div>
              <div className="text-sm text-gray-500">
                {((vmStatus?.uptime || 168) % 24).toFixed(1)}시간
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4" />
                마지막 업데이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {lastUpdate.toLocaleTimeString('ko-KR')}
              </div>
              {vmStatus?.fromCache && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  캐시됨 ({vmStatus.cacheAge}초 전)
                </Badge>
              )}
              {!vmStatus && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Mock 데이터
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 상세 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="usage">사용량</TabsTrigger>
            <TabsTrigger value="cache">캐시</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  시스템 상세 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold">메모리 상세</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>사용중:</span>
                        <span>{((vmStatus?.memory?.used || 3072) / 1024 / 1024).toFixed(0)}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>전체:</span>
                        <span>{((vmStatus?.memory?.total || 4096) / 1024 / 1024).toFixed(0)}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>사용 가능:</span>
                        <span>{((vmStatus?.memory?.free || 1024) / 1024 / 1024).toFixed(0)}MB</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 font-semibold">시스템 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>마지막 체크:</span>
                        <span>{vmStatus?.lastCheck ? new Date(vmStatus.lastCheck).toLocaleTimeString('ko-KR') : new Date().toLocaleTimeString('ko-KR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>데이터 소스:</span>
                        <span>{vmStatus?.fromCache ? '캐시' : vmStatus ? '실시간' : 'Mock'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {!vmStatus && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Mock 데이터 모드</span>
                    </div>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      GCP VM이 제거되어 샘플 데이터를 표시하고 있습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {freeTierUsage && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      네트워크 사용량
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>사용량</span>
                        <span>
                          {((freeTierUsage?.network?.used || 0) / 1024 / 1024 / 1024).toFixed(2)}GB / 
                          {freeTierUsage?.network?.limit || 100}GB
                        </span>
                      </div>
                      <Progress value={freeTierUsage?.network?.percentage || 25} className="h-2" />
                    </div>
                    <div className="text-xs text-gray-500">
                      월간 무료 한도: {freeTierUsage?.network?.limit || 100}GB
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      API 호출량
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>오늘:</span>
                        <span>{(freeTierUsage?.apiCalls?.today || 12543).toLocaleString()}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span>이번 달:</span>
                        <span>{(freeTierUsage?.apiCalls?.month || 287561).toLocaleString()}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span>월간 한도:</span>
                        <span>{(freeTierUsage?.apiCalls?.limit || 1000000).toLocaleString()}회</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cache" className="space-y-6">
            {cacheStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    캐시 성능
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {(cacheStats?.hitRate || 87.3).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">히트율</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(cacheStats?.hits || 15432).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">캐시 히트</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {((cacheStats?.size || 52428800) / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <div className="text-sm text-gray-500">캐시 크기</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  관리자 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem('admin_mode');
                    router.push('/main');
                  }}
                >
                  관리자 모드 종료
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}