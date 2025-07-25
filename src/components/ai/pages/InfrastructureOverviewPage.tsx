/**
 * 🎛️ Infrastructure Overview Page
 *
 * AI 에이전트 사이드바의 인프라 전체 현황 페이지
 * - 전체 서버 통계
 * - CPU, RAM, Disk, Bandwidth 현황
 * - 실시간 상태 업데이트 (10초 간격)
 */

'use client';

import { formatPercentage } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface InfrastructureStats {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  alertCount: number;
  totalCpu: number;
  totalRam: number;
  totalDisk: number;
  bandwidth: number;
}

interface InfrastructureOverviewPageProps {
  className?: string;
}

export default function InfrastructureOverviewPage({
  className = '',
}: InfrastructureOverviewPageProps) {
  const [stats, setStats] = useState<InfrastructureStats>({
    totalServers: 0,
    onlineServers: 0,
    offlineServers: 0,
    alertCount: 0,
    totalCpu: 0,
    totalRam: 0,
    totalDisk: 0,
    bandwidth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 서버 데이터 가져오기 - 대시보드 API와 동일한 소스 사용
  const fetchServerData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      /*
       * ✅ 대시보드 API 응답 구조 처리
       *   - { data: { servers: [], overview: {} } } 형태
       */
      const response_data = await response.json();
      const servers = response_data?.data?.servers || [];
      const overview = response_data?.data?.overview || {};

      console.log('🔍 인프라 현황 - 대시보드 데이터:', {
        serversCount: servers.length,
        overview,
        firstServer: servers[0],
        timestamp: new Date().toISOString(),
      });

      // 🎯 대시보드 API의 overview 데이터를 직접 사용
      const totalServers = overview.total_servers || servers.length;
      const onlineServers = overview.healthy_servers || 0;
      const warningServers = overview.warning_servers || 0;
      const offlineServers = overview.critical_servers || 0;
      const alertCount = warningServers + offlineServers;

      console.log('📊 서버 상태 분포 (대시보드 API):', {
        totalServers,
        onlineServers,
        warningServers,
        offlineServers,
        alertCount,
      });

      // 🎯 리소스 사용률 계산 - 서버 메트릭 기반
      let totalCpu = 0;
      let totalRam = 0;
      let totalDisk = 0;
      let bandwidth = 0;

      if (servers.length > 0) {
        // 대시보드 API 서버 데이터 구조에 맞게 계산
        totalCpu =
          servers.reduce((sum: number, s: any) => {
            const cpuValue = s.node_cpu_usage_percent || s.cpu_usage || 0;
            return sum + cpuValue;
          }, 0) / servers.length;

        totalRam =
          servers.reduce((sum: number, s: any) => {
            const memoryValue =
              s.node_memory_usage_percent || s.memory_usage || 0;
            return sum + memoryValue;
          }, 0) / servers.length;

        totalDisk =
          servers.reduce((sum: number, s: any) => {
            const diskValue = s.node_disk_usage_percent || s.disk_usage || 0;
            return sum + diskValue;
          }, 0) / servers.length;

        // 네트워크는 총합으로 계산 (대역폭)
        bandwidth = servers.reduce((sum: number, s: any) => {
          const networkIn = s.node_network_receive_rate_mbps || 0;
          const networkOut = s.node_network_transmit_rate_mbps || 0;
          return sum + networkIn + networkOut;
        }, 0);
      }

      // 🛡️ NaN 방지 및 안전한 값 설정
      const safeStats = {
        totalServers,
        onlineServers,
        offlineServers,
        alertCount,
        totalCpu: isNaN(totalCpu) ? 0 : Math.round(totalCpu),
        totalRam: isNaN(totalRam) ? 0 : Math.round(totalRam),
        totalDisk: isNaN(totalDisk) ? 0 : Math.round(totalDisk),
        bandwidth: isNaN(bandwidth) ? 0 : Math.round(bandwidth),
      };

      console.log('✅ 최종 통계:', safeStats);

      setStats(safeStats);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('❌ 서버 데이터 가져오기 실패:', error);
      setIsLoading(false);

      // 🛡️ 에러 시 기본값 설정
      setStats({
        totalServers: 0,
        onlineServers: 0,
        offlineServers: 0,
        alertCount: 0,
        totalCpu: 0,
        totalRam: 0,
        totalDisk: 0,
        bandwidth: 0,
      });
    }
  };

  // 120초마다 데이터 업데이트
  useEffect(() => {
    fetchServerData();
    // 🎯 데이터 생성기와 동기화: 30초 간격
    const interval = setInterval(fetchServerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBgColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (value >= 90) return 'bg-red-100';
    if (value >= 70) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className='text-center'>
          <RefreshCw className='w-8 h-8 text-blue-500 animate-spin mx-auto mb-2' />
          <p className='text-gray-600'>인프라 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 h-full overflow-auto ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h2 className='text-lg font-bold text-gray-800 flex items-center gap-2'>
            <Server className='w-5 h-5 text-blue-600' />
            🎛️ 인프라 전체 현황
          </h2>
          <p className='text-xs text-gray-600 mt-1'>
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchServerData}
          className='flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'
        >
          <RefreshCw className='w-3 h-3' />
          새로고침
        </motion.button>
      </div>

      {/* 메인 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-lg border border-gray-200 p-3 shadow-sm mb-3'
      >
        <h3 className='text-sm font-semibold text-gray-700 mb-2'>
          📊 전체 인프라 현황
        </h3>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2'>
          {/* 총 서버 수 */}
          <div className='text-center p-2 bg-blue-50 rounded-lg border border-blue-200'>
            <Server className='w-5 h-5 text-blue-600 mx-auto mb-1' />
            <div className='text-lg font-bold text-blue-600'>
              {stats.totalServers}
            </div>
            <div className='text-xs text-blue-500'>Total Servers</div>
          </div>

          {/* 온라인 서버 */}
          <div className='text-center p-2 bg-green-50 rounded-lg border border-green-200'>
            <Activity className='w-5 h-5 text-green-600 mx-auto mb-1' />
            <div className='text-lg font-bold text-green-600'>
              {stats.onlineServers}
            </div>
            <div className='text-xs text-green-500'>🟢 Online</div>
          </div>

          {/* 오프라인 서버 */}
          <div className='text-center p-2 bg-red-50 rounded-lg border border-red-200'>
            <Server className='w-5 h-5 text-red-600 mx-auto mb-1' />
            <div className='text-lg font-bold text-red-600'>
              {stats.offlineServers}
            </div>
            <div className='text-xs text-red-500'>🔴 Offline</div>
          </div>

          {/* 알림 수 */}
          <div className='text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200'>
            <RefreshCw className='w-5 h-5 text-yellow-600 mx-auto mb-1' />
            <div className='text-lg font-bold text-yellow-600'>
              {stats.alertCount}
            </div>
            <div className='text-xs text-yellow-500'>⚠️ Alerts</div>
          </div>
        </div>
      </motion.div>

      {/* 리소스 사용률 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-white rounded-lg border border-gray-200 p-3 shadow-sm'
      >
        <h3 className='text-sm font-semibold text-gray-700 mb-2'>
          💻 평균 리소스 사용률
        </h3>

        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2'>
          {/* CPU 사용률 */}
          <div
            className={`p-2 rounded-lg border ${getStatusBgColor(stats.totalCpu, 'cpu')}`}
          >
            <div className='flex items-center justify-between mb-1'>
              <Cpu
                className={`w-4 h-4 ${getStatusColor(stats.totalCpu, 'cpu')}`}
              />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalCpu, 'cpu')}`}
              >
                {formatPercentage(stats.totalCpu)}
              </span>
            </div>
            <div className='text-xs text-gray-600'>💻 Total CPU</div>
            <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalCpu >= 90
                    ? 'bg-red-500'
                    : stats.totalCpu >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalCpu, 100)}%` }}
              />
            </div>
          </div>

          {/* RAM 사용률 */}
          <div
            className={`p-2 rounded-lg border ${getStatusBgColor(stats.totalRam, 'memory')}`}
          >
            <div className='flex items-center justify-between mb-1'>
              <MemoryStick
                className={`w-4 h-4 ${getStatusColor(stats.totalRam, 'memory')}`}
              />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalRam, 'memory')}`}
              >
                {formatPercentage(stats.totalRam)}
              </span>
            </div>
            <div className='text-xs text-gray-600'>💾 Total RAM</div>
            <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalRam >= 90
                    ? 'bg-red-500'
                    : stats.totalRam >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalRam, 100)}%` }}
              />
            </div>
          </div>

          {/* Disk 사용률 */}
          <div
            className={`p-2 rounded-lg border ${getStatusBgColor(stats.totalDisk, 'disk')}`}
          >
            <div className='flex items-center justify-between mb-1'>
              <HardDrive
                className={`w-4 h-4 ${getStatusColor(stats.totalDisk, 'disk')}`}
              />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalDisk, 'disk')}`}
              >
                {formatPercentage(stats.totalDisk)}
              </span>
            </div>
            <div className='text-xs text-gray-600'>💿 Total Disk</div>
            <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalDisk >= 90
                    ? 'bg-red-500'
                    : stats.totalDisk >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalDisk, 100)}%` }}
              />
            </div>
          </div>

          {/* 네트워크 대역폭 */}
          <div className='p-2 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center justify-between mb-1'>
              <Wifi className='w-4 h-4 text-blue-600' />
              <span className='text-lg font-bold text-blue-600'>
                {stats.bandwidth}MB
              </span>
            </div>
            <div className='text-xs text-gray-600'>🌐 Bandwidth</div>
            <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
              <div
                className='h-1.5 rounded-full bg-blue-500 transition-all duration-500'
                style={{
                  width: `${Math.min((stats.bandwidth / 1000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
