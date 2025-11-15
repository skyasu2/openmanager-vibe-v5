'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  CheckCircle,
  Clock,
  Database,
  Globe,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  responseTime: number;
  details: unknown;
  error?: string;
}

interface ServicesStatusResponse {
  timestamp: string;
  environment: string;
  services: ServiceStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
    averageResponseTime: number;
  };
}

interface ServicesMonitorProps {
  autoRefresh?: boolean;
  onRefresh?: () => void;
}

const getServiceIcon = (serviceName: string) => {
  if (serviceName.includes('Supabase')) return <Database className="h-5 w-5" />;
  if (serviceName.includes('Redis')) return <Zap className="h-5 w-5" />;
  if (serviceName.includes('Google AI'))
    return <Activity className="h-5 w-5" />;
  if (serviceName.includes('Render')) return <Server className="h-5 w-5" />;
  if (serviceName.includes('Vercel')) return <Globe className="h-5 w-5" />;
  return <Server className="h-5 w-5" />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'connected':
      return 'default';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const formatResponseTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export function ServicesMonitor({
  autoRefresh = false,
  onRefresh,
}: ServicesMonitorProps) {
  const [servicesData, setServicesData] =
    useState<ServicesStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchServicesStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/services/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, 'Response:', text);
        throw new Error('서버 응답을 파싱할 수 없습니다');
      }
      setServicesData(data);
      setLastUpdated(new Date());
      onRefresh?.();
    } catch (error) {
      console.error('서비스 상태 확인 실패:', error);
      // 기본 데이터 설정
      setServicesData({
        timestamp: new Date().toISOString(),
        environment: 'development',
        services: [],
        summary: {
          total: 0,
          connected: 0,
          errors: 0,
          averageResponseTime: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchServicesStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => { void fetchServicesStatus(); }, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            외부 서비스 연결 상태
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServicesStatus}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
        </div>
        <CardDescription>
          Supabase, Redis, Google AI, MCP 서버 연결 상태
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 요약 카드 */}
        {servicesData && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      총 서비스
                    </p>
                    <p className="text-2xl font-bold">
                      {servicesData.summary.total}
                    </p>
                  </div>
                  <Server className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      연결됨
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {servicesData.summary.connected}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      오류
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {servicesData.summary.errors}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      평균 응답시간
                    </p>
                    <p className="text-2xl font-bold">
                      {formatResponseTime(
                        servicesData.summary.averageResponseTime
                      )}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 서비스 상태 카드들 */}
        {servicesData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {servicesData.services.map((service, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${getStatusColor(service.status)}`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getServiceIcon(service.name)}
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <Badge variant={getStatusBadgeVariant(service.status)}>
                      {service.status === 'connected'
                        ? '연결됨'
                        : service.status === 'error'
                          ? '오류'
                          : '알 수 없음'}
                    </Badge>
                  </div>
                  <CardDescription>
                    응답시간: {formatResponseTime(service.responseTime)}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {service.status === 'error' && service.error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        오류:
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {service.error}
                      </p>
                    </div>
                  )}

                  {service.details !== undefined && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        상세 정보:
                      </p>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                        <pre className="overflow-x-auto text-xs text-slate-600 dark:text-slate-400">
                          {JSON.stringify(service.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {lastUpdated && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </div>
        )}

        <Separator className="my-6" />

        {/* 개발 팁 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            💡 개발 팁
          </h4>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                터미널에서 상태 확인:
              </p>
              <code className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                curl http://localhost:3000/api/services/status
              </code>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                환경변수 확인:
              </p>
              <code className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                .env.local 파일 생성 필요
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
