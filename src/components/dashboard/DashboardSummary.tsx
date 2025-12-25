import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Server as ServerIcon,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import type { Server } from '@/types/server';

interface DashboardSummaryProps {
  servers: Server[];
  stats: {
    total: number;
    online: number;
    offline: number;
    warning: number;
    unknown: number;
  };
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  servers: _servers,
  stats,
}) => {
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
              {stats.total}
            </span>
            <span className="text-xs text-gray-400">servers</span>
          </div>
        </div>
        {/* Decorative Circle */}
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Activity size={16} />
        </div>
      </div>

      {/* 2. Status Cards - Horizontal Compact */}
      <div className="grid grid-cols-3 gap-3 lg:col-span-5">
        <div className="relative overflow-hidden rounded-xl border border-green-100 bg-green-50/50 p-3 transition-all hover:bg-green-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <CheckCircle2 size={12} /> Online
            </span>
            <span className="mt-1 text-xl font-bold text-green-800 tracking-tight">
              {stats.online}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-yellow-100 bg-yellow-50/50 p-3 transition-all hover:bg-yellow-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700">
              <AlertTriangle size={12} /> Warning
            </span>
            <span className="mt-1 text-xl font-bold text-yellow-800 tracking-tight">
              {stats.warning}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-red-100 bg-red-50/50 p-3 transition-all hover:bg-red-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
              <XCircle size={12} /> Offline
            </span>
            <span className="mt-1 text-xl font-bold text-red-800 tracking-tight">
              {stats.offline}
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
                stats.offline > 0 || stats.warning > 0
                  ? 'bg-red-100 text-red-600'
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
                {stats.offline > 0
                  ? 'Critical Issues Detected'
                  : stats.warning > 0
                    ? 'Performance Warnings'
                    : 'All Systems Normal'}
              </div>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-red-600">
                {stats.offline}
              </div>
              <div className="text-[10px] font-medium text-gray-400 uppercase">
                Critical
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-500">
                {stats.warning}
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
