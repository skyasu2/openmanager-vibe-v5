'use client';

import React, { useState, useEffect } from 'react';
import { Server } from '../../types/server';
import { ServerDetailOverview } from './server-detail/ServerDetailOverview';
import { ServerDetailMetrics } from './server-detail/ServerDetailMetrics';
import { ServerDetailNetwork } from './server-detail/ServerDetailNetwork';
import { ServerDetailProcesses } from './server-detail/ServerDetailProcesses';
import { ServerDetailLogs } from './server-detail/ServerDetailLogs';
import { useServerMetrics } from '../../hooks/useServerMetrics';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';

interface ServerDetailModalProps {
  server: Server | null;
  onClose: () => void;
}

export default function ServerDetailModal({
  server,
  onClose,
}: ServerDetailModalProps) {
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'metrics' | 'network' | 'processes' | 'logs'
  >('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // 커스텀 훅 사용
  const {
    metricsHistory,
    isLoadingHistory,
    loadMetricsHistory,
    calculateMetricsStats,
    generateChartPoints,
  } = useServerMetrics();

  const realTimeMetrics = useRealTimeMetrics(server?.id || null);

  // 히스토리 데이터 로드
  useEffect(() => {
    if (!server) return;
    loadMetricsHistory(server.id, timeRange);
  }, [server, timeRange, loadMetricsHistory]);

  // 모달 오픈 시 스크롤 방지
  useEffect(() => {
    if (server) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [server]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: 'fas fa-check-circle',
          text: '정상',
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: 'fas fa-exclamation-triangle',
          text: '주의',
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: 'fas fa-times-circle',
          text: '위험',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: 'fas fa-question-circle',
          text: '알 수 없음',
        };
    }
  };

  if (!server) return null;

  const statusInfo = getStatusInfo(server.status);
  const metricsStats = calculateMetricsStats(metricsHistory);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden'>
        {/* 헤더 */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center'>
                <i className='fas fa-server text-2xl'></i>
              </div>
              <div>
                <h2 className='text-2xl font-bold'>{server.name}</h2>
                <div className='flex items-center space-x-4 mt-1'>
                  <span className='text-blue-100'>{server.ip}</span>
                  <div className='flex items-center space-x-2'>
                    <i className={`${statusInfo.icon} text-sm`}></i>
                    <span className='text-sm'>{statusInfo.text}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className='w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-colors'
              aria-label='Close'
            >
              <i className='fas fa-times text-xl'></i>
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className='flex space-x-1 mt-6 bg-white bg-opacity-10 rounded-lg p-1'>
            {[
              { id: 'overview', label: '개요', icon: 'fas fa-chart-pie' },
              { id: 'metrics', label: '메트릭', icon: 'fas fa-chart-line' },
              {
                id: 'network',
                label: '네트워크',
                icon: 'fas fa-network-wired',
              },
              { id: 'processes', label: '프로세스', icon: 'fas fa-tasks' },
              { id: 'logs', label: '로그', icon: 'fas fa-file-alt' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-200px)]'>
          {selectedTab === 'overview' && (
            <ServerDetailOverview
              server={{
                ...server,
                type: 'api',
                lastSeen: server.lastUpdate.toISOString(),
                alerts: 0,
                metrics: {
                  cpu: {
                    usage: server.cpu,
                    cores: 8,
                    temperature: 45,
                  },
                  memory: {
                    used: Math.round((16 * server.memory) / 100),
                    total: 16,
                    usage: server.memory,
                  },
                  disk: {
                    used: Math.round((500 * server.disk) / 100),
                    total: 500,
                    usage: server.disk,
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
          )}

          {selectedTab === 'metrics' && (
            <ServerDetailMetrics
              metricsHistory={metricsHistory}
              metricsStats={metricsStats}
              isLoadingHistory={isLoadingHistory}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              generateChartPoints={generateChartPoints}
            />
          )}

          {selectedTab === 'network' && (
            <ServerDetailNetwork realTimeMetrics={realTimeMetrics} />
          )}

          {selectedTab === 'processes' && (
            <ServerDetailProcesses serverId={server?.id || 'demo'} />
          )}

          {selectedTab === 'logs' && (
            <ServerDetailLogs serverId={server?.id || 'demo'} />
          )}
        </div>
      </div>
    </div>
  );
}
