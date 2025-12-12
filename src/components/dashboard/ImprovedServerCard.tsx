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
import type {
  ServerStatus,
  Server as ServerType,
  Service,
} from '../../types/server';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { AIInsightBadge } from '../shared/AIInsightBadge';
import { ServerMetricsChart } from '../shared/ServerMetricsChart';
import { ServerStatusIndicator } from '../shared/ServerStatusIndicator';
import { Sparkline } from '../shared/Sparkline';

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
    // Basic data preparation using standard hooks
    const { safeServer, statusTheme, serverIcon, osIcon } =
      useSafeServer(server);

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
    const { currentMetrics, historyData } = useFixed24hMetrics(
      safeServer.id,
      60000
    );

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
        className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${statusTheme.cardBg} ${statusTheme.cardBorder} ${variantStyles.container}`}
      >
        {/* Live Indicator */}
        {showRealTimeUpdates && (
          <div
            className="absolute right-3 top-3 z-10 h-2 w-2 animate-pulse rounded-full"
            style={statusTheme.pulse}
          />
        )}

        {/* Header */}
        <header className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="rounded-lg p-2.5 shadow-sm"
              style={statusTheme.statusColor}
            >
              {serverIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className="truncate text-lg font-semibold"
                  style={{ color: statusTheme.cardStyle.color }}
                >
                  {safeServer.name}
                </h3>
                {osIcon && <span className="text-base">{osIcon}</span>}
              </div>
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={statusTheme.accent}
              >
                <MapPin className="h-3 w-3" />
                <span>{safeServer.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ServerStatusIndicator
              status={safeServer.status}
              size="md"
              showText
            />
            {enableProgressiveDisclosure && (
              <button
                onClick={toggleExpansion}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
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
        <section className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-red-500" />
                <span className="text-xs font-semibold uppercase text-gray-700">
                  Core Metrics
                </span>
              </div>
              <AIInsightBadge {...realtimeMetrics} historyData={historyData} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <MetricItem
                type="cpu"
                value={realtimeMetrics.cpu}
                status={safeServer.status}
                history={historyData?.map((h) => h.cpu)}
                color={statusTheme.accent.color}
              />
              <MetricItem
                type="memory"
                value={realtimeMetrics.memory}
                status={safeServer.status}
                history={historyData?.map((h) => h.memory)}
                color={statusTheme.accent.color}
              />
            </div>
          </div>

          {/* Secondary & Details (conditionally rendered via CSS height transition) */}
          <div
            className={`space-y-3 overflow-hidden transition-all duration-300 ${showSecondaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="flex items-center gap-2">
              <HardDrive className="h-3 w-3 text-blue-400" />
              <span className="text-xs font-medium uppercase text-gray-600">
                Secondary
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-center">
                <ServerMetricsChart
                  type="disk"
                  value={realtimeMetrics.disk}
                  status={safeServer.status}
                  size="md"
                  showLabel
                />
              </div>
              <div className="flex justify-center">
                <ServerMetricsChart
                  type="network"
                  value={realtimeMetrics.network}
                  status={safeServer.status}
                  size="md"
                  showLabel
                />
              </div>
            </div>
          </div>

          <div
            className={`space-y-4 overflow-hidden transition-all duration-500 ${showTertiaryInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-200/50">
              <DetailRow
                icon={<Globe className="h-4 w-4" />}
                label="OS"
                value={safeServer.os}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Uptime"
                value={safeServer.uptime}
              />
              <DetailRow
                icon={<Zap className="h-4 w-4" />}
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
              className={`mt-4 flex flex-wrap gap-2 transition-all duration-300 ${showSecondaryInfo || !enableProgressiveDisclosure ? 'opacity-100' : 'opacity-0'}`}
            >
              {safeServer.services
                .slice(0, variantStyles.maxServices)
                .map((s, i) => (
                  <ServiceChip key={i} service={s} />
                ))}
              {safeServer.services.length > variantStyles.maxServices && (
                <span className="px-2 py-1 text-xs text-gray-500">
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
  status,
  history,
  color,
}: MetricItemProps) => (
  <div className="flex flex-col items-center">
    <ServerMetricsChart
      type={type}
      value={value}
      status={status}
      size="md"
      showLabel
    />
    <div className="mt-2 h-8 w-full opacity-70">
      <Sparkline
        data={history || []}
        width={80}
        height={20}
        color={color}
        fill
      />
    </div>
  </div>
);

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => (
  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
    <div className="text-gray-500">{icon}</div>
    <div>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="font-medium text-gray-700">{value}</div>
    </div>
  </div>
);

const ServiceChip = ({ service }: { service: Service }) => (
  <div
    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
      service.status === 'running'
        ? 'border-green-300 bg-green-50 text-green-700'
        : service.status === 'stopped'
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-yellow-300 bg-yellow-50 text-yellow-700'
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${service.status === 'running' ? 'bg-green-500' : service.status === 'stopped' ? 'bg-gray-400' : 'bg-yellow-500'}`}
    />
    <span>{service.name}</span>
  </div>
);

ImprovedServerCardInner.displayName = 'ImprovedServerCardInner';

const ImprovedServerCard: FC<ImprovedServerCardProps> = (props) => (
  <ServerCardErrorBoundary>
    <ImprovedServerCardInner {...props} />
  </ServerCardErrorBoundary>
);

export default ImprovedServerCard;
