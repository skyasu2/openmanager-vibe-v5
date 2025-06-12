'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  ServerCrash,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Anomaly } from '@/services/ai/AnomalyDetectionService'; // 가정: Anomaly 타입 export
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) {
      throw new Error('데이터를 불러오는 데 실패했습니다.');
    }
    return res.json();
  });

const AnomalyIcon: React.FC<{ anomaly: Anomaly }> = ({ anomaly }) => {
  if (anomaly.source === 'logs') {
    return (
      <ServerCrash
        className={`w-5 h-5 ${anomaly.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}
      />
    );
  }
  return (
    <Zap
      className={`w-5 h-5 ${anomaly.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}
    />
  );
};

export const AnomalyFeed: React.FC = () => {
  // SWR을 사용한 실시간 데이터 페칭 (10초마다 갱신)
  const { data, error, isLoading } = useSWR(
    '/api/ai/anomaly-detection',
    fetcher,
    {
      refreshInterval: 10000,
      // 초기에는 모의 데이터 사용, API 응답에 따라 실제 데이터로 대체
      fallbackData: {
        success: true,
        anomalies: [
          {
            timestamp: new Date(),
            metric: 'cpu_usage',
            value: 95,
            severity: 'critical',
            description: 'CPU 사용률 임계치 초과',
            source: 'metrics',
          },
          {
            timestamp: new Date(Date.now() - 60000),
            metric: 'log_entry',
            value: 1,
            severity: 'warning',
            description: 'DB Connection Timeout 로그 발견',
            source: 'logs',
          },
        ],
      },
    }
  );

  const anomalies: Anomaly[] = data?.anomalies || [];

  return (
    <Card className='bg-slate-800/50 border-slate-700 h-full'>
      <CardHeader>
        <CardTitle className='text-white flex items-center gap-2'>
          <AlertTriangle className='w-6 h-6 text-yellow-400' />
          실시간 이상 징후 피드
        </CardTitle>
      </CardHeader>
      <CardContent className='max-h-[30rem] overflow-y-auto pr-2'>
        {isLoading && !data && (
          <p className='text-slate-400'>피드 로딩 중...</p>
        )}
        {error && <p className='text-red-400'>오류: {error.message}</p>}
        {anomalies.length === 0 && !isLoading && (
          <div className='text-center py-10 text-slate-500'>
            <CheckCircle2 className='mx-auto h-12 w-12' />
            <p className='mt-4'>탐지된 이상 징후가 없습니다.</p>
          </div>
        )}
        <div className='space-y-4'>
          {anomalies.map((anomaly, index) => (
            <div
              key={index}
              className='flex items-start gap-4 p-3 bg-slate-700/50 rounded-lg'
            >
              <AnomalyIcon anomaly={anomaly} />
              <div className='flex-1'>
                <p className='text-slate-200 font-medium'>
                  {anomaly.description}
                </p>
                <div className='text-xs text-slate-400 flex items-center gap-2 mt-1'>
                  <Badge
                    variant={
                      anomaly.severity === 'critical'
                        ? 'destructive'
                        : 'default'
                    }
                    className={
                      anomaly.severity === 'warning'
                        ? 'bg-yellow-600/50 border-yellow-500'
                        : ''
                    }
                  >
                    {anomaly.severity}
                  </Badge>
                  <span>
                    {new Date(anomaly.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
