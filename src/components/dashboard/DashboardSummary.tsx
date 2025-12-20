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
    <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* 1. Total Servers - Compact Left */}
      <div className="flex flex-row items-center justify-between rounded-xl border border-gray-100 bg-linear-to-br from-slate-50 to-blue-50 p-4 shadow-xs transition-all duration-300 hover:shadow-md lg:col-span-2">
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <ServerIcon size={14} className="text-blue-600" />
            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 leading-none">{stats.total}</span>
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
            <span className="mt-1 text-xl font-bold text-green-800 tracking-tight">{stats.online}</span>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-yellow-100 bg-yellow-50/50 p-3 transition-all hover:bg-yellow-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700">
              <AlertTriangle size={12} /> Warning
            </span>
            <span className="mt-1 text-xl font-bold text-yellow-800 tracking-tight">{stats.warning}</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-red-100 bg-red-50/50 p-3 transition-all hover:bg-red-50">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
              <XCircle size={12} /> Offline
            </span>
            <span className="mt-1 text-xl font-bold text-red-800 tracking-tight">{stats.offline}</span>
          </div>
        </div>
      </div>

      {/* 3. Resource Overview - Horizontal Slim */}
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs lg:col-span-5 flex flex-col justify-center">
        <div className="grid grid-cols-4 gap-4 divide-x divide-gray-100">
          {/* CPU */}
          <div className="px-2 text-center first:pl-0">
             <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1.5">
               <Cpu size={12} /> CPU
             </div>
             <div className="relative h-1.5 w-full rounded-full bg-gray-100 mb-1">
               <div className={`absolute top-0 left-0 h-full rounded-full ${resourceStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${resourceStats.cpu}%` }} />
             </div>
             <span className="text-xs font-bold text-gray-900">{resourceStats.cpu}%</span>
          </div>

          {/* Memory */}
          <div className="px-2 text-center">
             <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1.5">
               <Database size={12} /> MEM
             </div>
             <div className="relative h-1.5 w-full rounded-full bg-gray-100 mb-1">
               <div className={`absolute top-0 left-0 h-full rounded-full ${resourceStats.memory > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${resourceStats.memory}%` }} />
             </div>
             <span className="text-xs font-bold text-gray-900">{resourceStats.memory}%</span>
          </div>

          {/* Disk */}
          <div className="px-2 text-center">
             <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1.5">
               <HardDrive size={12} /> DISK
             </div>
             <div className="relative h-1.5 w-full rounded-full bg-gray-100 mb-1">
               <div className={`absolute top-0 left-0 h-full rounded-full ${resourceStats.disk > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${resourceStats.disk}%` }} />
             </div>
             <span className="text-xs font-bold text-gray-900">{resourceStats.disk}%</span>
          </div>
          
           {/* Network */}
          <div className="px-2 text-center">
             <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1.5">
               <Network size={12} /> NET
             </div>
             <div className="relative h-1.5 w-full rounded-full bg-gray-100 mb-1">
               <div className="absolute top-0 left-0 h-full rounded-full bg-orange-500" style={{ width: `${Math.min(resourceStats.network, 100)}%` }} />
             </div>
             <span className="text-xs font-bold text-gray-900">{resourceStats.network}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
