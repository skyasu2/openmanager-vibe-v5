import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Server as ServerIcon,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type React from 'react';

interface DashboardStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
  critical: number; // 🚨 위험 상태
  unknown: number;
}

interface DashboardSummaryProps {
  stats: DashboardStats;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

// 🎨 상태별 그라데이션 설정 (ImprovedServerCard와 통일)
const statusGradients = {
  online: {
    gradient: 'from-emerald-500 via-green-500 to-emerald-600',
    border: 'border-emerald-200/50',
    bg: 'bg-emerald-50/30',
    text: 'text-emerald-600',
    glow: 'hover:shadow-emerald-200/50',
  },
  warning: {
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    border: 'border-amber-200/50',
    bg: 'bg-amber-50/30',
    text: 'text-amber-600',
    glow: 'hover:shadow-amber-200/50',
  },
  critical: {
    gradient: 'from-red-500 via-rose-500 to-red-600',
    border: 'border-rose-200/50',
    bg: 'bg-rose-50/30',
    text: 'text-rose-600',
    glow: 'hover:shadow-rose-200/50',
  },
  offline: {
    gradient: 'from-gray-500 via-slate-500 to-gray-600',
    border: 'border-slate-200/60',
    bg: 'bg-slate-50/50',
    text: 'text-slate-600',
    glow: 'hover:shadow-slate-200/50',
  },
  total: {
    gradient: 'from-blue-500 via-indigo-500 to-blue-600',
    border: 'border-blue-200/50',
    bg: 'bg-blue-50/30',
    text: 'text-blue-600',
    glow: 'hover:shadow-blue-200/50',
  },
};

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  stats,
  activeFilter,
  onFilterChange,
}) => {
  const handleFilterClick = (filter: string) => {
    if (!onFilterChange) return;
    onFilterChange(activeFilter === filter ? null : filter);
  };

  const handleFilterKeyDown = (e: React.KeyboardEvent, filter: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFilterClick(filter);
    }
  };
  // Null-safe 처리
  const safeStats = {
    total: stats?.total ?? 0,
    online: stats?.online ?? 0,
    offline: stats?.offline ?? 0,
    warning: stats?.warning ?? 0,
    critical: stats?.critical ?? 0,
    unknown: stats?.unknown ?? 0,
  };

  // 시스템 상태에 따른 그라데이션 결정
  const systemHealthGradient =
    safeStats.critical > 0
      ? statusGradients.critical
      : safeStats.warning > 0
        ? statusGradients.warning
        : statusGradients.online;

  // 위험/경고 상태일 때 펄스 활성화
  const showPulse = safeStats.critical > 0 || safeStats.warning > 0;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* 1. Total Servers - 그라데이션 강화 */}
      <div className="group relative flex flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] lg:col-span-2 overflow-hidden">
        {/* 그라데이션 배경 */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${statusGradients.total.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
            <ServerIcon size={14} className="text-blue-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              전체
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800 leading-none tracking-tight">
              {safeStats.total}
            </span>
          </div>
        </div>
        {/* 그라데이션 아이콘 박스 */}
        <div
          className={`relative h-10 w-10 rounded-full bg-linear-to-br ${statusGradients.total.gradient} flex items-center justify-center text-white shadow-md`}
        >
          <Activity size={18} />
        </div>
      </div>

      {/* 2. Status Cards - 애니메이션 및 그라데이션 강화 */}
      <div className="grid grid-cols-4 gap-3 lg:col-span-5">
        {/* 온라인 카드 */}
        <div
          {...(onFilterChange
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => handleFilterClick('online'),
                onKeyDown: (e: React.KeyboardEvent) =>
                  handleFilterKeyDown(e, 'online'),
              }
            : {})}
          className={`group relative overflow-hidden rounded-2xl ${statusGradients.online.border} bg-white/60 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusGradients.online.glow} ${onFilterChange ? 'cursor-pointer' : ''} ${activeFilter === 'online' ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
        >
          <div
            className={`absolute inset-0 bg-linear-to-br ${statusGradients.online.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
          />
          <div className="relative z-10 flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <CheckCircle2 size={13} className="text-emerald-500" /> 온라인
            </span>
            <span className="mt-2 text-2xl font-bold text-gray-800 tracking-tight">
              {safeStats.online}
            </span>
          </div>
        </div>

        {/* 경고 카드 */}
        <div
          {...(onFilterChange
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => handleFilterClick('warning'),
                onKeyDown: (e: React.KeyboardEvent) =>
                  handleFilterKeyDown(e, 'warning'),
              }
            : {})}
          className={`group relative overflow-hidden rounded-2xl ${statusGradients.warning.border} bg-white/60 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusGradients.warning.glow} ${onFilterChange ? 'cursor-pointer' : ''} ${activeFilter === 'warning' ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
        >
          <div
            className={`absolute inset-0 bg-linear-to-br ${statusGradients.warning.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
          />
          {/* 경고 펄스 효과 */}
          {safeStats.warning > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <div className="relative z-10 flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <AlertTriangle size={13} className="text-amber-500" /> 경고
            </span>
            <span
              className={`mt-2 text-2xl font-bold tracking-tight ${safeStats.warning > 0 ? 'text-amber-600' : 'text-gray-800'}`}
            >
              {safeStats.warning}
            </span>
          </div>
        </div>

        {/* 위험 카드 */}
        <div
          {...(onFilterChange
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => handleFilterClick('critical'),
                onKeyDown: (e: React.KeyboardEvent) =>
                  handleFilterKeyDown(e, 'critical'),
              }
            : {})}
          className={`group relative overflow-hidden rounded-2xl ${statusGradients.critical.border} bg-white/60 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusGradients.critical.glow} ${onFilterChange ? 'cursor-pointer' : ''} ${activeFilter === 'critical' ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
        >
          <div
            className={`absolute inset-0 bg-linear-to-br ${statusGradients.critical.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
          />
          {/* 위험 펄스 효과 - 더 강조 */}
          {safeStats.critical > 0 && (
            <>
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </>
          )}
          <div className="relative z-10 flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <AlertOctagon size={13} className="text-rose-500" /> 위험
            </span>
            <span
              className={`mt-2 text-2xl font-bold tracking-tight ${safeStats.critical > 0 ? 'text-rose-600' : 'text-gray-800'}`}
            >
              {safeStats.critical}
            </span>
          </div>
        </div>

        {/* 오프라인 카드 */}
        <div
          {...(onFilterChange
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => handleFilterClick('offline'),
                onKeyDown: (e: React.KeyboardEvent) =>
                  handleFilterKeyDown(e, 'offline'),
              }
            : {})}
          className={`group relative overflow-hidden rounded-2xl ${statusGradients.offline.border} bg-white/60 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusGradients.offline.glow} ${onFilterChange ? 'cursor-pointer' : ''} ${activeFilter === 'offline' ? 'ring-2 ring-slate-500 ring-offset-1' : ''}`}
        >
          <div
            className={`absolute inset-0 bg-linear-to-br ${statusGradients.offline.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
          />
          <div className="relative z-10 flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <XCircle size={13} className="text-slate-400" /> 오프라인
            </span>
            <span className="mt-2 text-2xl font-bold text-slate-700 tracking-tight">
              {safeStats.offline}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 시스템 상태 - 동적 그라데이션 */}
      <div
        className={`group relative rounded-2xl border ${systemHealthGradient.border} bg-white/60 backdrop-blur-md p-3 shadow-sm lg:col-span-5 flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:scale-[1.01] overflow-hidden`}
      >
        {/* 상태 기반 그라데이션 배경 */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${systemHealthGradient.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`}
        />

        {/* 위험/경고 시 글로우 효과 */}
        {showPulse && (
          <div
            className={`absolute inset-0 bg-linear-to-r ${systemHealthGradient.gradient} opacity-[0.02] animate-pulse`}
          />
        )}

        <div className="relative z-10 flex items-center justify-between px-3">
          <div className="flex items-center gap-4">
            {/* 동적 아이콘 박스 */}
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-md bg-linear-to-br ${systemHealthGradient.gradient} text-white`}
            >
              <ShieldAlert size={22} />
              {/* 상태에 따른 펄스 링 */}
              {showPulse && (
                <div
                  className={`absolute inset-0 rounded-2xl bg-linear-to-br ${systemHealthGradient.gradient} animate-ping opacity-30`}
                />
              )}
            </div>
            <div>
              <div className="text-2xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                시스템 상태
              </div>
              <div className={`text-sm font-bold ${systemHealthGradient.text}`}>
                {safeStats.critical > 0 || safeStats.offline > 0
                  ? '심각한 문제 발생'
                  : safeStats.warning > 0
                    ? '성능 경고'
                    : '모든 시스템 정상'}
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-center pr-2">
            <div>
              <div
                className={`text-2xl font-bold leading-none ${safeStats.critical > 0 ? 'text-rose-500' : 'text-gray-400'}`}
              >
                {safeStats.critical}
              </div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase mt-1">
                위험
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <div
                className={`text-2xl font-bold leading-none ${safeStats.warning > 0 ? 'text-amber-500' : 'text-gray-400'}`}
              >
                {safeStats.warning}
              </div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase mt-1">
                경고
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
