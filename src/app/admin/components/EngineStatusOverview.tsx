'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface EngineStatus {
  name: string;
  type: 'opensource' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'training';
  requests: number;
  accuracy: number;
  responseTime: number;
  lastUsed: string;
}

interface EngineStatusOverviewProps {
  engines: EngineStatus[];
  isLoading: boolean;
}

const EngineStatusBadge: React.FC<{ status: EngineStatus['status'] }> = ({
  status,
}) => {
  const statusConfig = {
    active: {
      icon: <CheckCircle2 className='h-4 w-4 text-green-400' />,
      label: '활성',
      className: 'bg-green-600/50 text-green-200 border-green-500',
    },
    inactive: {
      icon: <Clock className='h-4 w-4 text-gray-400' />,
      label: '비활성',
      className: 'bg-gray-600/50 text-gray-300 border-gray-500',
    },
    error: {
      icon: <AlertTriangle className='h-4 w-4 text-red-400' />,
      label: '오류',
      className: 'bg-red-600/50 text-red-200 border-red-500',
    },
    training: {
      icon: <Zap className='h-4 w-4 text-blue-400' />,
      label: '학습중',
      className: 'bg-blue-600/50 text-blue-200 border-blue-500',
    },
  };
  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <Badge
      variant='outline'
      className={`flex items-center gap-1.5 ${config.className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const EngineStatusOverview: React.FC<EngineStatusOverviewProps> = ({
  engines,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className='bg-slate-800/50 border-slate-700'>
        <CardHeader>
          <CardTitle className='text-white flex items-center gap-2'>
            <Brain className='w-6 h-6 text-purple-400' />
            AI 엔진 상태
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='h-10 bg-slate-700/50 rounded-md _animate-pulse'
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-slate-800/50 border-slate-700'>
      <CardHeader>
        <CardTitle className='text-white flex items-center gap-2'>
          <Brain className='w-6 h-6 text-purple-400' />
          AI 엔진 상태 ({engines.length})
        </CardTitle>
      </CardHeader>
      <CardContent className='max-h-96 overflow-y-auto space-y-2 pr-2'>
        {engines.map(engine => (
          <div
            key={engine.name}
            className='flex items-center justify-between bg-slate-700/50 p-3 rounded-md hover:bg-slate-700 transition-colors'
          >
            <div className='flex items-center gap-3'>
              {engine.type === 'opensource' ? (
                <Zap className='h-5 w-5 text-green-400' />
              ) : (
                <Brain className='h-5 w-5 text-blue-400' />
              )}
              <span className='font-medium text-slate-200'>{engine.name}</span>
            </div>
            <EngineStatusBadge status={engine.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
