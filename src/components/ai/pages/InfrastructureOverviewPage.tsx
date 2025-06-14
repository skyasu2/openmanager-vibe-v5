/**
 * 🎛️ Infrastructure Overview Page
 *
 * AI 에이전트 사이드바의 인프라 전체 현황 페이지
 * - 전체 서버 통계
 * - CPU, RAM, Disk, Bandwidth 현황
 * - 실시간 상태 업데이트
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
    totalServers: 8,
    onlineServers: 7,
    offlineServers: 1,
    alertCount: 3,
    totalCpu: 34,
    totalRam: 62,
    totalDisk: 43,
    bandwidth: 127,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalCpu: Math.max(
          10,
          Math.min(95, prev.totalCpu + (Math.random() - 0.5) * 10)
        ),
        totalRam: Math.max(
          20,
          Math.min(90, prev.totalRam + (Math.random() - 0.5) * 8)
        ),
        totalDisk: Math.max(
          10,
          Math.min(80, prev.totalDisk + (Math.random() - 0.5) * 5)
        ),
        bandwidth: Math.max(
          50,
          Math.min(200, prev.bandwidth + (Math.random() - 0.5) * 30)
        ),
      }));
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);

    // API 호출 시뮬레이션
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        totalCpu: Math.floor(Math.random() * 60) + 20,
        totalRam: Math.floor(Math.random() * 50) + 30,
        totalDisk: Math.floor(Math.random() * 40) + 20,
        bandwidth: Math.floor(Math.random() * 100) + 80,
        alertCount: Math.floor(Math.random() * 5),
      }));
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (value: number, type: 'cpu' | 'ram' | 'disk') => {
    if (type === 'cpu' || type === 'ram') {
      if (value > 80) return 'text-red-500';
      if (value > 60) return 'text-yellow-500';
      return 'text-green-500';
    }
    if (type === 'disk') {
      if (value > 70) return 'text-red-500';
      if (value > 50) return 'text-yellow-500';
      return 'text-green-500';
    }
  };

  const getStatusBg = (value: number, type: 'cpu' | 'ram' | 'disk') => {
    if (type === 'cpu' || type === 'ram') {
      if (value > 80) return 'bg-red-100';
      if (value > 60) return 'bg-yellow-100';
      return 'bg-green-100';
    }
    if (type === 'disk') {
      if (value > 70) return 'bg-red-100';
      if (value > 50) return 'bg-yellow-100';
      return 'bg-green-100';
    }
  };

  return (
    <div className={`h-full flex flex-col p-4 bg-gray-50 ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center'>
              <Server className='w-4 h-4 text-white' />
            </div>
            인프라 전체 현황
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className='p-2 bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 disabled:opacity-50'
          title='데이터 새로고침'
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* 메인 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6'
      >
        <div className='text-center mb-4'>
          <h3 className='text-lg font-semibold text-gray-700 mb-4'>
            🏗️ 인프라 전체 현황
          </h3>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          {/* 서버 통계 */}
          <div className='bg-blue-50 rounded-lg p-3'>
            <div className='flex items-center gap-2 mb-2'>
              <Server className='w-4 h-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-800'>
                서버 현황
              </span>
            </div>
            <div className='space-y-1 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>📊 Total Servers:</span>
                <span className='font-bold'>{stats.totalServers}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>🟢 Online:</span>
                <span className='font-bold text-green-600'>
                  {stats.onlineServers}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>🔴 Offline:</span>
                <span className='font-bold text-red-600'>
                  {stats.offlineServers}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>⚠️ Alerts:</span>
                <span className='font-bold text-amber-600'>
                  {stats.alertCount}
                </span>
              </div>
            </div>
          </div>

          {/* 리소스 통계 */}
          <div className='bg-purple-50 rounded-lg p-3'>
            <div className='flex items-center gap-2 mb-2'>
              <Activity className='w-4 h-4 text-purple-600' />
              <span className='text-sm font-medium text-purple-800'>
                리소스 현황
              </span>
            </div>
            <div className='space-y-1 text-sm'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>💻 Total CPU:</span>
                <div className='flex items-center gap-1'>
                  <span
                    className={`font-bold ${getStatusColor(stats.totalCpu, 'cpu')}`}
                  >
                    {stats.totalCpu}%
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusBg(stats.totalCpu, 'cpu')}`}
                  ></div>
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>💾 Total RAM:</span>
                <div className='flex items-center gap-1'>
                  <span
                    className={`font-bold ${getStatusColor(stats.totalRam, 'ram')}`}
                  >
                    {stats.totalRam}%
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusBg(stats.totalRam, 'ram')}`}
                  ></div>
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>💿 Total Disk:</span>
                <div className='flex items-center gap-1'>
                  <span
                    className={`font-bold ${getStatusColor(stats.totalDisk, 'disk')}`}
                  >
                    {stats.totalDisk}%
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusBg(stats.totalDisk, 'disk')}`}
                  ></div>
                </div>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>🌐 Bandwidth:</span>
                <span className='font-bold text-blue-600'>
                  {stats.bandwidth}MB
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 상세 메트릭 */}
      <div className='grid grid-cols-2 gap-3 flex-1'>
        {/* CPU 상세 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-lg border p-3 shadow-sm'
        >
          <div className='flex items-center gap-2 mb-3'>
            <Cpu className='w-4 h-4 text-blue-600' />
            <span className='text-sm font-medium'>CPU 사용률</span>
          </div>
          <div className='text-center'>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.totalCpu, 'cpu')}`}
            >
              {stats.totalCpu}%
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.totalCpu > 80
                    ? 'bg-red-500'
                    : stats.totalCpu > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${stats.totalCpu}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* RAM 상세 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-lg border p-3 shadow-sm'
        >
          <div className='flex items-center gap-2 mb-3'>
            <MemoryStick className='w-4 h-4 text-purple-600' />
            <span className='text-sm font-medium'>메모리 사용률</span>
          </div>
          <div className='text-center'>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.totalRam, 'ram')}`}
            >
              {stats.totalRam}%
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.totalRam > 80
                    ? 'bg-red-500'
                    : stats.totalRam > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${stats.totalRam}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Disk 상세 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className='bg-white rounded-lg border p-3 shadow-sm'
        >
          <div className='flex items-center gap-2 mb-3'>
            <HardDrive className='w-4 h-4 text-green-600' />
            <span className='text-sm font-medium'>디스크 사용률</span>
          </div>
          <div className='text-center'>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.totalDisk, 'disk')}`}
            >
              {stats.totalDisk}%
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.totalDisk > 70
                    ? 'bg-red-500'
                    : stats.totalDisk > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${stats.totalDisk}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Bandwidth 상세 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-white rounded-lg border p-3 shadow-sm'
        >
          <div className='flex items-center gap-2 mb-3'>
            <Wifi className='w-4 h-4 text-indigo-600' />
            <span className='text-sm font-medium'>네트워크 대역폭</span>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-indigo-600'>
              {stats.bandwidth}MB
            </div>
            <div className='text-xs text-gray-500 mt-1'>실시간 사용량</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
