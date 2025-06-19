'use client';

import React from 'react';
import {
  Server,
  Monitor,
  AlertTriangle,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
} from 'lucide-react';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';
import { formatPercentage } from '@/lib/utils';

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
    <div className='h-full flex flex-col'>
      <CollapsibleCard
        title='Infrastructure Overview'
        subtitle='전체 인프라 현황'
        icon={
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Monitor className='w-6 h-6 text-blue-600' />
          </div>
        }
        isExpanded={sections.infrastructureOverview}
        onToggle={() => toggleSection('infrastructureOverview')}
        variant='bordered'
        className='h-full'
      >
        <div className='space-y-6'>
          {/* 서버 상태 요약 */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
              <Server className='w-5 h-5 text-blue-600' />
              서버 현황
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  {stats.total}
                </div>
                <div className='text-sm text-gray-600'>Total Servers</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {stats.online}
                </div>
                <div className='text-sm text-gray-600'>Online</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {stats.offline}
                </div>
                <div className='text-sm text-gray-600'>Offline</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {stats.warning}
                </div>
                <div className='text-sm text-gray-600'>Alerts</div>
              </div>
            </div>
          </div>

          {/* 리소스 사용률 */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
              <Activity className='w-5 h-5 text-blue-600' />
              리소스 사용률
            </h3>
            <div className='space-y-4'>
              {/* CPU */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Cpu className='w-4 h-4 text-blue-500' />
                  <span className='text-sm font-medium text-gray-700'>CPU</span>
                </div>
                <div className='flex items-center gap-3 flex-1 ml-4'>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.cpu)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.cpu)}%`,
                      }}
                    />
                  </div>
                  <span className='text-sm font-semibold text-gray-900 w-12 text-right'>
                    {formatPercentage(resourceUsage.cpu)}
                  </span>
                </div>
              </div>

              {/* Memory */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <MemoryStick className='w-4 h-4 text-green-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Memory
                  </span>
                </div>
                <div className='flex items-center gap-3 flex-1 ml-4'>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.memory)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.memory)}%`,
                      }}
                    />
                  </div>
                  <span className='text-sm font-semibold text-gray-900 w-12 text-right'>
                    {formatPercentage(resourceUsage.memory)}
                  </span>
                </div>
              </div>

              {/* Disk */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <HardDrive className='w-4 h-4 text-purple-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Disk
                  </span>
                </div>
                <div className='flex items-center gap-3 flex-1 ml-4'>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(resourceUsage.disk)}`}
                      style={{
                        width: `${getProgressBarWidth(resourceUsage.disk)}%`,
                      }}
                    />
                  </div>
                  <span className='text-sm font-semibold text-gray-900 w-12 text-right'>
                    {formatPercentage(resourceUsage.disk)}
                  </span>
                </div>
              </div>

              {/* Bandwidth */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Globe className='w-4 h-4 text-orange-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Bandwidth
                  </span>
                </div>
                <div className='flex items-center gap-3 flex-1 ml-4'>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className='h-2 rounded-full bg-orange-500 transition-all duration-300'
                      style={{ width: '45%' }}
                    />
                  </div>
                  <span className='text-sm font-semibold text-gray-900 w-16 text-right'>
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
