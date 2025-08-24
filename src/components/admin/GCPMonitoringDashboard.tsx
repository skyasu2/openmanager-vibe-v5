/**
 * 🌐 GCP 무료 티어 모니터링 대시보드
 *
 * ✅ 과도한 API 호출 없이 캐싱 기반 모니터링
 * ✅ Compute Engine, Cloud Functions, Cloud Run 사용량 추적
 * ✅ 무료 한도 대비 현재 사용량 시각화
 * ✅ 슬랙/이메일 없이 관리자 페이지에서만 알림
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  Database,
  HardDrive,
  Network,
  Server,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

// GCP 서비스 사용량 타입 정의
interface GCPUsage {
  computeEngine: {
    instances: number;
    maxInstances: number;
    memoryUsage: number;
    diskUsage: number;
    networkOut: number; // GB
    maxNetworkOut: number; // 1GB 무료
    status: 'healthy' | 'warning' | 'critical';
  };
  cloudFunctions: {
    invocations: number;
    maxInvocations: number; // 2M 무료
    memorySeconds: number;
    maxMemorySeconds: number; // 400K GB-초 무료
    status: 'healthy' | 'warning' | 'critical';
  };
  cloudRun: {
    requests: number;
    maxRequests: number; // 2M 요청 무료
    cpuSeconds: number;
    maxCpuSeconds: number; // 360K CPU-초 무료
    status: 'healthy' | 'warning' | 'critical';
  };
  cloudStorage: {
    storageUsed: number; // GB
    maxStorage: number; // 5GB 무료
    operations: number;
    maxOperations: number; // 5K 무료
    status: 'healthy' | 'warning' | 'critical';
  };
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    riskLevel: number; // 0-100
    estimatedCost: number;
    lastUpdated: string;
  };
}

interface GCPEndpoint {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'unknown';
  responseTime: number;
  lastCheck: string;
}

const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  online: '#10B981',
  offline: '#EF4444',
  unknown: '#6B7280',
};

export default function GCPMonitoringDashboard() {
  const [gcpData, setGcpData] = useState<GCPUsage | null>(null);
  const [endpoints, setEndpoints] = useState<GCPEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 📡 GCP 사용량 데이터 가져오기 (캐싱 기반, 1시간 갱신)
  const fetchGCPData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 캐싱된 데이터 먼저 확인
      const cachedData = localStorage.getItem('gcp-monitoring-cache');
      const cacheTimestamp = localStorage.getItem('gcp-monitoring-timestamp');

      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1시간

      // 캐시가 유효한 경우 (1시간 이내)
      if (
        cachedData &&
        cacheTimestamp &&
        now - parseInt(cacheTimestamp) < oneHour
      ) {
        const parsed = JSON.parse(cachedData);
        setGcpData(parsed.usage);
        setEndpoints(parsed.endpoints);
        setLastRefresh(new Date(parseInt(cacheTimestamp)));
        setLoading(false);
        console.log('✅ GCP 모니터링: 캐시된 데이터 사용');
        return;
      }

      // 새로운 데이터 요청 (과도한 API 호출 방지)
      const response = await fetch('/api/gcp/monitoring', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`GCP 모니터링 API 오류: ${response.status}`);
      }

      const data = await response.json();

      // 데이터 캐싱
      localStorage.setItem('gcp-monitoring-cache', JSON.stringify(data));
      localStorage.setItem('gcp-monitoring-timestamp', now.toString());

      setGcpData(data.usage);
      setEndpoints(data.endpoints);
      setLastRefresh(new Date());

      console.log('✅ GCP 모니터링 데이터 업데이트 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'GCP 모니터링 데이터 로드 실패';
      setError(errorMessage);
      console.error('❌ GCP 모니터링 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchGCPData();
  }, []);

  // 사용량 백분율 계산
  const getUsagePercentage = (used: number, max: number): number => {
    return Math.min((used / max) * 100, 100);
  };

  // 상태 아이콘 반환
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return (
          <CheckCircle
            className="h-5 w-5"
            style={{ color: STATUS_COLORS.healthy }}
          />
        );
      case 'warning':
        return (
          <AlertTriangle
            className="h-5 w-5"
            style={{ color: STATUS_COLORS.warning }}
          />
        );
      case 'critical':
      case 'offline':
        return (
          <AlertTriangle
            className="h-5 w-5"
            style={{ color: STATUS_COLORS.critical }}
          />
        );
      default:
        return (
          <AlertTriangle
            className="h-5 w-5"
            style={{ color: STATUS_COLORS.unknown }}
          />
        );
    }
  };

  // 강제 새로고침 (캐시 무시)
  const forceRefresh = async () => {
    localStorage.removeItem('gcp-monitoring-cache');
    localStorage.removeItem('gcp-monitoring-timestamp');
    await fetchGCPData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          GCP 모니터링 데이터 로드 중...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          모니터링 데이터 로드 실패
        </h3>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={fetchGCPData} variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  if (!gcpData) return null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Cloud className="h-6 w-6 text-blue-600" />
            GCP 무료 티어 모니터링
          </h2>
          <p className="mt-1 text-gray-600">
            Google Cloud Platform 무료 한도 사용량 추적 (과도한 API 호출 없는
            1시간 캐싱)
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* 전체 상태 */}
          <div className="flex items-center gap-2">
            {getStatusIcon(gcpData.overall.status)}
            <Badge
              style={{
                backgroundColor: STATUS_COLORS[gcpData.overall.status],
                color: 'white',
              }}
            >
              {gcpData.overall.status === 'healthy'
                ? '안전'
                : gcpData.overall.status === 'warning'
                  ? '주의'
                  : '위험'}
            </Badge>
          </div>

          {/* 예상 비용 */}
          <div className="text-right">
            <p className="text-sm text-gray-600">예상 월 비용</p>
            <p className="text-lg font-bold text-green-600">
              ${gcpData.overall.estimatedCost.toFixed(2)}
            </p>
          </div>

          {/* 새로고침 */}
          <Button onClick={forceRefresh} variant="outline" size="sm">
            강제 새로고침
          </Button>
        </div>
      </div>

      {/* 전체 리스크 레벨 */}
      <div
        className="rounded-lg border bg-gradient-to-r from-blue-50 to-green-50 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            무료 티어 위험도
          </h3>
          <span className="text-2xl font-bold text-gray-900">
            {gcpData.overall.riskLevel}%
          </span>
        </div>
        <Progress value={gcpData.overall.riskLevel} className="h-3" />
        <p className="mt-2 text-sm text-gray-600">
          80% 이상 시 주의, 90% 이상 시 위험 상태
        </p>
      </div>

      {/* GCP 서비스별 사용량 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Compute Engine */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                Compute Engine (e2-micro)
                {getStatusIcon(gcpData.computeEngine.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">인스턴스</span>
                  <span className="text-sm font-medium">
                    {gcpData.computeEngine.instances} /{' '}
                    {gcpData.computeEngine.maxInstances}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.computeEngine.instances,
                    gcpData.computeEngine.maxInstances
                  )}
                  className="h-2"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">
                    네트워크 아웃바운드
                  </span>
                  <span className="text-sm font-medium">
                    {gcpData.computeEngine.networkOut.toFixed(2)}GB /{' '}
                    {gcpData.computeEngine.maxNetworkOut}GB
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.computeEngine.networkOut,
                    gcpData.computeEngine.maxNetworkOut
                  )}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-sm text-gray-600">메모리</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {gcpData.computeEngine.memoryUsage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">디스크</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {gcpData.computeEngine.diskUsage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Functions */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Cloud Functions
                {getStatusIcon(gcpData.cloudFunctions.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">호출 횟수</span>
                  <span className="text-sm font-medium">
                    {gcpData.cloudFunctions.invocations.toLocaleString()} /{' '}
                    {(gcpData.cloudFunctions.maxInvocations / 1000000).toFixed(
                      1
                    )}
                    M
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudFunctions.invocations,
                    gcpData.cloudFunctions.maxInvocations
                  )}
                  className="h-2"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">메모리-초</span>
                  <span className="text-sm font-medium">
                    {(gcpData.cloudFunctions.memorySeconds / 1000).toFixed(1)}K
                    /{' '}
                    {(gcpData.cloudFunctions.maxMemorySeconds / 1000).toFixed(
                      0
                    )}
                    K
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudFunctions.memorySeconds,
                    gcpData.cloudFunctions.maxMemorySeconds
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Run */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-green-600" />
                Cloud Run
                {getStatusIcon(gcpData.cloudRun.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">요청 수</span>
                  <span className="text-sm font-medium">
                    {gcpData.cloudRun.requests.toLocaleString()} /{' '}
                    {(gcpData.cloudRun.maxRequests / 1000000).toFixed(1)}M
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudRun.requests,
                    gcpData.cloudRun.maxRequests
                  )}
                  className="h-2"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">CPU-초</span>
                  <span className="text-sm font-medium">
                    {(gcpData.cloudRun.cpuSeconds / 1000).toFixed(1)}K /{' '}
                    {(gcpData.cloudRun.maxCpuSeconds / 1000).toFixed(0)}K
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudRun.cpuSeconds,
                    gcpData.cloudRun.maxCpuSeconds
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Storage */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                Cloud Storage
                {getStatusIcon(gcpData.cloudStorage.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">저장공간</span>
                  <span className="text-sm font-medium">
                    {gcpData.cloudStorage.storageUsed.toFixed(1)}GB /{' '}
                    {gcpData.cloudStorage.maxStorage}GB
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudStorage.storageUsed,
                    gcpData.cloudStorage.maxStorage
                  )}
                  className="h-2"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-gray-600">작업 수</span>
                  <span className="text-sm font-medium">
                    {gcpData.cloudStorage.operations.toLocaleString()} /{' '}
                    {gcpData.cloudStorage.maxOperations.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    gcpData.cloudStorage.operations,
                    gcpData.cloudStorage.maxOperations
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 배포된 엔드포인트 상태 */}
      <div
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              배포된 GCP 엔드포인트 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {endpoints.map((endpoint, index) => (
                <div
                  key={endpoint.name}
                  className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {endpoint.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(endpoint.status)}
                      <Badge
                        style={{
                          backgroundColor: STATUS_COLORS[endpoint.status],
                          color: 'white',
                        }}
                      >
                        {endpoint.status === 'online'
                          ? '온라인'
                          : endpoint.status === 'offline'
                            ? '오프라인'
                            : '알 수 없음'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">응답시간:</span>
                      <span className="font-medium">
                        {endpoint.responseTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">마지막 확인:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(endpoint.lastCheck).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="mt-2">
                      <a
                        href={endpoint.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-xs text-blue-600 hover:text-blue-800"
                      >
                        {endpoint.url}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 마지막 업데이트 정보 */}
      <div className="border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
        <p>
          마지막 업데이트: {lastRefresh?.toLocaleString('ko-KR')}
          (1시간 캐싱, 과도한 API 호출 방지)
        </p>
        <p className="mt-1">
          🎯 마이그레이션 성과: Render $0/월 → GCP $0/월 (제어권⭐ + 안정성⭐
          향상)
        </p>
      </div>
    </div>
  );
}
