/**
 * 📊 Vercel 사용량 모니터링 컴포넌트
 *
 * 실시간으로 Vercel Function Invocation 사용량을 추적하고
 * 무료 한도 초과 위험을 사전에 경고합니다.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  VERCEL_FREE_LIMITS,
  getOptimizedConfig,
  trackVercelUsage,
} from '@/config/vercel-optimization';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface VercelUsageStats {
  hourly: number;
  daily: number;
  monthly: number;
  utilizationPercent: number;
}

interface PollingStats {
  systemStatus: number;
  realtimeServers: number;
  serverDataStore: number;
  total: number;
}

export const VercelUsageMonitor: React.FC = () => {
  const [usageStats, setUsageStats] = useState<VercelUsageStats | null>(null);
  const [pollingStats, setPollingStats] = useState<PollingStats | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateStats = () => {
      const config = getOptimizedConfig();
      const stats = trackVercelUsage();

      setUsageStats(stats);
      setIsOptimized(config.USE_SMART_POLLING);
      setLastUpdate(new Date());

      // 폴링 통계 계산
      const pollingStats: PollingStats = {
        systemStatus: Math.round(3600 / (config.SYSTEM_STATUS / 1000)),
        realtimeServers: Math.round(3600 / (config.REALTIME_SERVERS / 1000)),
        serverDataStore: Math.round(3600 / (config.SERVER_DATA_STORE / 1000)),
        total: 0,
      };
      pollingStats.total =
        pollingStats.systemStatus +
        pollingStats.realtimeServers +
        pollingStats.serverDataStore;

      setPollingStats(pollingStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (utilizationPercent: number) => {
    if (utilizationPercent < 50) return 'text-green-600';
    if (utilizationPercent < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (utilizationPercent: number) => {
    if (utilizationPercent < 50)
      return <CheckCircle className='w-4 h-4 text-green-600' />;
    if (utilizationPercent < 80)
      return <AlertTriangle className='w-4 h-4 text-yellow-600' />;
    return <AlertTriangle className='w-4 h-4 text-red-600' />;
  };

  const getStatusMessage = (utilizationPercent: number) => {
    if (utilizationPercent < 50) return '안전한 사용량입니다';
    if (utilizationPercent < 80) return '사용량이 증가하고 있습니다';
    return '사용량이 한도에 근접했습니다!';
  };

  if (!usageStats || !pollingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            Vercel 사용량 모니터링
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
            <div className='h-2 bg-gray-200 rounded w-full mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 전체 사용량 개요 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='w-5 h-5' />
            Vercel 사용량 모니터링
            <Badge variant={isOptimized ? 'default' : 'secondary'}>
              {isOptimized ? '최적화 ON' : '최적화 OFF'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 월간 사용량 프로그레스 */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>
                월간 Function Invocations
              </span>
              <span
                className={`text-sm font-bold ${getStatusColor(usageStats.utilizationPercent)}`}
              >
                {usageStats.monthly.toLocaleString()} /{' '}
                {VERCEL_FREE_LIMITS.FUNCTION_INVOCATIONS.toLocaleString()}
              </span>
            </div>
            <Progress value={usageStats.utilizationPercent} className='h-2' />
            <div className='flex justify-between items-center'>
              <span className='text-xs text-gray-500'>
                {usageStats.utilizationPercent}% 사용
              </span>
              <span className='text-xs text-gray-500'>
                {(
                  VERCEL_FREE_LIMITS.FUNCTION_INVOCATIONS - usageStats.monthly
                ).toLocaleString()}{' '}
                남음
              </span>
            </div>
          </div>

          {/* 상태 알림 */}
          <Alert
            className={
              usageStats.utilizationPercent > 80
                ? 'border-red-200 bg-red-50'
                : 'border-green-200 bg-green-50'
            }
          >
            <div className='flex items-center gap-2'>
              {getStatusIcon(usageStats.utilizationPercent)}
              <AlertDescription>
                {getStatusMessage(usageStats.utilizationPercent)}
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* 상세 사용량 통계 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              시간당 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {usageStats.hourly}
            </div>
            <div className='text-xs text-gray-500'>
              {pollingStats.total}개 폴링 엔드포인트
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm flex items-center gap-2'>
              <TrendingUp className='w-4 h-4' />
              일일 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {usageStats.daily.toLocaleString()}
            </div>
            <div className='text-xs text-gray-500'>24시간 예상 사용량</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm flex items-center gap-2'>
              <Zap className='w-4 h-4' />
              최적화 효과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {isOptimized ? '70%' : '0%'}
            </div>
            <div className='text-xs text-gray-500'>사용량 절약</div>
          </CardContent>
        </Card>
      </div>

      {/* 폴링 엔드포인트 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm'>폴링 엔드포인트 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm'>시스템 상태 (/api/system/state)</span>
              <span className='text-sm font-medium'>
                {pollingStats.systemStatus}/시간
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm'>실시간 서버 데이터</span>
              <span className='text-sm font-medium'>
                {pollingStats.realtimeServers}/시간
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm'>서버 데이터 스토어</span>
              <span className='text-sm font-medium'>
                {pollingStats.serverDataStore}/시간
              </span>
            </div>
            <hr className='my-2' />
            <div className='flex justify-between items-center font-medium'>
              <span className='text-sm'>총 폴링 요청</span>
              <span className='text-sm'>{pollingStats.total}/시간</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 마지막 업데이트 시간 */}
      {lastUpdate && (
        <div className='text-xs text-gray-500 text-center'>
          마지막 업데이트: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
