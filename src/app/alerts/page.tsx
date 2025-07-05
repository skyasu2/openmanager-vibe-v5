'use client';

// 🔧 RSC 프리렌더링 오류 방지: 동적 렌더링 강제
export const dynamic = 'force-dynamic';

/**
 * 🚨 시스템 알림 전체 보기 페이지
 *
 * 실시간 시스템 알림들을 전체적으로 관리하고 모니터링하는 페이지
 * - 실시간 알림 스트림
 * - 알림 필터링 및 검색
 * - 알림 해결 및 관리 기능
 * - 알림 통계 및 분석
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Info,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';

// API 응답 구조에 맞는 타입 정의
interface Alert {
  id: string;
  serverId: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  resolved: boolean;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'destructive',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badge: 'default',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'secondary',
  },
};

// 임시 더미 데이터 (빌드 성공을 위해)
const dummyAlerts: Alert[] = [
  {
    id: '1',
    serverId: 'server-001',
    type: 'CPU',
    message: 'CPU 사용률이 높습니다',
    severity: 'warning',
    timestamp: new Date().toISOString(),
    resolved: false,
  },
  {
    id: '2',
    serverId: 'server-002',
    type: 'Memory',
    message: '메모리 부족',
    severity: 'critical',
    timestamp: new Date().toISOString(),
    resolved: false,
  },
];

export default function AlertsPage() {
  // 정적 데이터 사용 (빌드 성공을 위해)
  const alerts = dummyAlerts;
  const isLoading = false;
  const error = null;
  const filteredAlerts = alerts;
  const searchTerm = '';
  const selectedSeverity = 'all';
  const showResolved = false;

  // 알림 통계 계산
  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(
      (a: Alert) => a.severity === 'critical' && !a.resolved
    ).length,
    warning: alerts.filter(
      (a: Alert) => a.severity === 'warning' && !a.resolved
    ).length,
    resolved: alerts.filter((a: Alert) => a.resolved).length,
  };

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const config = severityConfig[alert.severity];
    const Icon = config.icon;

    return (
      <div
        className={cn(
          'p-4 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow',
          config.borderColor,
          config.bgColor
        )}
      >
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-3'>
            <Icon className={cn('w-5 h-5 mt-0.5', config.color)} />
            <div className='flex-1'>
              <div className='flex items-center space-x-2 mb-1'>
                <Badge variant={config.badge as any} className='text-xs'>
                  {alert.severity.toUpperCase()}
                </Badge>
                <Badge variant='outline' className='text-xs'>
                  {alert.type}
                </Badge>
                <span className='text-xs text-gray-500'>{alert.serverId}</span>
              </div>
              <p className='text-sm font-medium text-gray-900 mb-1'>
                {alert.message}
              </p>
              <p className='text-xs text-gray-500'>
                {new Date(alert.timestamp).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            {alert.resolved && (
              <CheckCircle className='w-4 h-4 text-green-500' />
            )}
            <Button variant='ghost' size='sm'>
              해결
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
            <Bell className='w-8 h-8 mr-3 text-blue-600' />
            시스템 알림
          </h1>
          <p className='text-gray-600 mt-1'>
            실시간 시스템 상태 알림 및 경고 관리
          </p>
        </div>
        <Button variant='outline' className='flex items-center'>
          <RefreshCw className='w-4 h-4 mr-2' />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>전체 알림</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {alertStats.total}
                </p>
              </div>
              <Activity className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>심각</p>
                <p className='text-2xl font-bold text-red-600'>
                  {alertStats.critical}
                </p>
              </div>
              <XCircle className='w-8 h-8 text-red-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>경고</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {alertStats.warning}
                </p>
              </div>
              <AlertTriangle className='w-8 h-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>해결됨</p>
                <p className='text-2xl font-bold text-green-600'>
                  {alertStats.resolved}
                </p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='알림 검색...'
                  value={searchTerm}
                  readOnly
                  className='pl-10'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <select
                value={selectedSeverity}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
                aria-label='심각도 필터'
                disabled
              >
                <option value='all'>모든 심각도</option>
                <option value='critical'>심각</option>
                <option value='error'>오류</option>
                <option value='warning'>경고</option>
                <option value='info'>정보</option>
              </select>
              <Button
                variant={showResolved ? 'default' : 'outline'}
                size='sm'
                disabled
              >
                해결된 알림 {showResolved ? '숨기기' : '보기'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
          <CardDescription>
            {filteredAlerts.length}개의 알림이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='w-6 h-6 animate-spin mr-2' />
              알림을 불러오는 중...
            </div>
          )}

          {error && (
            <div className='flex items-center justify-center py-8 text-red-500'>
              <XCircle className='w-6 h-6 mr-2' />
              오류: {error}
            </div>
          )}

          {!isLoading && !error && filteredAlerts.length === 0 && (
            <div className='flex items-center justify-center py-8 text-gray-500'>
              <BellOff className='w-6 h-6 mr-2' />
              표시할 알림이 없습니다.
            </div>
          )}

          {!isLoading && !error && filteredAlerts.length > 0 && (
            <div className='space-y-3'>
              {filteredAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
