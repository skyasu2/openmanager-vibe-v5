'use client';

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import {
  Activity,
  Cpu,
  Globe,
  HardDrive,
  MemoryStick,
  Monitor,
  Server,
} from 'lucide-react';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { formatPercentage } from '@/lib/utils';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';

interface InfrastructureOverviewProps {
  stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  };
}

export default function InfrastructureOverview({
  stats,
}: InfrastructureOverviewProps) {
  const { sections, toggleSection } = useDashboardToggleStore();

  // 가상의 리소스 사용률 데이터 (실제로는 API에서 가져와야 함)
  const resourceUsage = {
    cpu: 34,
    memory: 62,
    disk: 43,
    bandwidth: 127, // MB/s
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBarWidth = (percentage: number) => {
    return Math.min(Math.max(percentage, 0), 100);
  };

  return (
    <div className="flex h-full flex-col">
      <CollapsibleCard
        title="Infrastructure Overview"
        subtitle="전체 인프라 현황"
        icon={
          <div className="rounded-lg bg-blue-100 p-2">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
        }
        isExpanded={sections.infrastructureOverview}
        onToggle={() => toggleSection('infrastructureOverview')}
        variant="bordered"
        className="h-full"
      >
        <div className="space-y-6">
          {/* 서버 상태 요약 */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Server className="h-5 w-5 text-blue-600" />
              서버 현황
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">Total Servers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.online}
                </div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.offline}
                </div>
                <div className="text-sm text-gray-600">Offline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.warning}
                </div>
                <div className="text-sm text-gray-600">Alerts</div>
              </div>
            </div>
          </div>

          {/* 리소스 사용률 */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Activity className="h-5 w-5 text-blue-600" />
              리소스 사용률
            </h3>
            <div className="space-y-4">
              {/* CPU */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">CPU</span>
                </div>
                <div className="ml-4 flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.cpu)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.cpu)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-gray-900">
                    {formatPercentage(resourceUsage.cpu)}
                  </span>
                </div>
              </div>

              {/* Memory */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Memory
                  </span>
                </div>
                <div className="ml-4 flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.memory)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.memory)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-gray-900">
                    {formatPercentage(resourceUsage.memory)}
                  </span>
                </div>
              </div>

              {/* Disk */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Disk
                  </span>
                </div>
                <div className="ml-4 flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.disk)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.disk)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-gray-900">
                    {formatPercentage(resourceUsage.disk)}
                  </span>
                </div>
              </div>

              {/* Bandwidth */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Bandwidth
                  </span>
                </div>
                <div className="ml-4 flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                      style={{ width: '45%' }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-gray-900">
                    {resourceUsage.bandwidth}MB/s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
