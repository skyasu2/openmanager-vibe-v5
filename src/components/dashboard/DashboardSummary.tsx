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
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  stats,
}) => {
  // Null-safe 처리
  const safeStats = {
    total: stats?.total ?? 0,
    online: stats?.online ?? 0,
    offline: stats?.offline ?? 0,
    warning: stats?.warning ?? 0,
    critical: stats?.critical ?? 0,
    unknown: stats?.unknown ?? 0,
  };
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* 1. Total Servers - Glassmorphism Style */}
      <div className="flex flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2">
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
            <ServerIcon size={14} className="text-blue-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Total
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800 leading-none tracking-tight">
              {safeStats.total}
            </span>
          </div>
        </div>
        {/* Decorative Circle - Softer */}
        <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
          <Activity size={18} />
        </div>
      </div>

      {/* 2. Status Cards - Horizontal Compact */}
      <div className="grid grid-cols-4 gap-3 lg:col-span-5">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-white/60 backdrop-blur-md p-4 transition-all hover:shadow-md hover:bg-emerald-50/30">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <CheckCircle2 size={13} className="text-emerald-500" /> Online
            </span>
            <span className="mt-2 text-2xl font-bold text-gray-800 tracking-tight">
              {safeStats.online}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-white/60 backdrop-blur-md p-4 transition-all hover:shadow-md hover:bg-amber-50/30">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <AlertTriangle size={13} className="text-amber-500" /> Warning
            </span>
            <span className="mt-2 text-2xl font-bold text-gray-800 tracking-tight">
              {safeStats.warning}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-200/50 bg-white/60 backdrop-blur-md p-4 transition-all hover:shadow-md hover:bg-rose-50/30">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600/80">
              <AlertOctagon size={13} className="text-rose-500" /> Critical
            </span>
            <span className="mt-2 text-2xl font-bold text-rose-600 tracking-tight">
              {safeStats.critical}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md p-4 transition-all hover:shadow-md hover:bg-slate-50/50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <XCircle size={13} className="text-slate-400" /> Offline
            </span>
            <span className="mt-2 text-2xl font-bold text-slate-700 tracking-tight">
              {safeStats.offline}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Alert & Incident Summary - Clean Glassmorphism */}
      <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-3 shadow-sm lg:col-span-5 flex flex-col justify-center transition-all hover:shadow-md">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${
                safeStats.critical > 0
                  ? 'bg-rose-50 text-rose-500 border border-rose-100'
                  : safeStats.warning > 0
                    ? 'bg-amber-50 text-amber-500 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
              }`}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                System Health
              </div>
              <div
                className={`text-sm font-bold ${
                  safeStats.critical > 0
                    ? 'text-rose-600'
                    : safeStats.warning > 0
                      ? 'text-amber-600'
                      : 'text-gray-700'
                }`}
              >
                {safeStats.critical > 0 || safeStats.offline > 0
                  ? 'Critical Issues'
                  : safeStats.warning > 0
                    ? 'Performance Warning'
                    : 'All Systems Normal'}
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-center pr-2">
            <div>
              <div className="text-2xl font-bold text-rose-500 leading-none">
                {safeStats.critical}
              </div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase mt-1">
                Critical
              </div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <div className="text-2xl font-bold text-amber-500 leading-none">
                {safeStats.warning}
              </div>
              <div className="text-[9px] font-semibold text-gray-400 uppercase mt-1">
                Warning
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
