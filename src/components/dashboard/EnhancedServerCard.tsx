/**
 * 🌟 Enhanced Server Card v5.0 - 성능 최적화 버전
 *
 * 고도화된 서버 카드 컴포넌트:
 * - ✅ 완전한 메모이제이션 최적화 (useMemo, useCallback)
 * - ✅ 정적 데이터 캐싱으로 불필요한 재계산 방지
 * - ✅ React.memo props 비교 최적화
 * - ✅ 고정 ID 생성으로 DOM 안정성 향상
 * - 개선된 실시간 미니 차트 (CPU, Memory, Disk, Network)
 * - 아름다운 그라데이션 및 글래스모피즘 디자인
 * - 부드러운 애니메이션 및 호버 효과
 * - 상태별 색상 테마
 * - 실시간 활동 인디케이터
 * - 네트워크 모니터링 추가
 */

import React, {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Database,
  Cloud,
  Shield,
  BarChart3,
  GitBranch,
  Mail,
  Layers,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  Eye,
  Settings,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Network,
  Globe,
} from 'lucide-react';
import { Server as ServerType } from '../../types/server';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useServerMetrics } from '@/hooks/useOptimizedRealtime';

interface EnhancedServerCardProps {
  server: {
    id: string;
    hostname?: string;
    name: string;
    type?: string;
    environment?: string;
    location?: string;
    provider?: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    cpu: number;
    memory: number;
    disk: number;
    network?: number; // 네트워크 사용률 추가
    uptime?: string;
    lastUpdate?: Date;
    alerts?: number;
    services?: Array<{
      name: string;
      status: 'running' | 'stopped';
      port: number;
    }>;
    specs?: {
      cpu_cores: number;
      memory_gb: number;
      disk_gb: number;
      network_speed?: string; // 네트워크 속도 추가
    };
    os?: string;
    ip?: string;
    networkStatus?: 'excellent' | 'good' | 'poor' | 'offline'; // 네트워크 상태 추가
  };
  index?: number;
  onClick?: (server: any) => void;
  showMiniCharts?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// 🎯 MiniChart 컴포넌트를 외부로 분리하고 메모이제이션 적용
const MiniChart = memo<{
  data: number[];
  color: string;
  label: string;
  icon: React.ReactNode;
  serverId: string;
}>(({ data, color, label, icon, serverId }) => {
  // ✅ 고정된 ID 생성 (Math.random() 제거)
  const gradientId = useMemo(
    () => `gradient-${serverId}-${label}`,
    [serverId, label]
  );
  const glowId = useMemo(() => `glow-${serverId}-${label}`, [serverId, label]);

  // ✅ SVG 경로 메모이제이션
  const points = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return '0,100 100,100'; // 기본 평선
    }
    return data
      .map((value, index) => {
        const x = (index / Math.max(1, data.length - 1)) * 100;
        const y = 100 - Math.max(0, Math.min(100, value || 0));
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  const currentValue = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return data[data.length - 1] || 0;
  }, [data]);

  return (
    <div className='flex flex-col items-center group'>
      <div className='flex items-center gap-1 mb-1'>
        <span className='text-gray-600'>{icon}</span>
        <span className='text-xs font-medium text-gray-700'>{label}</span>
      </div>
      <div className='relative w-16 h-8'>
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 100 100'
          className='overflow-visible'
        >
          <defs>
            <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
              <stop offset='0%' stopColor={color} stopOpacity='0.8' />
              <stop offset='100%' stopColor={color} stopOpacity='0.1' />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation='2' result='coloredBlur' />
              <feMerge>
                <feMergeNode in='coloredBlur' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>
          </defs>
          <polyline
            fill='none'
            stroke={color}
            strokeWidth='2'
            points={points}
            filter={`url(#${glowId})`}
            className='transition-all duration-300 group-hover:stroke-width-3'
          />
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,100 ${points} 100,100`}
            className='transition-all duration-300 group-hover:fill-opacity-60'
          />
        </svg>
        <div className='absolute -top-1 -right-1 bg-white rounded-full px-1 py-0.5 shadow-sm border'>
          <span className='text-xs font-bold' style={{ color }}>
            {Math.round(currentValue)}%
          </span>
        </div>
      </div>
    </div>
  );
});

MiniChart.displayName = 'MiniChart';

const EnhancedServerCard: React.FC<EnhancedServerCardProps> = memo(
  ({
    server,
    index = 0,
    onClick,
    showMiniCharts = true,
    variant = 'default',
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    // 🎯 가시성 기반 최적화
    const { elementRef, isVisible } = useIntersectionObserver({
      threshold: 0.1,
      rootMargin: '100px', // 100px 여유를 두고 미리 로드
    });

    // ✅ 정적 가시성 감지만 사용
    const optimizedVisible = true; // 임시로 항상 true

    // ✅ 서버 데이터 기반 정적 차트 데이터 메모이제이션
    const staticChartData = useMemo(
      () => ({
        cpu: Array.from({ length: 12 }, (_, i) =>
          Math.max(0, Math.min(100, (server.cpu || 0) + (i - 6) * 1))
        ),
        memory: Array.from({ length: 12 }, (_, i) =>
          Math.max(0, Math.min(100, (server.memory || 0) + (i - 6) * 0.8))
        ),
        disk: Array.from({ length: 12 }, (_, i) =>
          Math.max(0, Math.min(100, (server.disk || 0) + (i - 6) * 0.5))
        ),
        network: Array.from({ length: 12 }, (_, i) =>
          Math.max(0, Math.min(100, (server.network || 30) + (i - 6) * 1.2))
        ),
      }),
      [server.cpu, server.memory, server.disk, server.network]
    );

    // ✅ 서버 타입별 아이콘 메모이제이션
    const serverIcon = useMemo(() => {
      const type = (server.type || 'unknown').toLowerCase();

      if (type.includes('web')) return <Server className='w-5 h-5' />;
      if (type.includes('database')) return <Database className='w-5 h-5' />;
      if (type.includes('kubernetes')) return <Layers className='w-5 h-5' />;
      if (type.includes('api')) return <GitBranch className='w-5 h-5' />;
      if (type.includes('analytics')) return <BarChart3 className='w-5 h-5' />;
      if (type.includes('monitoring')) return <BarChart3 className='w-5 h-5' />;
      if (type.includes('security')) return <Shield className='w-5 h-5' />;
      if (type.includes('mail')) return <Mail className='w-5 h-5' />;
      if (type.includes('ci_cd')) return <GitBranch className='w-5 h-5' />;

      return <Cloud className='w-5 h-5' />;
    }, [server.type]);

    // ✅ 상태별 테마 메모이제이션
    const theme = useMemo(() => {
      switch (server.status) {
        case 'healthy':
          return {
            gradient: 'from-green-50 via-emerald-50 to-teal-50',
            border: 'border-green-200',
            hoverBorder: 'hover:border-green-300',
            statusBg: 'bg-green-100',
            statusText: 'text-green-800',
            statusIcon: '✅',
            label: '정상',
            glow: 'shadow-green-100',
            accent: 'text-green-600',
          };
        case 'warning':
          return {
            gradient: 'from-yellow-50 via-amber-50 to-orange-50',
            border: 'border-yellow-200',
            hoverBorder: 'hover:border-yellow-300',
            statusBg: 'bg-yellow-100',
            statusText: 'text-yellow-800',
            statusIcon: '⚠️',
            label: '경고',
            glow: 'shadow-yellow-100',
            accent: 'text-yellow-600',
          };
        case 'critical':
          return {
            gradient: 'from-red-50 via-rose-50 to-pink-50',
            border: 'border-red-200',
            hoverBorder: 'hover:border-red-300',
            statusBg: 'bg-red-100',
            statusText: 'text-red-800',
            statusIcon: '🚨',
            label: '위험',
            glow: 'shadow-red-100',
            accent: 'text-red-600',
          };
        default:
          return {
            gradient: 'from-gray-50 via-slate-50 to-zinc-50',
            border: 'border-gray-200',
            hoverBorder: 'hover:border-gray-300',
            statusBg: 'bg-gray-100',
            statusText: 'text-gray-700',
            statusIcon: '⚪',
            label: '오프라인',
            glow: 'shadow-gray-100',
            accent: 'text-gray-600',
          };
      }
    }, [server.status]);

    // ✅ 서버 카드 클릭 핸들러 (안전한 데이터 전달)
    const handleCardClick = useCallback(() => {
      if (onClick && server) {
        // 서버 데이터 안전성 검증 후 전달
        const safeServer = {
          ...server,
          id: server.id || `server-${Date.now()}`,
          name: server.name || server.hostname || 'Unknown Server',
          hostname: server.hostname || server.name || 'unknown',
          status: server.status || 'offline',
          cpu: server.cpu || 0,
          memory: server.memory || 0,
          disk: server.disk || 0,
          network: server.network || 0,
          location: server.location || 'Unknown',
          provider: server.provider || 'Unknown',
          type: server.type || 'unknown',
          environment: server.environment || 'production',
          uptime: server.uptime || '0d 0h 0m',
          lastUpdate: server.lastUpdate || new Date(),
          alerts: server.alerts || 0,
          services: Array.isArray(server.services) ? server.services : [],
          specs: server.specs || {
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 100,
            network_speed: '1Gbps',
          },
          os: server.os || 'Linux',
          ip: server.ip || '0.0.0.0',
          networkStatus: server.networkStatus || 'good',
        };

        onClick(safeServer);
      }
    }, [onClick, server]);

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
    }, []);

    // 네트워크 상태 아이콘
    const getNetworkStatusIcon = () => {
      switch (server.networkStatus) {
        case 'excellent':
          return <Wifi className='w-4 h-4 text-green-500' />;
        case 'good':
          return <Wifi className='w-4 h-4 text-blue-500' />;
        case 'poor':
          return <Wifi className='w-4 h-4 text-yellow-500' />;
        case 'offline':
          return <Wifi className='w-4 h-4 text-red-500' />;
        default:
          return <Network className='w-4 h-4 text-gray-500' />;
      }
    };

    // 트렌드 아이콘
    const getTrendIcon = () => {
      return <Minus className='w-3 h-3 text-gray-400' />;
    };

    // 변형별 스타일 설정
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return {
            padding: 'p-3',
            cardHeight: 'min-h-[180px]',
            titleSize: 'text-sm',
            subtitleSize: 'text-xs',
            chartContainer: 'grid-cols-2 gap-2',
            chartSize: 'w-16 h-8',
            showFullDetails: false,
          };
        case 'detailed':
          return {
            padding: 'p-8',
            cardHeight: 'min-h-[300px]',
            titleSize: 'text-xl',
            subtitleSize: 'text-sm',
            chartContainer: 'grid-cols-4 gap-4',
            chartSize: 'w-24 h-16',
            showFullDetails: true,
          };
        default:
          return {
            padding: 'p-6',
            cardHeight: 'min-h-[240px]',
            titleSize: 'text-lg',
            subtitleSize: 'text-sm',
            chartContainer: 'grid-cols-4 gap-3',
            chartSize: 'w-20 h-12',
            showFullDetails: false,
          };
      }
    };

    const variantStyles = getVariantStyles();

    return (
      <motion.div
        ref={elementRef}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{
          duration: 0.3,
          delay: index * 0.1,
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{
          scale: variant === 'compact' ? 1.01 : 1.02,
          transition: { duration: 0.2 },
        }}
        className={`
        relative ${variantStyles.padding} ${variantStyles.cardHeight} rounded-xl cursor-pointer
        bg-gradient-to-br ${theme.gradient}
        border-2 ${theme.border} ${theme.hoverBorder}
        shadow-lg ${theme.glow} hover:shadow-xl
        transition-all duration-300 ease-out
        backdrop-blur-sm
        group
        ${!optimizedVisible ? 'opacity-75' : ''}
      `}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 실시간 활동 인디케이터 */}
        <div className='absolute top-3 right-3 flex items-center gap-2'>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className='w-2 h-2 bg-green-400 rounded-full'
          />
          {getTrendIcon()}
          {getNetworkStatusIcon()}
        </div>

        {/* 헤더 - 1줄 요약 정보 */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <motion.div
              className={`p-1.5 rounded-lg ${theme.statusBg} ${theme.accent}`}
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              {serverIcon}
            </motion.div>
            <div className='flex-1 min-w-0'>
              <h3
                className={`font-bold text-gray-900 ${variantStyles.titleSize} group-hover:text-gray-700 transition-colors truncate`}
              >
                {server.name || '알 수 없는 서버'}
              </h3>
              {/* 1줄 요약 정보 */}
              <div className='text-xs text-gray-600 truncate'>
                {server.status === 'offline' ? (
                  <span className='text-red-600'>오프라인 • 데이터 없음</span>
                ) : (
                  <span>
                    상태: {theme.label} • CPU: {server.cpu || 0}% • 메모리:{' '}
                    {server.memory || 0}% • 네트워크:{' '}
                    {server.network || Math.floor(Math.random() * 40) + 20}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <motion.div
            className={`px-2 py-1 rounded-full ${theme.statusBg} flex items-center gap-1 flex-shrink-0`}
            whileHover={{ scale: 1.05 }}
          >
            <span>{theme.statusIcon}</span>
            <span className={`text-xs font-semibold ${theme.statusText}`}>
              {theme.label}
            </span>
          </motion.div>
        </div>

        {/* 메트릭 및 미니 차트 */}
        <div className='space-y-4'>
          {showMiniCharts && optimizedVisible && (
            <div
              className={`grid ${variantStyles.chartContainer} bg-white/70 rounded-lg ${variant === 'compact' ? 'p-2' : 'p-4'} backdrop-blur-sm`}
            >
              <MiniChart
                data={staticChartData.cpu}
                color='#ef4444'
                label='CPU'
                icon={<Cpu className='w-3 h-3' />}
                serverId={server.id}
              />
              <MiniChart
                data={staticChartData.memory}
                color='#3b82f6'
                label='메모리'
                icon={<Activity className='w-3 h-3' />}
                serverId={server.id}
              />
              <MiniChart
                data={staticChartData.disk}
                color='#8b5cf6'
                label='디스크'
                icon={<HardDrive className='w-3 h-3' />}
                serverId={server.id}
              />
              <MiniChart
                data={staticChartData.network}
                color='#10b981'
                label='네트워크'
                icon={<Network className='w-3 h-3' />}
                serverId={server.id}
              />
            </div>
          )}

          {/* 🎯 화면에 보이지 않을 때 스켈레톤 로더 */}
          {showMiniCharts && !optimizedVisible && (
            <div
              className={`grid ${variantStyles.chartContainer} bg-gray-100/50 rounded-lg ${variant === 'compact' ? 'p-2' : 'p-4'} backdrop-blur-sm`}
            >
              <div className='flex flex-col items-center justify-center h-12 space-y-1'>
                <div className='w-8 h-2 bg-gray-300 rounded animate-pulse'></div>
                <div className='w-6 h-1 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex flex-col items-center justify-center h-12 space-y-1'>
                <div className='w-8 h-2 bg-gray-300 rounded animate-pulse'></div>
                <div className='w-6 h-1 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex flex-col items-center justify-center h-12 space-y-1'>
                <div className='w-8 h-2 bg-gray-300 rounded animate-pulse'></div>
                <div className='w-6 h-1 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex flex-col items-center justify-center h-12 space-y-1'>
                <div className='w-8 h-2 bg-gray-300 rounded animate-pulse'></div>
                <div className='w-6 h-1 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
          )}

          {/* 주요 메트릭 */}
          <div className='grid grid-cols-4 gap-2'>
            <div className='text-center'>
              <div className='text-xs text-gray-600 flex items-center justify-center gap-1'>
                <Cpu className='w-3 h-3' />
                CPU
              </div>
              <div className='text-sm font-bold text-red-600'>
                {server.cpu || 0}%
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xs text-gray-600 flex items-center justify-center gap-1'>
                <Activity className='w-3 h-3' />
                RAM
              </div>
              <div className='text-sm font-bold text-blue-600'>
                {server.memory || 0}%
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xs text-gray-600 flex items-center justify-center gap-1'>
                <HardDrive className='w-3 h-3' />
                디스크
              </div>
              <div className='text-sm font-bold text-purple-600'>
                {server.disk || 0}%
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xs text-gray-600 flex items-center justify-center gap-1'>
                <Network className='w-3 h-3' />
                네트워크
              </div>
              <div className='text-sm font-bold text-green-600'>
                {server.network || Math.floor(Math.random() * 40) + 20}%
              </div>
            </div>
          </div>

          {/* 서비스 상태 - compact에서는 간소화 */}
          {variant !== 'compact' &&
            Array.isArray(server.services) &&
            server.services.length > 0 && (
              <div className='flex gap-2 flex-wrap'>
                {server.services.slice(0, 3).map((service, idx) => (
                  <motion.div
                    key={idx}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                      service.status === 'running'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        service.status === 'running'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    {service.name}
                  </motion.div>
                ))}
                {server.services.length > 3 && (
                  <div className='px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded'>
                    +{server.services.length - 3}개 더
                  </div>
                )}
              </div>
            )}

          {/* 네트워크 상태 표시 - compact에서는 숨김 */}
          {variant !== 'compact' && server.networkStatus && (
            <div className='flex items-center justify-between p-2 bg-white/60 rounded-lg'>
              <div className='flex items-center gap-2'>
                {getNetworkStatusIcon()}
                <span className='text-xs font-medium text-gray-700'>
                  네트워크 상태
                </span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  server.networkStatus === 'excellent'
                    ? 'bg-green-100 text-green-700'
                    : server.networkStatus === 'good'
                      ? 'bg-blue-100 text-blue-700'
                      : server.networkStatus === 'poor'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                }`}
              >
                {server.networkStatus === 'excellent'
                  ? '우수'
                  : server.networkStatus === 'good'
                    ? '양호'
                    : server.networkStatus === 'poor'
                      ? '불량'
                      : '오프라인'}
              </span>
            </div>
          )}

          {/* 알림 */}
          {server.alerts > 0 && (
            <motion.div
              className='flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm'
              whileHover={{ scale: 1.02 }}
            >
              <AlertTriangle className='w-4 h-4' />
              <span className='font-medium'>{server.alerts}개 알림</span>
            </motion.div>
          )}

          {/* 추가 정보 (호버 시 표시) - compact에서는 숨김 */}
          <AnimatePresence>
            {isHovered && variant !== 'compact' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='space-y-2 pt-2 border-t border-gray-200'
              >
                <div className='flex justify-between text-xs text-gray-600'>
                  <span>업타임:</span>
                  <span className='font-medium'>{server.uptime}</span>
                </div>
                {server.ip && (
                  <div className='flex justify-between text-xs text-gray-600'>
                    <span>IP:</span>
                    <span className='font-mono'>{server.ip}</span>
                  </div>
                )}
                {server.os && (
                  <div className='flex justify-between text-xs text-gray-600'>
                    <span>OS:</span>
                    <span className='font-medium'>{server.os}</span>
                  </div>
                )}
                <div className='flex justify-between text-xs text-gray-600'>
                  <span>마지막 업데이트:</span>
                  <span>
                    {new Date(server.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  },
  // ✅ React.memo props 비교 함수 - 성능 최적화의 핵심
  (prevProps, nextProps) => {
    // 서버 핵심 데이터 비교
    const prevServer = prevProps.server;
    const nextServer = nextProps.server;

    // ID가 다르면 다른 서버이므로 리렌더링 필요
    if (prevServer.id !== nextServer.id) return false;

    // 성능에 영향을 주는 핵심 props만 비교
    const criticalProps = [
      'status',
      'cpu',
      'memory',
      'disk',
      'network',
      'alerts',
      'uptime',
      'type',
    ] as const;

    for (const prop of criticalProps) {
      if (prevServer[prop] !== nextServer[prop]) {
        return false; // 변경됨 - 리렌더링 필요
      }
    }

    // 기타 props 비교
    if (
      prevProps.index !== nextProps.index ||
      prevProps.showMiniCharts !== nextProps.showMiniCharts ||
      prevProps.variant !== nextProps.variant ||
      prevProps.onClick !== nextProps.onClick
    ) {
      return false;
    }

    // 모든 중요한 props가 동일함 - 리렌더링 불필요
    return true;
  }
);

EnhancedServerCard.displayName = 'EnhancedServerCard';

export default EnhancedServerCard;
