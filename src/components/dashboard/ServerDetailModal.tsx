'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Cpu,
  FileText,
  HardDrive,
  MapPin,
  MemoryStick,
  Network,
  Server as ServerIcon,
  Settings,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MetricsHistory, Server } from '../../types/server';
import { ServerDetailLogs } from './server-detail/ServerDetailLogs';
import { ServerDetailMetrics } from './server-detail/ServerDetailMetrics';
import { ServerDetailNetwork } from './server-detail/ServerDetailNetwork';
import { ServerDetailOverview } from './server-detail/ServerDetailOverview';
import { ServerDetailProcesses } from './server-detail/ServerDetailProcesses';

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

  // 🛡️ 안전한 서버 데이터 처리 - 실제 데이터 구조에 맞게 개선
  const safeServer = server
    ? {
        id: server.id || 'unknown',
        name: server.name || 'Unknown Server',
        hostname: server.hostname || server.name || 'unknown.local',
        status: server.status || 'offline',
        cpu: typeof server.cpu === 'number' ? server.cpu : 0,
        memory: typeof server.memory === 'number' ? server.memory : 0,
        disk: typeof server.disk === 'number' ? server.disk : 0,
        network: typeof server.network === 'number' ? server.network : 0,
        location: server.location || 'Unknown',
        type: server.type || server.role || 'Unknown',
        environment: server.environment || 'production',
        provider: server.provider || 'Unknown',
        uptime: server.uptime || '0h 0m',
        lastUpdate: server.lastUpdate || new Date(),
        alerts:
          typeof server.alerts === 'number'
            ? server.alerts
            : Array.isArray(server.alerts)
              ? server.alerts.length
              : 0,
        services: Array.isArray(server.services) ? server.services : [],
        ip: server.ip || '192.168.1.100',
        os: server.os || 'Ubuntu 22.04 LTS',
        specs: server.specs || {
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          network_speed: '1Gbps',
        },
        systemInfo: server.systemInfo || {
          os: server.os || 'Ubuntu 22.04 LTS',
          uptime: typeof server.uptime === 'string' ? server.uptime : '0h 0m',
          processes: Math.floor(Math.random() * 200) + 50,
          zombieProcesses: Math.floor(Math.random() * 5),
          loadAverage: '1.23, 1.45, 1.67',
          lastUpdate: new Date().toISOString(),
        },
        networkInfo: server.networkInfo || {
          interface: 'eth0',
          receivedBytes: `${Math.floor(server.network || 0)} MB`,
          sentBytes: `${Math.floor((server.network || 0) * 0.8)} MB`,
          receivedErrors: Math.floor(Math.random() * 10),
          sentErrors: Math.floor(Math.random() * 10),
          status:
            server.status === 'healthy'
              ? 'healthy'
              : server.status === 'warning'
                ? 'warning'
                : 'critical',
        },
      }
    : null;

  if (!safeServer) {
    return null;
  }

  // 🎨 상태별 스타일링
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          icon: CheckCircle,
          text: '정상',
          gradient: 'from-green-600 to-emerald-600',
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          icon: AlertTriangle,
          text: '주의',
          gradient: 'from-yellow-600 to-orange-600',
        };
      case 'critical':
      case 'offline':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          icon: XCircle,
          text: '오프라인',
          gradient: 'from-red-600 to-pink-600',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          icon: XCircle,
          text: '알 수 없음',
          gradient: 'from-gray-600 to-slate-600',
        };
    }
  };

  const statusConfig = getStatusConfig(safeServer.status);
  const StatusIcon = statusConfig.icon;

  const tabs = [
    { id: 'overview', name: '개요', icon: Activity },
    { id: 'metrics', name: '메트릭', icon: BarChart3 },
    { id: 'network', name: '네트워크', icon: Network },
    { id: 'processes', name: '프로세스', icon: Settings },
    { id: 'logs', name: '로그', icon: FileText },
  ];

  // 🎯 리소스 사용률에 따른 색상
  const getResourceColor = (value: number) => {
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-white'>
        {/* 접근성을 위한 숨겨진 제목과 설명 */}
        <DialogTitle className='sr-only'>
          {safeServer.name} 서버 상세 정보
        </DialogTitle>
        <DialogDescription className='sr-only'>
          {safeServer.name} 서버의 상세한 메트릭, 네트워크, 프로세스 및 로그
          정보를 확인할 수 있습니다.
        </DialogDescription>

        {/* 🎨 개선된 헤더 */}
        <div
          className={`bg-gradient-to-r ${statusConfig.gradient} text-white p-6 relative overflow-hidden`}
        >
          {/* 배경 패턴 */}
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)" /%3E%3C/svg%3E")]'></div>
          </div>

          <div className='relative z-10'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm'>
                  <ServerIcon className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h2 className='text-3xl font-bold text-white mb-1'>
                    {safeServer.name}
                  </h2>
                  <div className='flex items-center gap-3 text-white text-opacity-90'>
                    <span className='flex items-center gap-1'>
                      <MapPin className='w-4 h-4' />
                      {safeServer.hostname}
                    </span>
                    <span>•</span>
                    <span>{safeServer.location}</span>
                    <span>•</span>
                    <span>{safeServer.environment}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className='text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg'
                aria-label='서버 상세 정보 닫기'
              >
                <XCircle className='w-6 h-6' />
              </button>
            </div>

            {/* 🎯 실시간 상태 및 메트릭 요약 */}
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
              {/* 상태 */}
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center'>
                <StatusIcon className='w-8 h-8 text-white mx-auto mb-2' />
                <div className='text-white font-semibold'>
                  {statusConfig.text}
                </div>
                <div className='text-white text-opacity-70 text-sm'>상태</div>
              </div>

              {/* CPU */}
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center'>
                <Cpu className='w-8 h-8 text-white mx-auto mb-2' />
                <div className='text-white font-bold text-xl'>
                  {safeServer.cpu}%
                </div>
                <div className='text-white text-opacity-70 text-sm'>CPU</div>
              </div>

              {/* 메모리 */}
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center'>
                <MemoryStick className='w-8 h-8 text-white mx-auto mb-2' />
                <div className='text-white font-bold text-xl'>
                  {safeServer.memory}%
                </div>
                <div className='text-white text-opacity-70 text-sm'>메모리</div>
              </div>

              {/* 디스크 */}
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center'>
                <HardDrive className='w-8 h-8 text-white mx-auto mb-2' />
                <div className='text-white font-bold text-xl'>
                  {safeServer.disk}%
                </div>
                <div className='text-white text-opacity-70 text-sm'>디스크</div>
              </div>

              {/* 네트워크 */}
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center'>
                <Wifi className='w-8 h-8 text-white mx-auto mb-2' />
                <div className='text-white font-bold text-xl'>
                  {safeServer.network}%
                </div>
                <div className='text-white text-opacity-70 text-sm'>
                  네트워크
                </div>
              </div>
            </div>

            {/* 🏷️ 개선된 탭 네비게이션 */}
            <div className='flex space-x-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-1'>
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                        : 'text-white hover:bg-white hover:bg-opacity-30'
                    }`}
                  >
                    <TabIcon className='w-4 h-4' />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 📊 탭 컨텐츠 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex-1 overflow-hidden'
        >
          <div className='h-[calc(95vh-300px)] overflow-auto p-6 bg-gray-50'>
            <TabsContent value='overview' className='mt-0 h-full'>
              <ServerDetailOverview
                server={{
                  ...safeServer,
                  lastSeen: safeServer.lastUpdate.toISOString(),
                  metrics: {
                    cpu: {
                      usage: safeServer.cpu,
                      cores: safeServer.specs.cpu_cores,
                      temperature: 45,
                    },
                    memory: {
                      used: Math.round(
                        (safeServer.specs.memory_gb * safeServer.memory) / 100
                      ),
                      total: safeServer.specs.memory_gb,
                      usage: safeServer.memory,
                    },
                    disk: {
                      used: Math.round(
                        (safeServer.specs.disk_gb * safeServer.disk) / 100
                      ),
                      total: safeServer.specs.disk_gb,
                      usage: safeServer.disk,
                    },
                    network: {
                      bytesIn: Math.floor(Math.random() * 1024 * 1024),
                      bytesOut: Math.floor(Math.random() * 512 * 1024),
                      packetsIn: Math.floor(Math.random() * 1000),
                      packetsOut: Math.floor(Math.random() * 800),
                    },
                    timestamp: new Date().toISOString(),
                    uptime: 86400 * 30,
                  },
                }}
              />
            </TabsContent>

            <TabsContent value='metrics' className='mt-0 h-full'>
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

            <TabsContent value='network' className='mt-0 h-full'>
              <ServerDetailNetwork realTimeMetrics={null} />
            </TabsContent>

            <TabsContent value='processes' className='mt-0 h-full'>
              <ServerDetailProcesses serverId={safeServer.id} />
            </TabsContent>

            <TabsContent value='logs' className='mt-0 h-full'>
              <ServerDetailLogs serverId={safeServer.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
