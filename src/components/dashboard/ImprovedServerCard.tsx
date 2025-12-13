import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  HardDrive,
  MapPin,
  Zap,
} from 'lucide-react';
import React, {
  type FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFixed24hMetrics } from '../../hooks/useFixed24hMetrics';
import { useSafeServer } from '../../hooks/useSafeServer';
import {
  DARK_CARD_STYLES,
  getDarkServerStatusTheme,
} from '../../styles/design-constants';
import type {
  ServerStatus,
  Server as ServerType,
  Service,
} from '../../types/server';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { AIInsightBadge } from '../shared/AIInsightBadge';
import { MiniLineChart } from '../shared/MiniLineChart';
// ServerMetricsChart 제거 - 라인 차트로 통합 (2025-12-13)

export interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
  enableProgressiveDisclosure?: boolean;
}

const ImprovedServerCardInner: FC<ImprovedServerCardProps> = memo(
  ({
    server,
    onClick,
    variant = 'standard',
    showRealTimeUpdates = true,
    enableProgressiveDisclosure = true,
  }) => {
    // Basic data preparation
    const { safeServer, serverIcon, osIcon } = useSafeServer(server);
    // Use Dark Theme
    const statusTheme = getDarkServerStatusTheme(safeServer.status);

    const [_isHovered, setIsHovered] = useState(false);
    const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);
    const [showTertiaryInfo, setShowTertiaryInfo] = useState(false);

    // Mount tracking
    const isMountedRef = useRef(true);
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // Metric data
    const { currentMetrics, historyData } = useFixed24hMetrics(safeServer.id);

    const realtimeMetrics = useMemo(
      () => ({
        cpu: currentMetrics?.cpu ?? safeServer.cpu ?? 0,
        memory: currentMetrics?.memory ?? safeServer.memory ?? 0,
        disk: currentMetrics?.disk ?? safeServer.disk ?? 0,
        network: currentMetrics?.network ?? safeServer.network ?? 0,
      }),
      [currentMetrics, safeServer]
    );

    // UI Variants
    const variantStyles = useMemo(() => {
      const styles = {
        compact: {
          container: 'min-h-[300px] p-4',
          maxServices: 2,
          showDetails: false,
          showServices: false,
        },
        detailed: {
          container: 'min-h-[380px] p-6',
          maxServices: 4,
          showDetails: true,
          showServices: true,
        },
        standard: {
          container: 'min-h-[340px] p-5',
          maxServices: 3,
          showDetails: true,
          showServices: true,
        },
      };
      return styles[variant] || styles.standard;
    }, [variant]);

    // Interactions
    const toggleExpansion = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTertiaryInfo((prev) => !prev);
        if (!showTertiaryInfo) setShowSecondaryInfo(true);
      },
      [showTertiaryInfo]
    );

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onClick(safeServer)}
        onMouseEnter={() => {
          setIsHovered(true);
          if (enableProgressiveDisclosure) setShowSecondaryInfo(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (enableProgressiveDisclosure && !showTertiaryInfo)
            setShowSecondaryInfo(false);
        }}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && onClick(safeServer)
        }
        className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md ${statusTheme.background} ${statusTheme.border} ${variantStyles.container}`}
      >
        {/* Glow Effect */}
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${statusTheme.glow}`}
        />

        {/* Live Indicator */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${statusTheme.text.replace('text-', 'bg-')}`}
            />
            <span className={`text-xs font-medium ${statusTheme.text}`}>
              Live
            </span>
          </div>
        )}

        {/* Header */}
        <header className="mb-4 flex items-start justify-between relative z-10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`rounded-xl p-2.5 shadow-lg backdrop-blur-sm transition-colors duration-300 bg-white/5 group-hover:bg-white/10 ${statusTheme.text}`}
            >
              {serverIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`truncate text-lg font-semibold ${DARK_CARD_STYLES.textPrimary}`}
                >
                  {safeServer.name}
                </h3>
                {osIcon && (
                  <span className={`${DARK_CARD_STYLES.textTertiary}`}>
                    {osIcon}
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${DARK_CARD_STYLES.textSecondary}`}
              >
                <MapPin className="h-3 w-3" />
                <span>{safeServer.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-8">
            {enableProgressiveDisclosure && (
              <button
                onClick={toggleExpansion}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                {showTertiaryInfo ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </header>

        {/* Metrics */}
        <section className="space-y-4 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-white/40" />
                <span className="text-xs font-semibold uppercase text-white/40 tracking-wider">
                  Core Metrics
                </span>
              </div>
              <AIInsightBadge {...realtimeMetrics} historyData={historyData} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricItem
                type="cpu"
                value={realtimeMetrics.cpu}
                status={safeServer.status}
                history={historyData?.map((h) => h.cpu)}
                color={statusTheme.graphColor}
              />
              <MetricItem
                type="memory"
                value={realtimeMetrics.memory}
                status={safeServer.status}
                history={historyData?.map((h) => h.memory)}
                color={statusTheme.graphColor}
              />
            </div>
          </div>

          {/* Secondary & Details (conditionally rendered via CSS height transition) */}
          <div
            className={`space-y-3 overflow-hidden transition-all duration-300 ${showSecondaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="flex items-center gap-2 pt-2">
              <HardDrive className="h-3 w-3 text-white/40" />
              <span className="text-xs font-medium uppercase text-white/40 tracking-wider">
                Secondary
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricItem
                type="disk"
                value={realtimeMetrics.disk}
                status={safeServer.status}
                history={historyData?.map((h) => h.disk)}
                color={statusTheme.graphColor}
              />
              <MetricItem
                type="network"
                value={realtimeMetrics.network}
                status={safeServer.status}
                history={historyData?.map((h) => h.network)}
                color={statusTheme.graphColor}
              />
            </div>
          </div>

          <div
            className={`space-y-4 overflow-hidden transition-all duration-500 ${showTertiaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t border-white/10">
              <DetailRow
                icon={<Globe className="h-3.5 w-3.5" />}
                label="OS"
                value={safeServer.os}
              />
              <DetailRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Uptime"
                value={safeServer.uptime}
              />
              <DetailRow
                icon={<Zap className="h-3.5 w-3.5" />}
                label="IP"
                value={safeServer.ip}
              />
            </div>
          </div>
        </section>

        {/* Services */}
        {variantStyles.showServices &&
          safeServer.services?.length > 0 &&
          (showSecondaryInfo || !enableProgressiveDisclosure) && (
            <div
              className={`mt-4 flex flex-wrap gap-2 transition-all duration-300 relative z-10 ${showSecondaryInfo || !enableProgressiveDisclosure ? 'opacity-100' : 'opacity-0'}`}
            >
              {safeServer.services
                .slice(0, variantStyles.maxServices)
                .map((s, i) => (
                  <ServiceChip key={i} service={s} />
                ))}
              {safeServer.services.length > variantStyles.maxServices && (
                <span className="px-2 py-1 text-xs text-white/40">
                  +{safeServer.services.length - variantStyles.maxServices}
                </span>
              )}
            </div>
          )}
      </div>
    );
  }
);

// Helper Components for cleanliness
interface MetricItemProps {
  type: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  status: ServerStatus;
  history?: number[];
  color: string;
}

const MetricItem = ({
  type,
  value,
  status: _status, // 향후 상태별 스타일링용 예약
  history,
  color,
}: MetricItemProps) => {
  const labels = {
    cpu: 'CPU',
    memory: 'MEM',
    disk: 'DISK',
    network: 'NET',
  };

  return (
    <div className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
      {/* Header: Label + Value */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase text-white/50 font-semibold tracking-wider">
          {labels[type]}
        </span>
        <span className="text-lg font-bold" style={{ color }}>
          {Math.round(value)}%
        </span>
      </div>
      {/* Primary: Line Chart */}
      <div className="w-full h-12 flex items-center justify-center">
        <MiniLineChart
          data={history && history.length > 0 ? history : [value, value]}
          width={120}
          height={40}
          color={color}
          fill
          strokeWidth={2}
        />
      </div>
    </div>
  );
};

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => (
  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 border border-white/5">
    <div className="text-white/40">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase text-white/40 font-semibold tracking-wider">
        {label}
      </div>
      <div className="font-medium text-white/80 truncate text-xs">{value}</div>
    </div>
  </div>
);

const ServiceChip = ({ service }: { service: Service }) => {
  const statusColors =
    service.status === 'running'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : service.status === 'stopped'
        ? 'border-red-500/30 bg-red-500/10 text-red-400'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-400';

  const dotColor =
    service.status === 'running'
      ? 'bg-emerald-400'
      : service.status === 'stopped'
        ? 'bg-red-400'
        : 'bg-amber-400';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${statusColors}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shadow-sm`} />
      <span>{service.name}</span>
    </div>
  );
};

ImprovedServerCardInner.displayName = 'ImprovedServerCardInner';

const ImprovedServerCard: FC<ImprovedServerCardProps> = (props) => (
  <ServerCardErrorBoundary>
    <ImprovedServerCardInner {...props} />
  </ServerCardErrorBoundary>
);

export default ImprovedServerCard;
