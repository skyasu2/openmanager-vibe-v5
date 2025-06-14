/**
 * 🎛️ Infrastructure Overview Page
 *
 * AI 에이전트 사이드바의 인프라 전체 현황 페이지
 * - 전체 서버 통계
 * - CPU, RAM, Disk, Bandwidth 현황
 * - 실시간 상태 업데이트 (10초 간격)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Activity,
  RefreshCw,
} from 'lucide-react';

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

  // 서버 데이터 가져오기
  const fetchServerData = async () => {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) throw new Error('Failed to fetch server data');

      const servers = await response.json();

      // 서버 통계 계산
      const totalServers = servers.length;
      const onlineServers = servers.filter(
        (s: any) => s.status === 'online'
      ).length;
      const offlineServers = totalServers - onlineServers;
      const alertCount = servers.filter(
        (s: any) => s.status === 'warning' || s.status === 'critical'
      ).length;

      // 평균 리소스 사용률 계산
      const totalCpu =
        servers.reduce((sum: number, s: any) => sum + (s.cpu || 0), 0) /
        totalServers;
      const totalRam =
        servers.reduce((sum: number, s: any) => sum + (s.memory || 0), 0) /
        totalServers;
      const totalDisk =
        servers.reduce((sum: number, s: any) => sum + (s.disk || 0), 0) /
        totalServers;
      const bandwidth = servers.reduce(
        (sum: number, s: any) => sum + (s.network || 0),
        0
      );

      setStats({
        totalServers,
        onlineServers,
        offlineServers,
        alertCount,
        totalCpu: Math.round(totalCpu),
        totalRam: Math.round(totalRam),
        totalDisk: Math.round(totalDisk),
        bandwidth: Math.round(bandwidth),
      });

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch server data:', error);
      setIsLoading(false);
    }
  };

  // 10초마다 데이터 업데이트
  useEffect(() => {
    fetchServerData();
    const interval = setInterval(fetchServerData, 10000); // 10초 간격
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
    <div className={`p-6 h-full overflow-auto ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <Server className='w-7 h-7 text-blue-600' />
            🎛️ 인프라 전체 현황
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchServerData}
          className='flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
        >
          <RefreshCw className='w-4 h-4' />
          새로고침
        </motion.button>
      </div>

      {/* 메인 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6'
      >
        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
          📊 전체 인프라 현황
        </h3>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* 총 서버 수 */}
          <div className='text-center p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <Server className='w-8 h-8 text-blue-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-blue-600'>
              {stats.totalServers}
            </div>
            <div className='text-sm text-blue-500'>Total Servers</div>
          </div>

          {/* 온라인 서버 */}
          <div className='text-center p-4 bg-green-50 rounded-lg border border-green-200'>
            <Activity className='w-8 h-8 text-green-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-green-600'>
              {stats.onlineServers}
            </div>
            <div className='text-sm text-green-500'>🟢 Online</div>
          </div>

          {/* 오프라인 서버 */}
          <div className='text-center p-4 bg-red-50 rounded-lg border border-red-200'>
            <Server className='w-8 h-8 text-red-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-red-600'>
              {stats.offlineServers}
            </div>
            <div className='text-sm text-red-500'>🔴 Offline</div>
          </div>

          {/* 알림 수 */}
          <div className='text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
            <RefreshCw className='w-8 h-8 text-yellow-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.alertCount}
            </div>
            <div className='text-sm text-yellow-500'>⚠️ Alerts</div>
          </div>
        </div>
      </motion.div>

      {/* 리소스 사용률 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
      >
        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
          💻 평균 리소스 사용률
        </h3>

        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4'>
          {/* CPU 사용률 */}
          <div
            className={`p-4 rounded-lg border ${getStatusBgColor(stats.totalCpu, 'cpu')}`}
          >
            <div className='flex items-center justify-between mb-2'>
              <Cpu
                className={`w-6 h-6 ${getStatusColor(stats.totalCpu, 'cpu')}`}
              />
              <span
                className={`text-2xl font-bold ${getStatusColor(stats.totalCpu, 'cpu')}`}
              >
                {stats.totalCpu}%
              </span>
            </div>
            <div className='text-sm text-gray-600'>💻 Total CPU</div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
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
            className={`p-4 rounded-lg border ${getStatusBgColor(stats.totalRam, 'memory')}`}
          >
            <div className='flex items-center justify-between mb-2'>
              <MemoryStick
                className={`w-6 h-6 ${getStatusColor(stats.totalRam, 'memory')}`}
              />
              <span
                className={`text-2xl font-bold ${getStatusColor(stats.totalRam, 'memory')}`}
              >
                {stats.totalRam}%
              </span>
            </div>
            <div className='text-sm text-gray-600'>💾 Total RAM</div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
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
            className={`p-4 rounded-lg border ${getStatusBgColor(stats.totalDisk, 'disk')}`}
          >
            <div className='flex items-center justify-between mb-2'>
              <HardDrive
                className={`w-6 h-6 ${getStatusColor(stats.totalDisk, 'disk')}`}
              />
              <span
                className={`text-2xl font-bold ${getStatusColor(stats.totalDisk, 'disk')}`}
              >
                {stats.totalDisk}%
              </span>
            </div>
            <div className='text-sm text-gray-600'>💿 Total Disk</div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
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
          <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center justify-between mb-2'>
              <Wifi className='w-6 h-6 text-blue-600' />
              <span className='text-2xl font-bold text-blue-600'>
                {stats.bandwidth}MB
              </span>
            </div>
            <div className='text-sm text-gray-600'>🌐 Bandwidth</div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className='h-2 rounded-full bg-blue-500 transition-all duration-500'
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
