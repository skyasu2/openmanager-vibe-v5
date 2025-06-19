'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Server } from '@/types/server';
import { useServerMetricsHistory } from '@/hooks/useServerMetricsHistory';
import { formatPercentage } from '@/lib/utils';

interface EnhancedServerCardProps {
  server: Server;
  onClick: () => void;
  style?: React.CSSProperties;
}

const MiniChart = memo<{
  data: number[];
  color: string;
  label: string;
  icon: React.ReactNode;
}>(({ data, color, label, icon }) => {
  const currentValue = data.length > 0 ? data[data.length - 1] : 0;
  const points =
    data.length > 1
      ? data
          .map((p, i) => `${(i / (data.length - 1)) * 100},${100 - p}`)
          .join(' ')
      : `0,${100 - currentValue} 100,${100 - currentValue}`;

  const gradientId = useMemo(
    () => `gradient-${label}-${Math.random().toString(36).substring(7)}`,
    [label]
  );

  return (
    <div className='flex flex-col items-center justify-center p-2 rounded-lg bg-white/10'>
      <div className='flex items-center gap-2 self-start'>
        <span className='text-gray-300'>{icon}</span>
        <span className='text-xs font-medium text-gray-200'>{label}</span>
      </div>
      <div className='relative w-full h-12 mt-2'>
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 100 100'
          preserveAspectRatio='none'
          className='overflow-visible'
        >
          <defs>
            <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
              <stop offset='0%' stopColor={color} stopOpacity='0.4' />
              <stop offset='100%' stopColor={color} stopOpacity='0' />
            </linearGradient>
          </defs>
          <polyline
            fill='none'
            stroke={color}
            strokeWidth='3'
            points={points}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,100 ${points} 100,100`}
          />
        </svg>
        <div className='absolute top-0 right-0 text-sm font-bold text-white'>
          {formatPercentage(currentValue)}
        </div>
      </div>
    </div>
  );
});
MiniChart.displayName = 'MiniChart';

const ServerStatusIndicator = memo<{ status: Server['status'] }>(
  ({ status }) => {
    const statusConfig = useMemo(
      () => ({
        online: {
          icon: <CheckCircle className='w-4 h-4' />,
          text: '온라인',
          color: 'text-green-400',
        },
        warning: {
          icon: <AlertTriangle className='w-4 h-4' />,
          text: '경고',
          color: 'text-yellow-400',
        },
        offline: {
          icon: <XCircle className='w-4 h-4' />,
          text: '오프라인',
          color: 'text-gray-400',
        },
      }),
      []
    );

    const { icon, text, color } = statusConfig[status] || statusConfig.warning;

    return (
      <div className={`flex items-center gap-2 text-sm ${color}`}>
        {icon}
        <span>{text}</span>
      </div>
    );
  }
);
ServerStatusIndicator.displayName = 'ServerStatusIndicator';

const EnhancedServerCard = memo<EnhancedServerCardProps>(
  ({ server, onClick, style }) => {
    const { metricsHistory, lastUpdated } = useServerMetricsHistory(server.id);

    const cardStatusStyles = useMemo(() => {
      switch (server.status) {
        case 'warning':
          return 'border-yellow-500/50 shadow-lg shadow-yellow-500/20';
        case 'online':
          return 'border-green-500/30';
        case 'offline':
          return 'border-gray-500/50 shadow-lg shadow-gray-500/20';
        default:
          return 'border-gray-500/30';
      }
    }, [server.status]);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        style={style}
        className={`relative p-4 rounded-xl border cursor-pointer h-full flex flex-col justify-between
                  bg-gray-800/40 backdrop-blur-sm text-white
                  hover:bg-gray-700/50 transition-all duration-300 ${cardStatusStyles}`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <h3 className='text-lg font-bold'>{server.name}</h3>
            <p className='text-xs text-gray-400'>{server.ip}</p>
          </div>
          <button
            aria-label='더 보기'
            className='p-2 rounded-full hover:bg-white/10'
          >
            <MoreVertical className='w-4 h-4' />
          </button>
        </div>

        <div className='grid grid-cols-2 gap-3 my-4'>
          <MiniChart
            data={metricsHistory.cpu}
            color='#3b82f6'
            label='CPU'
            icon={<Cpu size={14} />}
          />
          <MiniChart
            data={metricsHistory.memory}
            color='#8b5cf6'
            label='Memory'
            icon={<MemoryStick size={14} />}
          />
          <MiniChart
            data={metricsHistory.disk}
            color='#ec4899'
            label='Disk'
            icon={<HardDrive size={14} />}
          />
          <MiniChart
            data={metricsHistory.network}
            color='#10b981'
            label='Network'
            icon={<Network size={14} />}
          />
        </div>

        <div className='flex items-center justify-between text-xs text-gray-400'>
          <ServerStatusIndicator status={server.status} />
          <span>
            {lastUpdated
              ? `${formatTimeAgo(lastUpdated)} 업데이트`
              : '연결 중...'}
          </span>
        </div>
      </motion.div>
    );
  }
);

EnhancedServerCard.displayName = 'EnhancedServerCard';
export default EnhancedServerCard;

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return '방금 전';
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분 전`;
}
