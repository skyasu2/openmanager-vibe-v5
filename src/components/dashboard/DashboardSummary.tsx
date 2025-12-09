import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Network,
  Server as ServerIcon,
  XCircle,
} from 'lucide-react';
import React from 'react';
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
  servers,
  stats,
}) => {
  // 리소스 평균 계산
  const resourceStats = React.useMemo(() => {
    if (!servers || servers.length === 0)
      return { cpu: 0, memory: 0, disk: 0, network: 0 };

    const total = servers.length;
    const sum = servers.reduce(
      (acc, server) => ({
        cpu: acc.cpu + (server.cpu || 0),
        memory: acc.memory + (server.memory || 0),
        disk: acc.disk + (server.disk || 0),
        network: acc.network + (server.network || 0),
      }),
      { cpu: 0, memory: 0, disk: 0, network: 0 }
    );

    return {
      cpu: Math.round(sum.cpu / total),
      memory: Math.round(sum.memory / total),
      disk: Math.round(sum.disk / total),
      network: Math.round(sum.network / total),
    };
  }, [servers]);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Servers (Large) */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xs md:col-span-2 lg:col-span-1">
        {/* 배경 아이콘 완전 제거 - SVG stroke 아티팩트 발생으로 hidden 처리 */}
        {/* <div className="absolute right-0 top-0 p-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
          <ServerIcon size={120} strokeWidth={1} />
        </div> */}
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <ServerIcon size={18} />
            <span className="text-sm font-medium">Total Servers</span>
          </div>
          <div className="mb-1 text-4xl font-bold text-gray-900">
            {stats.total}
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Activity size={12} />
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* 2. Status Cards (Grid inside Grid) */}
      <div className="grid grid-rows-3 gap-4 lg:col-span-1">
        <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xs font-medium text-green-700">Online</div>
              <div className="text-lg font-bold text-green-800">
                {stats.online}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-yellow-100 bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="text-xs font-medium text-yellow-700">Warning</div>
              <div className="text-lg font-bold text-yellow-800">
                {stats.warning}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <XCircle size={18} />
            </div>
            <div>
              <div className="text-xs font-medium text-red-700">Offline</div>
              <div className="text-lg font-bold text-red-800">
                {stats.offline}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Resource Usage (Medium) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs md:col-span-2 lg:col-span-2">
        <h3 className="mb-6 flex items-center gap-2 font-semibold text-gray-900">
          <Activity size={18} className="text-blue-500" />
          Resource Overview
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {/* CPU */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Cpu size={14} /> CPU
              </span>
              <span className="font-medium text-gray-900">
                {resourceStats.cpu}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${resourceStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${resourceStats.cpu}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Database size={14} /> Memory
              </span>
              <span className="font-medium text-gray-900">
                {resourceStats.memory}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${resourceStats.memory > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                style={{ width: `${resourceStats.memory}%` }}
              />
            </div>
          </div>

          {/* Disk */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <HardDrive size={14} /> Disk
              </span>
              <span className="font-medium text-gray-900">
                {resourceStats.disk}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${resourceStats.disk > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${resourceStats.disk}%` }}
              />
            </div>
          </div>

          {/* Network */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-500">
                <Network size={14} /> Network
              </span>
              <span className="font-medium text-gray-900">
                {resourceStats.network}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(resourceStats.network, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
