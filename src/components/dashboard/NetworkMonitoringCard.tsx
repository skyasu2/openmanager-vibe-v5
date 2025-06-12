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
} from 'lucide-react';

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

  // 실시간 데이터 업데이트
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
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics]);

  // 네트워크 상태별 색상 테마
  const getStatusTheme = () => {
    switch (metrics.status) {
      case 'excellent':
        return {
          gradient: 'from-green-50 via-emerald-50 to-teal-50',
          border: 'border-green-200',
          statusColor: 'text-green-600',
          statusBg: 'bg-green-100',
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          label: '우수',
        };
      case 'good':
        return {
          gradient: 'from-blue-50 via-cyan-50 to-sky-50',
          border: 'border-blue-200',
          statusColor: 'text-blue-600',
          statusBg: 'bg-blue-100',
          icon: <Wifi className='w-5 h-5 text-blue-500' />,
          label: '양호',
        };
      case 'poor':
        return {
          gradient: 'from-yellow-50 via-amber-50 to-orange-50',
          border: 'border-yellow-200',
          statusColor: 'text-yellow-600',
          statusBg: 'bg-yellow-100',
          icon: <AlertTriangle className='w-5 h-5 text-yellow-500' />,
          label: '불량',
        };
      default:
        return {
          gradient: 'from-red-50 via-rose-50 to-pink-50',
          border: 'border-red-200',
          statusColor: 'text-red-600',
          statusBg: 'bg-red-100',
          icon: <AlertTriangle className='w-5 h-5 text-red-500' />,
          label: '오프라인',
        };
    }
  };

  const theme = getStatusTheme();

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
        bg-gradient-to-br ${theme.gradient}
        border-2 ${theme.border}
        rounded-xl p-6 shadow-lg
        ${className}
      `}
    >
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className={`p-2 rounded-lg ${theme.statusBg}`}>
            <Globe className='w-5 h-5 text-gray-600' />
          </div>
          <div>
            <h3 className='font-bold text-gray-900'>{serverName}</h3>
            <p className='text-sm text-gray-600'>네트워크 모니터링</p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full ${theme.statusBg} flex items-center gap-2`}
        >
          {theme.icon}
          <span className={`text-xs font-semibold ${theme.statusColor}`}>
            {theme.label}
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
    </motion.div>
  );
};

export default NetworkMonitoringCard;
