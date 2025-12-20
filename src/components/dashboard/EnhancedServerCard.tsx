/**
 * 🌟 Enhanced Server Card v5.0 - UI/UX 개선판
 *
 * 고도화된 서버 카드 컴포넌트:
 * - 🎨 모던한 디자인 시스템 적용
 * - ✨ 부드러운 마이크로 인터랙션
 * - 📊 개선된 실시간 미니 차트
 * - 🎭 상태별 시각적 피드백 강화
 * - 🌈 개선된 색상 팔레트 및 대비
 * - 🔥 성능 최적화된 애니메이션
 *
 * 복원일: 2025-12-13 (commit b9961bf0 기반)
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Box,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  Layers,
  Mail,
  Minus,
  Network,
  Search,
  Server,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import type { Server as ServerType } from '@/types/server';

export interface EnhancedServerCardProps {
  server: ServerType;
  index: number;
  onClick?: (server: ServerType) => void;
  showMiniCharts?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const EnhancedServerCard: React.FC<EnhancedServerCardProps> = memo(
  ({ server, index, onClick, showMiniCharts = true, variant = 'default' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [realtimeData, setRealtimeData] = useState<{
      cpu: number[];
      memory: number[];
      disk: number[];
      network: number[];
      trend: 'up' | 'down' | 'stable';
    }>({
      cpu: Array.from({ length: 12 }, () =>
        parseFloat(
          Math.max(
            0,
            Math.min(100, Math.random() * 30 + server.cpu - 15)
          ).toFixed(2)
        )
      ),
      memory: Array.from({ length: 12 }, () =>
        parseFloat(
          Math.max(
            0,
            Math.min(100, Math.random() * 20 + server.memory - 10)
          ).toFixed(2)
        )
      ),
      disk: Array.from({ length: 12 }, () =>
        parseFloat(
          Math.max(
            0,
            Math.min(100, Math.random() * 10 + server.disk - 5)
          ).toFixed(2)
        )
      ),
      network: Array.from({ length: 12 }, () =>
        parseFloat(
          Math.max(
            0,
            Math.min(100, Math.random() * 40 + (server.network || 30) - 20)
          ).toFixed(2)
        )
      ),
      trend: 'stable',
    });

    // 실시간 데이터 업데이트 - 5분 간격 (성능 최적화)
    useEffect(() => {
      const interval = setInterval(
        () => {
          setRealtimeData((prev) => ({
            cpu: [
              ...prev.cpu.slice(1),
              parseFloat(
                Math.max(
                  0,
                  Math.min(100, server.cpu + (Math.random() - 0.5) * 20)
                ).toFixed(2)
              ),
            ],
            memory: [
              ...prev.memory.slice(1),
              parseFloat(
                Math.max(
                  0,
                  Math.min(100, server.memory + (Math.random() - 0.5) * 15)
                ).toFixed(2)
              ),
            ],
            disk: [
              ...prev.disk.slice(1),
              parseFloat(
                Math.max(
                  0,
                  Math.min(100, server.disk + (Math.random() - 0.5) * 5)
                ).toFixed(2)
              ),
            ],
            network: [
              ...prev.network.slice(1),
              parseFloat(
                Math.max(
                  0,
                  Math.min(
                    100,
                    (server.network || 30) + (Math.random() - 0.5) * 25
                  )
                ).toFixed(2)
              ),
            ],
            trend:
              Math.random() > 0.7
                ? Math.random() > 0.5
                  ? 'up'
                  : 'down'
                : 'stable',
          }));
        },
        300000 + index * 1000 // 5분 간격 (카드별 1초 오프셋)
      );

      return () => clearInterval(interval);
    }, [server.cpu, server.memory, server.disk, server.network, index]);

    // 🎯 실제 기업 환경 기반 서버 타입별 아이콘 - 개선된 버전
    const getServerIcon = () => {
      const type = (server.type || 'default').toLowerCase();

      // 🌐 웹서버
      if (
        type === 'nginx' ||
        type === 'apache' ||
        type === 'iis' ||
        type === 'web'
      )
        return <Server className="w-5 h-5" />;

      // 🚀 애플리케이션 서버
      if (type === 'nodejs' || type === 'api')
        return <GitBranch className="w-5 h-5" />;
      if (type === 'springboot') return <Settings className="w-5 h-5" />;
      if (type === 'django' || type === 'php')
        return <Code className="w-5 h-5" />;
      if (type === 'dotnet' || type === 'app')
        return <Box className="w-5 h-5" />;

      // 🗄️ 데이터베이스
      if (
        type === 'mysql' ||
        type === 'postgresql' ||
        type === 'oracle' ||
        type === 'mssql' ||
        type === 'database'
      )
        return <Database className="w-5 h-5" />;
      if (type === 'mongodb') return <FileText className="w-5 h-5" />;

      // ⚙️ 인프라 서비스
      if (type === 'redis' || type === 'cache')
        return <Zap className="w-5 h-5" />;
      if (type === 'rabbitmq' || type === 'kafka' || type === 'queue')
        return <Network className="w-5 h-5" />;
      if (type === 'elasticsearch') return <Search className="w-5 h-5" />;
      if (type === 'jenkins') return <Cpu className="w-5 h-5" />;
      if (type === 'prometheus' || type === 'monitoring')
        return <BarChart3 className="w-5 h-5" />;
      if (type === 'security') return <Shield className="w-5 h-5" />;
      if (type === 'mail') return <Mail className="w-5 h-5" />;
      if (type === 'load-balancer') return <Layers className="w-5 h-5" />;
      if (type === 'storage' || type === 'backup')
        return <HardDrive className="w-5 h-5" />;

      return <Cloud className="w-5 h-5" />;
    };

    // 🎨 개선된 상태별 테마 - 더 세련된 색상 팔레트
    // ServerStatus: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown'
    const getStatusTheme = () => {
      const status = server.status;
      switch (status) {
        case 'online':
          return {
            gradient: 'from-emerald-50/80 via-green-50/60 to-teal-50/40',
            border: 'border-emerald-200/60',
            hoverBorder: 'hover:border-emerald-300/80',
            statusBg: 'bg-emerald-100/80',
            statusText: 'text-emerald-800',
            statusIcon: '✅',
            label: '정상',
            glow: 'shadow-emerald-100/50',
            accent: 'text-emerald-600',
            iconBg: 'bg-emerald-100/90',
            pulse: 'bg-emerald-400',
          };
        case 'warning':
          return {
            gradient: 'from-amber-50/80 via-yellow-50/60 to-orange-50/40',
            border: 'border-amber-200/60',
            hoverBorder: 'hover:border-amber-300/80',
            statusBg: 'bg-amber-100/80',
            statusText: 'text-amber-800',
            statusIcon: '⚠️',
            label: '경고',
            glow: 'shadow-amber-100/50',
            accent: 'text-amber-600',
            iconBg: 'bg-amber-100/90',
            pulse: 'bg-amber-400',
          };
        case 'critical':
          return {
            gradient: 'from-rose-50/80 via-red-50/60 to-pink-50/40',
            border: 'border-rose-200/60',
            hoverBorder: 'hover:border-rose-300/80',
            statusBg: 'bg-rose-100/80',
            statusText: 'text-rose-800',
            statusIcon: '🚨',
            label: '위험',
            glow: 'shadow-rose-100/50',
            accent: 'text-rose-600',
            iconBg: 'bg-rose-100/90',
            pulse: 'bg-rose-400',
          };
        case 'maintenance':
          return {
            gradient: 'from-indigo-50/80 via-blue-50/60 to-cyan-50/40',
            border: 'border-indigo-200/60',
            hoverBorder: 'hover:border-indigo-300/80',
            statusBg: 'bg-indigo-100/80',
            statusText: 'text-indigo-800',
            statusIcon: '🔧',
            label: '유지보수',
            glow: 'shadow-indigo-100/50',
            accent: 'text-indigo-600',
            iconBg: 'bg-indigo-100/90',
            pulse: 'bg-indigo-400',
          };
        default:
          // Handles: 'offline', 'unknown', and any other status
          return {
            gradient: 'from-slate-50/80 via-gray-50/60 to-zinc-50/40',
            border: 'border-slate-200/60',
            hoverBorder: 'hover:border-slate-300/80',
            statusBg: 'bg-slate-100/80',
            statusText: 'text-slate-700',
            statusIcon: '⚪',
            label: '오프라인',
            glow: 'shadow-slate-100/50',
            accent: 'text-slate-600',
            iconBg: 'bg-slate-100/90',
            pulse: 'bg-slate-400',
          };
      }
    };

    const theme = getStatusTheme();

    // 변형별 스타일 설정 - 개선된 버전
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return {
            padding: 'p-4',
            cardHeight: 'min-h-[160px]',
            titleSize: 'text-sm',
            subtitleSize: 'text-xs',
            chartContainer: 'grid-cols-2 gap-2',
            chartSize: 'w-full h-10',
            showFullDetails: false,
            useCompactLabels: true,
          };
        case 'detailed':
          return {
            padding: 'p-8',
            cardHeight: 'min-h-[320px]',
            titleSize: 'text-xl',
            subtitleSize: 'text-sm',
            chartContainer: 'grid-cols-2 gap-4',
            chartSize: 'w-28 h-20',
            showFullDetails: true,
            useCompactLabels: false,
          };
        default:
          return {
            padding: 'p-6',
            cardHeight: 'min-h-[240px]',
            titleSize: 'text-lg',
            subtitleSize: 'text-sm',
            chartContainer: 'grid-cols-2 gap-3',
            chartSize: 'w-20 h-16',
            showFullDetails: false,
            useCompactLabels: false,
          };
      }
    };

    const variantStyles = getVariantStyles();

    // 🎨 개선된 미니 차트 - 더 세련된 디자인
    const MiniChart = ({
      data,
      color,
      label,
      icon,
    }: {
      data: number[];
      color: string;
      label: string;
      icon: React.ReactNode;
    }) => {
      const points = data
        .map((value, idx) => {
          const x = (idx / (data.length - 1)) * 100;
          const y = 100 - Math.max(0, Math.min(100, value));
          return `${x},${y}`;
        })
        .join(' ');

      const currentValue = data[data.length - 1] || 0;
      const gradientId = `gradient-${server.id}-${label}-${index}`;
      const glowId = `glow-${server.id}-${label}-${index}`;

      // 상태별 색상 강도 조절
      const getValueColor = (value: number) => {
        if (value > 90) return '#ef4444'; // 위험 - 빨강
        if (value > 80) return '#f59e0b'; // 경고 - 주황
        if (value > 70) return '#eab308'; // 주의 - 노랑
        return color; // 기본 색상
      };

      const valueColor = getValueColor(currentValue);
      const isCompact = variantStyles.useCompactLabels;

      // Compact 모드: 가로 배치 + 미니 차트
      if (isCompact) {
        return (
          <motion.div
            className="flex items-center gap-2 bg-white/90 rounded-lg px-2 py-1.5 group hover:bg-white/95 transition-all duration-200 shadow-sm border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            {/* 아이콘 + 라벨 */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="text-gray-600 p-0.5">{icon}</div>
              {!isCompact && (
                <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">
                  {label}
                </span>
              )}
            </div>

            {/* 미니 인라인 차트 - 2열 레이아웃으로 공간 확보 */}
            <div className="flex-1 h-8 min-w-[60px]">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 32"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id={`compact-${gradientId}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={valueColor}
                      stopOpacity="0.6"
                    />
                    <stop
                      offset="100%"
                      stopColor={valueColor}
                      stopOpacity="0.1"
                    />
                  </linearGradient>
                </defs>
                {/* 영역 채우기 */}
                <polygon
                  fill={`url(#compact-${gradientId})`}
                  points={`0,32 ${data.map((v, i) => `${(i / (data.length - 1)) * 100},${32 - (v / 100) * 32}`).join(' ')} 100,32`}
                />
                {/* 라인 */}
                <polyline
                  fill="none"
                  stroke={valueColor}
                  strokeWidth="2"
                  points={data
                    .map(
                      (v, i) =>
                        `${(i / (data.length - 1)) * 100},${32 - (v / 100) * 32}`
                    )
                    .join(' ')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* 수치 */}
            <motion.span
              className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                currentValue > 80
                  ? 'bg-red-100/80 text-red-700'
                  : currentValue > 70
                    ? 'bg-yellow-100/80 text-yellow-700'
                    : 'bg-gray-100/80 text-gray-700'
              }`}
              animate={{
                scale: currentValue > 80 ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: currentValue > 80 ? Infinity : 0,
              }}
            >
              {currentValue.toFixed(0)}%
            </motion.span>
          </motion.div>
        );
      }

      return (
        <motion.div
          className="flex flex-col bg-white/90 rounded-xl p-3 group hover:bg-white/95 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm border border-white/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* 라벨과 아이콘 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="text-gray-600 group-hover:scale-110 transition-transform p-1 rounded-lg bg-gray-50/80"
                whileHover={{ rotate: 5 }}
              >
                {icon}
              </motion.div>
              <span className="text-xs font-semibold text-gray-700 tracking-wide whitespace-nowrap">
                {label}
              </span>
            </div>
            {/* 수치 표시 - 개선된 디자인 */}
            <motion.span
              className={`text-sm font-bold px-2 py-1 rounded-lg ${
                currentValue > 80
                  ? 'bg-red-100/80 text-red-700'
                  : currentValue > 70
                    ? 'bg-yellow-100/80 text-yellow-700'
                    : 'bg-gray-100/80 text-gray-700'
              }`}
              animate={{
                scale: currentValue > 80 ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: currentValue > 80 ? Infinity : 0,
              }}
            >
              {currentValue.toFixed(0)}%
            </motion.span>
          </div>

          {/* 차트 */}
          <div
            className={`${variantStyles.chartSize} relative bg-linear-to-br from-white/60 to-gray-50/40 rounded-xl p-3 shadow-inner border border-gray-100/50`}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* 개선된 그라데이션 */}
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={valueColor} stopOpacity="0.9" />
                  <stop offset="40%" stopColor={valueColor} stopOpacity="0.5" />
                  <stop
                    offset="100%"
                    stopColor={valueColor}
                    stopOpacity="0.1"
                  />
                </linearGradient>

                {/* 개선된 글로우 효과 */}
                <filter id={glowId}>
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* 미세한 격자 패턴 */}
                <pattern
                  id={`grid-${server.id}-${label}`}
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 8 0 L 0 0 0 8"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="0.2"
                    opacity="0.4"
                  />
                </pattern>
              </defs>

              {/* 배경 격자 */}
              <rect
                width="100"
                height="100"
                fill={`url(#grid-${server.id}-${label})`}
                opacity="0.3"
              />

              {/* 영역 채우기 */}
              <polygon
                fill={`url(#${gradientId})`}
                points={`0,100 ${points} 100,100`}
                className="transition-all duration-500"
              />

              {/* 라인 - 더 부드러운 스타일 */}
              <polyline
                fill="none"
                stroke={valueColor}
                strokeWidth="2.5"
                points={points}
                vectorEffect="non-scaling-stroke"
                filter={`url(#${glowId})`}
                className="transition-all duration-500"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 현재 값 포인트 - 개선된 디자인 */}
              <circle
                cx="100"
                cy={100 - Math.max(0, Math.min(100, currentValue))}
                r="3"
                fill={valueColor}
                stroke="white"
                strokeWidth="2"
                filter={`url(#${glowId})`}
                className="drop-shadow-sm"
              />
            </svg>

            {/* 위험 상태 표시 - 개선된 디자인 */}
            {currentValue > 80 && (
              <motion.div
                className="absolute top-1 right-1 bg-red-500/90 text-white text-xs px-1.5 py-0.5 rounded-full shadow-lg"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                ⚠️
              </motion.div>
            )}
          </div>
        </motion.div>
      );
    };

    // 네트워크 상태 아이콘 - 개선된 버전
    // ServerStatus: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown'
    const getNetworkStatusIcon = () => {
      const status = server.networkStatus || server.status;
      switch (status) {
        case 'online':
          return <Wifi className="w-4 h-4 text-emerald-500" />;
        case 'warning':
          return <Wifi className="w-4 h-4 text-amber-500" />;
        case 'critical':
          return <Wifi className="w-4 h-4 text-rose-500" />;
        case 'offline':
        case 'unknown':
          return <Wifi className="w-4 h-4 text-slate-400" />;
        case 'maintenance':
          return <Wifi className="w-4 h-4 text-indigo-500" />;
        default:
          return <Network className="w-4 h-4 text-slate-400" />;
      }
    };

    // 트렌드 아이콘 - 개선된 버전
    const getTrendIcon = () => {
      switch (realtimeData.trend) {
        case 'up':
          return <TrendingUp className="w-3 h-3 text-rose-500" />;
        case 'down':
          return <TrendingDown className="w-3 h-3 text-emerald-500" />;
        default:
          return <Minus className="w-3 h-3 text-slate-400" />;
      }
    };

    const handleCardClick = useCallback(() => {
      if (onClick) {
        onClick(server);
      }
    }, [onClick, server]);

    // 알림 수 계산
    const alertCount =
      server.alertsSummary?.total ??
      (typeof server.alerts === 'number'
        ? server.alerts
        : server.alerts?.length || 0);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          duration: 0.4,
          delay: index * 0.08,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{
          scale: variant === 'compact' ? 1.015 : 1.025,
          y: -2,
          transition: { duration: 0.2 },
        }}
        whileTap={{
          scale: variant === 'compact' ? 0.995 : 0.985,
          transition: { duration: 0.1 },
        }}
        className={`
        relative ${variantStyles.padding} ${variantStyles.cardHeight} rounded-2xl cursor-pointer
        bg-linear-to-br ${theme.gradient}
        border-2 ${theme.border} ${theme.hoverBorder}
        shadow-lg ${theme.glow} hover:shadow-2xl
        transition-all duration-300 ease-out
        backdrop-blur-lg
        group overflow-hidden
      `}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
      >
        {/* 배경 오버레이 효과 */}
        <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />

        {/* 실시간 활동 인디케이터 - 개선된 디자인 */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-2.5 h-2.5 ${theme.pulse} rounded-full shadow-lg`}
          />
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm"
          >
            {getTrendIcon()}
            {getNetworkStatusIcon()}
          </motion.div>
        </div>

        {/* 헤더 - 개선된 레이아웃 */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <motion.div
              className={`p-3 rounded-xl ${theme.iconBg} ${theme.accent} shadow-sm border border-white/30`}
              whileHover={{
                rotate: [0, -5, 5, 0],
                scale: 1.05,
              }}
              transition={{ duration: 0.3 }}
            >
              {getServerIcon()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-bold text-gray-900 ${variantStyles.titleSize} group-hover:text-gray-700 transition-colors flex items-center gap-2 mb-1`}
              >
                <span className="truncate">{server.name}</span>
                {server.health?.score !== undefined && (
                  <motion.span
                    className="text-xs font-semibold text-gray-600 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm shadow-sm border border-gray-200/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    {Math.round(server.health.score)}/100
                  </motion.span>
                )}
              </h3>
              <p className="text-sm text-gray-600 font-medium mb-1">
                {server.type || 'Server'} • {server.location}
              </p>
              {server.specs?.network_speed && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span className="font-medium">
                    {server.specs.network_speed}
                  </span>
                </p>
              )}
            </div>
          </div>

          <motion.div
            className={`px-4 py-2 rounded-full ${theme.statusBg} flex items-center gap-2 shadow-sm border border-white/30 backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">{theme.statusIcon}</span>
            <span
              className={`text-xs font-bold ${theme.statusText} tracking-wide`}
            >
              {theme.label}
            </span>
          </motion.div>
        </div>

        {/* 메트릭 및 미니 차트 - 개선된 레이아웃 */}
        <div className="space-y-5">
          {showMiniCharts && (
            <div
              className={`grid ${variantStyles.chartContainer} bg-white/60 rounded-2xl ${variant === 'compact' ? 'p-3' : 'p-5'} backdrop-blur-sm border border-white/40 shadow-inner`}
            >
              <MiniChart
                data={realtimeData.cpu}
                color="#ef4444"
                label="CPU"
                icon={<Cpu className="w-3 h-3" />}
              />
              <MiniChart
                data={realtimeData.memory}
                color="#3b82f6"
                label="MEM"
                icon={<Activity className="w-3 h-3" />}
              />
              <MiniChart
                data={realtimeData.disk}
                color="#8b5cf6"
                label="DISK"
                icon={<HardDrive className="w-3 h-3" />}
              />
              <MiniChart
                data={realtimeData.network}
                color="#10b981"
                label="NET"
                icon={<Network className="w-3 h-3" />}
              />
            </div>
          )}

          {/* 서비스 상태 - 개선된 디자인 */}
          {variant !== 'compact' &&
            server.services &&
            server.services.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {server.services.slice(0, 3).map((service, idx) => (
                  <motion.div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-sm border transition-all duration-200 ${
                      service.status === 'running'
                        ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50'
                        : 'bg-rose-100/80 text-rose-700 border-rose-200/50'
                    }`}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        service.status === 'running'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                      animate={{
                        scale: service.status === 'running' ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: service.status === 'running' ? Infinity : 0,
                      }}
                    />
                    {service.name}
                  </motion.div>
                ))}
                {server.services.length > 3 && (
                  <motion.div
                    className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100/80 rounded-xl border border-gray-200/50 font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    +{server.services.length - 3}개 더
                  </motion.div>
                )}
              </div>
            )}

          {/* 네트워크 상태 표시 - 개선된 디자인 */}
          {variant !== 'compact' && server.networkStatus && (
            <motion.div
              className="flex items-center justify-between p-3 bg-white/70 rounded-xl backdrop-blur-sm border border-white/40 shadow-sm"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="p-1.5 rounded-lg bg-gray-100/80"
                >
                  {getNetworkStatusIcon()}
                </motion.div>
                <span className="text-sm font-semibold text-gray-700">
                  네트워크 상태
                </span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm border ${
                  server.networkStatus === 'online'
                    ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50'
                    : server.networkStatus === 'warning'
                      ? 'bg-amber-100/80 text-amber-700 border-amber-200/50'
                      : server.networkStatus === 'critical'
                        ? 'bg-rose-100/80 text-rose-700 border-rose-200/50'
                        : server.networkStatus === 'offline'
                          ? 'bg-slate-100/80 text-slate-700 border-slate-200/50'
                          : 'bg-indigo-100/80 text-indigo-700 border-indigo-200/50'
                }`}
              >
                {server.networkStatus === 'online'
                  ? '정상'
                  : server.networkStatus === 'warning'
                    ? '경고'
                    : server.networkStatus === 'critical'
                      ? '위험'
                      : server.networkStatus === 'offline'
                        ? '오프라인'
                        : '유지보수'}
              </span>
            </motion.div>
          )}

          {/* 알림 - 개선된 디자인 */}
          {alertCount > 0 && (
            <motion.div
              className="flex items-center gap-3 p-3 bg-rose-50/80 text-rose-700 rounded-xl text-sm font-medium border border-rose-200/50 shadow-sm backdrop-blur-sm"
              whileHover={{ scale: 1.02, x: 2 }}
              animate={{
                boxShadow: [
                  '0 4px 6px -1px rgba(244, 63, 94, 0.1)',
                  '0 10px 15px -3px rgba(244, 63, 94, 0.2)',
                  '0 4px 6px -1px rgba(244, 63, 94, 0.1)',
                ],
              }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-5 h-5" />
              </motion.div>
              <span className="font-bold">{alertCount}개 알림</span>
            </motion.div>
          )}

          {/* 추가 정보 (호버 시 표시) - 개선된 디자인 */}
          <AnimatePresence>
            {isHovered && variant !== 'compact' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3 pt-4 border-t border-gray-200/50"
              >
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                    <span className="text-gray-600 font-medium">업타임:</span>
                    <span className="font-bold text-gray-800">
                      {server.uptime}
                    </span>
                  </div>
                  {server.ip && (
                    <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                      <span className="text-gray-600 font-medium">IP:</span>
                      <span className="font-mono font-bold text-gray-800">
                        {server.ip}
                      </span>
                    </div>
                  )}
                  {server.os && (
                    <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                      <span className="text-gray-600 font-medium">OS:</span>
                      <span className="font-bold text-gray-800">
                        {server.os}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
                    <span className="text-gray-600 font-medium">업데이트:</span>
                    <span className="font-bold text-gray-800">
                      {server.lastUpdate
                        ? new Date(server.lastUpdate).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 클릭 효과 오버레이 */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-blue-500 rounded-2xl pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

EnhancedServerCard.displayName = 'EnhancedServerCard';

export default EnhancedServerCard;
