'use client';

import React, { useState, useEffect } from 'react';
import { Server, MetricsHistory } from '../../types/server';
import { ServerDetailOverview } from './server-detail/ServerDetailOverview';
import { ServerDetailMetrics } from './server-detail/ServerDetailMetrics';
import { ServerDetailNetwork } from './server-detail/ServerDetailNetwork';
import { ServerDetailProcesses } from './server-detail/ServerDetailProcesses';
import { ServerDetailLogs } from './server-detail/ServerDetailLogs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServerDetailModalProps {
  server: Server;
  metricsHistory: MetricsHistory[];
  onClose: () => void;
}

export default function ServerDetailModal({
  server,
  metricsHistory,
  onClose,
}: ServerDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 모달 오픈 시 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const safeServer = server || {
    id: 'unknown',
    name: 'Unknown Server',
    hostname: 'unknown.local',
    status: 'offline' as const,
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    location: 'Unknown',
    type: 'Unknown',
    environment: 'Unknown',
    uptime: '0m',
    lastUpdate: new Date(),
    alerts: 0,
    services: [],
    systemInfo: {
      os: 'Unknown',
      uptime: '0m',
      processes: 0,
      zombieProcesses: 0,
      loadAverage: '0.0',
      lastUpdate: new Date().toISOString(),
    },
  };

  const tabs = [
    { id: 'overview', name: '개요', icon: '📊' },
    { id: 'metrics', name: '메트릭', icon: '📈' },
    { id: 'network', name: '네트워크', icon: '🌐' },
    { id: 'processes', name: '프로세스', icon: '⚙️' },
    { id: 'logs', name: '로그', icon: '📋' },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        {/* 헤더 */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold'>{safeServer.name}</h2>
              <p className='text-blue-100 mt-1'>
                {safeServer.hostname} • {safeServer.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:text-gray-200 text-2xl font-bold'
            >
              ×
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className='flex space-x-2 mt-4'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='flex-1'>
          <div className='flex-1 overflow-auto p-6'>
            <TabsContent value='overview' className='mt-0'>
              <ServerDetailOverview
                server={{
                  ...safeServer,
                  type: 'api',
                  status:
                    safeServer.status === 'healthy'
                      ? 'online'
                      : safeServer.status,
                  lastSeen: safeServer.lastUpdate.toISOString(),
                  alerts: 0,
                  metrics: {
                    cpu: {
                      usage: safeServer.cpu,
                      cores: 8,
                      temperature: 45,
                    },
                    memory: {
                      used: Math.round((16 * safeServer.memory) / 100),
                      total: 16,
                      usage: safeServer.memory,
                    },
                    disk: {
                      used: Math.round((500 * safeServer.disk) / 100),
                      total: 500,
                      usage: safeServer.disk,
                    },
                    network: {
                      bytesIn: 1024 * 1024,
                      bytesOut: 512 * 1024,
                      packetsIn: 1000,
                      packetsOut: 800,
                    },
                    timestamp: new Date().toISOString(),
                    uptime: 86400 * 30, // 30일을 초로 변환
                  },
                }}
              />
            </TabsContent>

            <TabsContent value='metrics' className='mt-0'>
              <ServerDetailMetrics
                metricsHistory={metricsHistory}
                metricsStats={null}
                isLoadingHistory={false}
                timeRange='24h'
                onTimeRangeChange={() => {}}
                generateChartPoints={(data: number[]) =>
                  data.map((value, index) => `${index},${value}`).join(' ')
                }
              />
            </TabsContent>

            <TabsContent value='network' className='mt-0'>
              <ServerDetailNetwork realTimeMetrics={null} />
            </TabsContent>

            <TabsContent value='processes' className='mt-0'>
              <ServerDetailProcesses serverId={safeServer.id} />
            </TabsContent>

            <TabsContent value='logs' className='mt-0'>
              <ServerDetailLogs serverId={safeServer.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
