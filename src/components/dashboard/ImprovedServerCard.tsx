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
import { getServerStatusTheme } from '../../styles/design-constants';
import type {
  ServerStatus,
  Server as ServerType,
  Service,
} from '../../types/server';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { AIInsightBadge } from '../shared/AIInsightBadge';
import { MiniLineChart } from '../shared/MiniLineChart';

/**
 * 🎨 White Mode Glassmorphism Server Card
 * - 반투명 유리 효과 (backdrop-blur)
 * - 상태별 색상: Critical(빨강), Warning(주황), Healthy(녹색)
 * - 카드 크기 50% 축소 (2025-12-13)
 */

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
    const { safeServer, serverIcon, serverTypeLabel, osIcon, osShortName } =
      useSafeServer(server);
    // 🎨 White Mode with Glassmorphism + Status Colors
    const statusTheme = getServerStatusTheme(safeServer.status);

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

    // UI Variants - 50% 축소된 크기
    const variantStyles = useMemo(() => {
      const styles = {
        compact: {
          container: 'min-h-[150px] p-2',
          maxServices: 2,
          showDetails: false,
          showServices: false,
        },
        detailed: {
          container: 'min-h-[190px] p-3',
          maxServices: 4,
          showDetails: true,
          showServices: true,
        },
        standard: {
          container: 'min-h-[170px] p-2.5',
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
      <button
        type="button"
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
        className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md text-left ${statusTheme.background} ${statusTheme.border} ${variantStyles.container}`}
      >
        {/* Subtle Hover Glow Effect (Light Mode) */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30 pointer-events-none rounded-xl"
          style={{ backgroundColor: statusTheme.graphColor }}
        />
        {/* Live Indicator - Minimal Pulse Only */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10">
            <span
              className={`block h-2 w-2 rounded-full animate-pulse ring-2 ring-white ${statusTheme.text.replace('text-', 'bg-')}`}
            />
          </div>
        )}
        {/* Header - OS/타입 정보 추가 */}
        <header className="mb-2 flex items-start justify-between relative z-10">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`rounded-lg p-1.5 shadow-md backdrop-blur-sm transition-colors duration-300 bg-black/5 group-hover:bg-black/10 ${statusTheme.text}`}
            >
              {serverIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {safeServer.name}
                </h3>
              </div>
              {/* 서버 타입 + OS 정보 표시 (WCAG AA Color Contrast) */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[11px] font-medium text-white"
                  title={`서버 타입: ${serverTypeLabel}`}
                >
                  {serverTypeLabel}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-gray-700"
                  title={`운영체제: ${osShortName}`}
                >
                  <span aria-hidden="true">{osIcon}</span>
                  <span className="text-[11px] font-medium">{osShortName}</span>
                </span>
              </div>
              {/* 위치 정보 */}
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{safeServer.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pt-4">
            {enableProgressiveDisclosure && (
              <button
                onClick={toggleExpansion}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showTertiaryInfo ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </header>
        {/* Main Content Section */}
        <section className="relative z-10">
          {/* Metrics - 가독성 개선 (Clean Layout) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              {/* Remove 'Core Metrics' label to reduce noise */}
              <div />
              <AIInsightBadge {...realtimeMetrics} historyData={historyData} />
            </div>

            <div className="grid grid-cols-2 gap-4 px-1">
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

          {/* Secondary & Details */}
          <div
            className={`space-y-1.5 overflow-hidden transition-all duration-300 ${showSecondaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="flex items-center gap-1 pt-1">
              <HardDrive className="h-3 w-3 text-gray-500" />
              <span className="text-[11px] font-medium uppercase text-gray-500 tracking-wide">
                Storage & Network
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
            className={`space-y-2 overflow-hidden transition-all duration-500 ${showTertiaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200">
              <DetailRow
                icon={<Globe className="h-3 w-3" />}
                label="OS"
                value={safeServer.os}
              />
              <DetailRow
                icon={<Clock className="h-3 w-3" />}
                label="Uptime"
                value={safeServer.uptime}
              />
              <DetailRow
                icon={<Zap className="h-3 w-3" />}
                label="IP"
                value={safeServer.ip}
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        {variantStyles.showServices &&
          safeServer.services?.length > 0 &&
          (showSecondaryInfo || !enableProgressiveDisclosure) && (
            <div
              className={`mt-2 flex flex-wrap gap-1 transition-all duration-300 relative z-10 ${showSecondaryInfo || !enableProgressiveDisclosure ? 'opacity-100' : 'opacity-0'}`}
            >
              {safeServer.services
                .slice(0, variantStyles.maxServices)
                .map((s, i) => (
                  <ServiceChip key={i} service={s} />
                ))}
              {safeServer.services.length > variantStyles.maxServices && (
                <span className="px-1.5 py-0.5 text-[10px] text-gray-500">
                  +{safeServer.services.length - variantStyles.maxServices}
                </span>
              )}
            </div>
          )}
      </button>
    );
  }
);

// Helper Components - 축소된 스타일
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
  status: _status,
  history,
  color: _themeColor,
}: MetricItemProps) => {
  // 가독성 향상: 축약어 → 전체 이름
  const labels = {
    cpu: 'CPU',
    memory: 'Memory',
    disk: 'Disk',
    network: 'Network',
  };

  // 🎨 Per-Metric Severity Coloring (User Request)
  // Red (>90), Orange (>80), Green (else)
  const getSeverityColor = (val: number) => {
    if (val >= 90) return '#ef4444'; // Red-500
    if (val >= 80) return '#f97316'; // Orange-500
    return '#10b981'; // Emerald-500
  };

  const metricColor = getSeverityColor(value);

  return (
    <div className="flex flex-col">
      {/* Header: Label + Value */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-gray-500 tracking-wide">
          {labels[type]}
        </span>
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: metricColor }}
        >
          {Math.round(value)}%
        </span>
      </div>
      {/* Primary: Line Chart */}
      <div className="w-full h-10 flex items-center justify-center">
        <MiniLineChart
          data={history && history.length > 1 ? history : [value, value]}
          width={120}
          height={32}
          color={metricColor} // Apply severity color to graph
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
  <div className="flex items-center gap-1.5 rounded-md bg-black/5 px-2 py-1.5 border border-gray-200/50">
    <div className="text-gray-500">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase text-gray-500 font-semibold tracking-wide">
        {label}
      </div>
      <div className="font-medium text-gray-700 truncate text-xs">{value}</div>
    </div>
  </div>
);

const ServiceChip = ({ service }: { service: Service }) => {
  const statusColors =
    service.status === 'running'
      ? 'border-emerald-400/50 bg-emerald-100/80 text-emerald-700'
      : service.status === 'stopped'
        ? 'border-red-400/50 bg-red-100/80 text-red-700'
        : 'border-amber-400/50 bg-amber-100/80 text-amber-700';

  const dotColor =
    service.status === 'running'
      ? 'bg-emerald-500'
      : service.status === 'stopped'
        ? 'bg-red-500'
        : 'bg-amber-500';

  return (
    <div
      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${statusColors}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
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
