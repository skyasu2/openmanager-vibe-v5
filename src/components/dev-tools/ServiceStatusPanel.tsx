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
import { Activity, RefreshCw, Server } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ServicesStatusResponse } from './types';
import {
  formatResponseTime,
  getServiceIcon,
  getStatusBadgeVariant,
  getStatusColor,
} from './utils';

interface ServiceStatusPanelProps {
  autoRefresh: boolean;
  onDataUpdate?: (data: ServicesStatusResponse) => void;
}

export default function ServiceStatusPanel({
  autoRefresh,
  onDataUpdate,
}: ServiceStatusPanelProps) {
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
      onDataUpdate?.(data);
    } catch (error) {
      console.error('서비스 상태 확인 실패:', error);
      // 기본 데이터 설정
      const fallbackData: ServicesStatusResponse = {
        timestamp: new Date().toISOString(),
        environment: 'development',
        services: [],
        summary: {
          total: 0,
          connected: 0,
          errors: 0,
          averageResponseTime: 0,
        },
      };
      setServicesData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchServicesStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Server className='h-5 w-5' />
            <CardTitle>🌐 외부 서비스 상태</CardTitle>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchServicesStatus}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
        </div>
        <CardDescription>
          실시간 연결 상태 모니터링 ({servicesData?.environment || 'Unknown'})
          {lastUpdated && (
            <span className='ml-2 text-xs text-muted-foreground'>
              마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {servicesData ? (
          <div className='space-y-4'>
            {/* 요약 정보 */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {servicesData.summary.total}
                </div>
                <div className='text-sm text-muted-foreground'>총 서비스</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {servicesData.summary.connected}
                </div>
                <div className='text-sm text-muted-foreground'>연결됨</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {servicesData.summary.errors}
                </div>
                <div className='text-sm text-muted-foreground'>오류</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {formatResponseTime(servicesData.summary.averageResponseTime)}
                </div>
                <div className='text-sm text-muted-foreground'>평균 응답</div>
              </div>
            </div>

            <Separator />

            {/* 서비스별 상태 */}
            <div className='space-y-3'>
              {servicesData.services.map((service, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    {getServiceIcon(service.name)}
                    <div>
                      <div className='font-medium'>{service.name}</div>
                      {service.error && (
                        <div className='text-sm text-red-600 mt-1'>
                          {service.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='text-sm text-muted-foreground'>
                      {formatResponseTime(service.responseTime)}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}
                      />
                      <Badge
                        variant={getStatusBadgeVariant(service.status) as any}
                      >
                        {service.status === 'connected'
                          ? '연결됨'
                          : service.status === 'error'
                            ? '오류'
                            : '알 수 없음'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {servicesData.services.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>서비스 데이터를 불러오는 중...</p>
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin mr-2' />
            <span>서비스 상태를 확인하는 중...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
