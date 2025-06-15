/**
 * 🌐 Network Monitoring Card
 *
 * 네트워크 모니터링 전용 카드 컴포넌트:
 * - 실시간 네트워크 트래픽 차트
 * - 대역폭 사용률 표시
 * - 패킷 손실률 모니터링
 * - 지연시간 측정
 * - 네트워크 상태 시각화
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Signal,
  Users,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkMetrics {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // %
  uptime: number; // %
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  connections: number;
  status: 'excellent' | 'good' | 'poor' | 'offline';
}

interface NetworkMonitoringCardProps {
  serverName: string;
  metrics: NetworkMetrics;
  className?: string;
}

const getStatusColor = (status: NetworkMetrics['status']) => {
  switch (status) {
    case 'excellent':
      return 'text-green-600 bg-green-100';
    case 'good':
      return 'text-blue-600 bg-blue-100';
    case 'poor':
      return 'text-yellow-600 bg-yellow-100';
    case 'offline':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusIcon = (status: NetworkMetrics['status']) => {
  switch (status) {
    case 'excellent':
      return <CheckCircle className='h-4 w-4' />;
    case 'good':
      return <CheckCircle className='h-4 w-4' />;
    case 'poor':
      return <AlertTriangle className='h-4 w-4' />;
    case 'offline':
      return <XCircle className='h-4 w-4' />;
    default:
      return <AlertTriangle className='h-4 w-4' />;
  }
};

const getStatusText = (status: NetworkMetrics['status']) => {
  switch (status) {
    case 'excellent':
      return '우수';
    case 'good':
      return '양호';
    case 'poor':
      return '불량';
    case 'offline':
      return '오프라인';
    default:
      return '알 수 없음';
  }
};

const NetworkMonitoringCard: React.FC<NetworkMonitoringCardProps> = ({
  serverName,
  metrics,
  className = '',
}) => {
  const [realtimeData, setRealtimeData] = useState<{
    bandwidth: number[];
    latency: number[];
    downloadSpeed: number[];
    uploadSpeed: number[];
  }>({
    bandwidth: Array.from(
      { length: 20 },
      () => Math.random() * 30 + metrics.bandwidth - 15
    ),
    latency: Array.from(
      { length: 20 },
      () => Math.random() * 20 + metrics.latency - 10
    ),
    downloadSpeed: Array.from(
      { length: 20 },
      () => Math.random() * 20 + metrics.downloadSpeed - 10
    ),
    uploadSpeed: Array.from(
      { length: 20 },
      () => Math.random() * 15 + metrics.uploadSpeed - 7
    ),
  });

  // 실시간 데이터 업데이트 (성능 최적화: 2초 → 10초)
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        bandwidth: [
          ...prev.bandwidth.slice(1),
          Math.max(
            0,
            Math.min(100, metrics.bandwidth + (Math.random() - 0.5) * 30)
          ),
        ],
        latency: [
          ...prev.latency.slice(1),
          Math.max(
            0,
            Math.min(500, metrics.latency + (Math.random() - 0.5) * 40)
          ),
        ],
        downloadSpeed: [
          ...prev.downloadSpeed.slice(1),
          Math.max(
            0,
            Math.min(1000, metrics.downloadSpeed + (Math.random() - 0.5) * 50)
          ),
        ],
        uploadSpeed: [
          ...prev.uploadSpeed.slice(1),
          Math.max(
            0,
            Math.min(1000, metrics.uploadSpeed + (Math.random() - 0.5) * 30)
          ),
        ],
      }));
    }, 20000); // 🎯 성능 최적화: 2초 → 20초로 변경 (네트워크 부하 90% 감소)

    return () => clearInterval(interval);
  }, [metrics]);

  const statusColorClass = getStatusColor(metrics.status);
  const statusIcon = getStatusIcon(metrics.status);
  const statusText = getStatusText(metrics.status);

  // 미니 차트 생성
  const NetworkChart = ({
    data,
    color,
    label,
    unit,
    icon,
  }: {
    data: number[];
    color: string;
    label: string;
    unit: string;
    icon: React.ReactNode;
  }) => {
    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y =
          100 - Math.max(0, Math.min(100, (value / Math.max(...data)) * 100));
        return `${x},${y}`;
      })
      .join(' ');

    const currentValue = data[data.length - 1] || 0;
    const gradientId = `network-gradient-${label}-${Math.random()}`;

    return (
      <div className='bg-white/60 rounded-lg p-3 shadow-sm'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <div className='text-gray-600'>{icon}</div>
            <span className='text-xs font-medium text-gray-700'>{label}</span>
          </div>
          <span className='text-xs font-bold' style={{ color }}>
            {currentValue.toFixed(1)}
            {unit}
          </span>
        </div>

        <div className='h-12 relative'>
          <svg
            className='w-full h-full'
            viewBox='0 0 100 100'
            preserveAspectRatio='none'
          >
            <defs>
              <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
                <stop offset='0%' stopColor={color} stopOpacity='0.6' />
                <stop offset='100%' stopColor={color} stopOpacity='0.1' />
              </linearGradient>
            </defs>

            {/* 배경 격자 */}
            <defs>
              <pattern
                id={`network-grid-${label}`}
                width='10'
                height='10'
                patternUnits='userSpaceOnUse'
              >
                <path
                  d='M 10 0 L 0 0 0 10'
                  fill='none'
                  stroke='#f1f5f9'
                  strokeWidth='0.5'
                />
              </pattern>
            </defs>
            <rect
              width='100'
              height='100'
              fill={`url(#network-grid-${label})`}
              opacity='0.3'
            />

            {/* 영역 채우기 */}
            <polygon
              fill={`url(#${gradientId})`}
              points={`0,100 ${points} 100,100`}
            />

            {/* 라인 */}
            <polyline
              fill='none'
              stroke={color}
              strokeWidth='2'
              points={points}
              vectorEffect='non-scaling-stroke'
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-br ${getStatusColor(metrics.status)}
        border-2 ${getStatusColor(metrics.status)}
        rounded-xl p-6 shadow-lg
        ${className}
      `}
    >
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className={`p-2 rounded-lg ${getStatusColor(metrics.status)}`}>
            <Globe className='w-5 h-5 text-gray-600' />
          </div>
          <div>
            <h3 className='font-bold text-gray-900'>{serverName}</h3>
            <p className='text-sm text-gray-600'>네트워크 모니터링</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full ${getStatusColor(metrics.status)} flex items-center gap-2`}
        >
          {statusIcon}
          <span
            className={`text-xs font-semibold ${getStatusColor(metrics.status)}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* 주요 메트릭 */}
      <div className='grid grid-cols-2 gap-3 mb-4'>
        <div className='text-center p-3 bg-white/50 rounded-lg'>
          <div className='flex items-center justify-center gap-1 mb-1'>
            <Signal className='w-4 h-4 text-blue-500' />
            <span className='text-xs text-gray-600'>대역폭</span>
          </div>
          <div className='text-lg font-bold text-blue-600'>
            {metrics.bandwidth}%
          </div>
        </div>

        <div className='text-center p-3 bg-white/50 rounded-lg'>
          <div className='flex items-center justify-center gap-1 mb-1'>
            <Clock className='w-4 h-4 text-purple-500' />
            <span className='text-xs text-gray-600'>지연시간</span>
          </div>
          <div className='text-lg font-bold text-purple-600'>
            {metrics.latency}ms
          </div>
        </div>

        <div className='text-center p-3 bg-white/50 rounded-lg'>
          <div className='flex items-center justify-center gap-1 mb-1'>
            <Download className='w-4 h-4 text-green-500' />
            <span className='text-xs text-gray-600'>다운로드</span>
          </div>
          <div className='text-sm font-bold text-green-600'>
            {metrics.downloadSpeed} Mbps
          </div>
        </div>

        <div className='text-center p-3 bg-white/50 rounded-lg'>
          <div className='flex items-center justify-center gap-1 mb-1'>
            <Upload className='w-4 h-4 text-orange-500' />
            <span className='text-xs text-gray-600'>업로드</span>
          </div>
          <div className='text-sm font-bold text-orange-600'>
            {metrics.uploadSpeed} Mbps
          </div>
        </div>
      </div>

      {/* 실시간 차트 */}
      <div className='grid grid-cols-2 gap-3 mb-4'>
        <NetworkChart
          data={realtimeData.bandwidth}
          color='#3b82f6'
          label='대역폭'
          unit='%'
          icon={<Signal className='w-3 h-3' />}
        />

        <NetworkChart
          data={realtimeData.latency}
          color='#8b5cf6'
          label='지연시간'
          unit='ms'
          icon={<Clock className='w-3 h-3' />}
        />
      </div>

      {/* 추가 정보 */}
      <div className='space-y-2 pt-3 border-t border-gray-200'>
        <div className='flex justify-between text-xs text-gray-600'>
          <span>패킷 손실률:</span>
          <span
            className={`font-medium ${metrics.packetLoss > 1 ? 'text-red-600' : 'text-green-600'}`}
          >
            {metrics.packetLoss}%
          </span>
        </div>

        <div className='flex justify-between text-xs text-gray-600'>
          <span>네트워크 가동률:</span>
          <span className='font-medium text-green-600'>{metrics.uptime}%</span>
        </div>

        <div className='flex justify-between text-xs text-gray-600'>
          <span>활성 연결:</span>
          <span className='font-medium'>{metrics.connections}개</span>
        </div>
      </div>

      {/* 상태 표시줄 */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span>네트워크 상태</span>
          <span className='font-medium'>실시간 모니터링</span>
        </div>
        <div className='mt-2 w-full bg-gray-200 rounded-full h-1'>
          <div
            className={cn(
              'h-1 rounded-full transition-all duration-500',
              metrics.status === 'excellent'
                ? 'bg-green-500'
                : metrics.status === 'good'
                  ? 'bg-blue-500'
                  : metrics.status === 'poor'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            )}
            style={{
              width:
                metrics.status === 'offline'
                  ? '0%'
                  : metrics.status === 'poor'
                    ? '40%'
                    : metrics.status === 'good'
                      ? '70%'
                      : '100%',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default NetworkMonitoringCard;
