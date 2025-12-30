/**
 * 🌟 Enhanced Server Card v5.1 - 리팩토링 버전
 *
 * 고도화된 서버 카드 컴포넌트:
 * - 🎨 모던한 디자인 시스템 적용
 * - ✨ 부드러운 마이크로 인터랙션
 * - 📊 개선된 실시간 미니 차트
 * - 🎭 상태별 시각적 피드백 강화
 * - 🌈 개선된 색상 팔레트 및 대비
 * - 🔥 성능 최적화된 애니메이션
 *
 * @refactored 2025-12-30 - 컴포넌트 분리로 992줄 → ~600줄 감소
 * - MiniChart → cards/MiniChart.tsx
 * - getServerIcon → utils/server-icons.tsx
 * - getStatusTheme → utils/status-theme.ts
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Globe,
  HardDrive,
  Minus,
  Network,
  TrendingDown,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useFixed24hMetrics } from '@/hooks/useFixed24hMetrics';
import type { Server as ServerType } from '@/types/server';
import { MiniChart } from './cards/MiniChart';
import { getServerIcon } from './utils/server-icons';
import { getStatusTheme } from './utils/status-theme';

export interface EnhancedServerCardProps {
  server: ServerType;
  index: number;
  onClick?: (server: ServerType) => void;
  showMiniCharts?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const EnhancedServerCard: React.FC<EnhancedServerCardProps> = memo(
  ({ server, index, onClick, showMiniCharts = true, variant = 'default' }) => {
    // 🎯 실제 24시간 메트릭 데이터 사용 (5분 간격 업데이트)
    const { historyData, currentMetrics } = useFixed24hMetrics(
      server.id,
      300000 // 5분 간격 (데이터 갱신 주기와 일치)
    );

    // UI 상태
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    // 📊 히스토리 데이터를 차트용 배열로 변환 (최근 12개 = 1시간 분량)
    const realtimeData = useMemo(() => {
      // 히스토리 데이터가 있으면 사용, 없으면 서버 기본값 사용
      const dataPoints = historyData.length > 0 ? historyData : [];
      const recentData = dataPoints.slice(-12); // 최근 12개 (1시간)

      // 데이터가 부족하면 현재 값으로 채움
      const fillData = (arr: number[], currentVal: number) => {
        if (arr.length >= 12) return arr.slice(-12);
        const fillCount = 12 - arr.length;
        const filler = Array(fillCount).fill(currentVal);
        return [...filler, ...arr];
      };

      const cpuData = recentData.map((d) => d.cpu);
      const memoryData = recentData.map((d) => d.memory);
      const diskData = recentData.map((d) => d.disk);
      const networkData = recentData.map((d) => d.network);

      // 트렌드 계산: 최근 3개 평균 vs 이전 3개 평균
      const calcTrend = (data: number[]): 'up' | 'down' | 'stable' => {
        if (data.length < 6) return 'stable';
        const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const prev = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
        const diff = recent - prev;
        if (diff > 5) return 'up';
        if (diff < -5) return 'down';
        return 'stable';
      };

      return {
        cpu: fillData(cpuData, currentMetrics?.cpu ?? server.cpu),
        memory: fillData(memoryData, currentMetrics?.memory ?? server.memory),
        disk: fillData(diskData, currentMetrics?.disk ?? server.disk),
        network: fillData(
          networkData,
          currentMetrics?.network ?? server.network ?? 30
        ),
        trend: calcTrend(cpuData),
      };
    }, [historyData, currentMetrics, server]);

    // 🎨 상태별 테마 (utils/status-theme.ts에서 import)
    const theme = getStatusTheme(server.status);

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
        role="article"
        aria-label={`${server.name} 서버 - 상태: ${theme.label}, CPU: ${Math.round(currentMetrics?.cpu ?? server.cpu)}%, 메모리: ${Math.round(currentMetrics?.memory ?? server.memory)}%`}
        tabIndex={0}
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
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
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
              {getServerIcon(server.type)}
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
                color="#10b981"
                label="CPU"
                icon={<Cpu className="w-3 h-3" />}
                serverId={server.id}
                index={index}
                isCompact={variantStyles.useCompactLabels}
                chartSize={variantStyles.chartSize}
              />
              <MiniChart
                data={realtimeData.memory}
                color="#10b981"
                label="MEM"
                icon={<Activity className="w-3 h-3" />}
                serverId={server.id}
                index={index}
                isCompact={variantStyles.useCompactLabels}
                chartSize={variantStyles.chartSize}
              />
              <MiniChart
                data={realtimeData.disk}
                color="#10b981"
                label="DISK"
                icon={<HardDrive className="w-3 h-3" />}
                serverId={server.id}
                index={index}
                isCompact={variantStyles.useCompactLabels}
                chartSize={variantStyles.chartSize}
              />
              <MiniChart
                data={realtimeData.network}
                color="#10b981"
                label="NET"
                icon={<Network className="w-3 h-3" />}
                serverId={server.id}
                index={index}
                isCompact={variantStyles.useCompactLabels}
                chartSize={variantStyles.chartSize}
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

          {/* 알림 - 개선된 디자인 + 접근성 */}
          {alertCount > 0 && (
            <motion.div
              role="alert"
              aria-label={`${server.name} 서버에 ${alertCount}개의 알림이 있습니다`}
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
                aria-hidden="true"
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
