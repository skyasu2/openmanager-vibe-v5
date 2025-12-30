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
      {/* 1. Total Servers - Compact Left */}
      <div className="flex flex-row items-center justify-between rounded-xl border border-gray-100 bg-linear-to-br from-slate-50 to-blue-50 p-4 shadow-xs transition-all duration-300 hover:shadow-md lg:col-span-2">
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <ServerIcon size={14} className="text-blue-600" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Total
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 leading-none">
              {safeStats.total}
            </span>
            <span className="text-xs text-gray-400">servers</span>
          </div>
        </div>
        {/* Decorative Circle */}
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Activity size={16} />
        </div>
      </div>

      {/* 2. Status Cards - Horizontal Compact (4열: Online, Warning, Critical, Offline) */}
      <div className="grid grid-cols-4 gap-2 lg:col-span-5">
        <div className="relative overflow-hidden rounded-xl border border-green-100 bg-green-50/50 p-3 transition-all hover:bg-green-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <CheckCircle2 size={12} /> Online
            </span>
            <span className="mt-1 text-xl font-bold text-green-800 tracking-tight">
              {safeStats.online}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-100 bg-amber-50/50 p-3 transition-all hover:bg-amber-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle size={12} /> Warning
            </span>
            <span className="mt-1 text-xl font-bold text-amber-800 tracking-tight">
              {safeStats.warning}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-rose-50/50 p-3 transition-all hover:bg-rose-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <AlertOctagon size={12} /> Critical
            </span>
            <span className="mt-1 text-xl font-bold text-rose-800 tracking-tight">
              {safeStats.critical}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:bg-slate-100">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <XCircle size={12} /> Offline
            </span>
            <span className="mt-1 text-xl font-bold text-slate-700 tracking-tight">
              {safeStats.offline}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Alert & Incident Summary - Replaces Resource Overview */}
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs lg:col-span-5 flex flex-col justify-center">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                safeStats.critical > 0 || safeStats.offline > 0
                  ? 'bg-rose-100 text-rose-600'
                  : safeStats.warning > 0
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                System Health
              </div>
              <div className="font-bold text-gray-900">
                {safeStats.critical > 0 || safeStats.offline > 0
                  ? 'Critical Issues Detected'
                  : safeStats.warning > 0
                    ? 'Performance Warnings'
                    : 'All Systems Normal'}
              </div>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-rose-600">
                {safeStats.critical}
              </div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">
                Critical
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-500">
                {safeStats.warning}
              </div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">
                Warning
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
