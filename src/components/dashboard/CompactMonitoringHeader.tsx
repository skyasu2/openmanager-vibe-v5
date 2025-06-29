/**
 * 📊 컴팩트 모니터링 헤더 - UI 리팩토링 v1.0
 *
 * ✨ 기능:
 * - 모니터링 관련 정보만 상단 1/3 영역에 표시
 * - RealTime Hub, Pattern Matcher, Data Retention 통합
 * - 서버 대수 표시와 통합된 컴팩트 레이아웃
 * - 핵심 지표만 표시하는 정보 밀도 최적화
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  BarChart3,
  Monitor,
} from 'lucide-react';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';

interface CompactMonitoringHeaderProps {
  serverStats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  };
  onSettingsClick?: () => void;
  className?: string;
}

const StatusIndicator: React.FC<{
  isActive: boolean;
  label: string;
  value: string | number;
  icon: React.ElementType;
}> = ({ isActive, label, value, icon: Icon }) => (
  <div className='flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm'>
    <Icon
      className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-red-500'}`}
    />
    <div className='text-left'>
      <div className='text-xs text-gray-500 font-medium'>{label}</div>
      <div className='text-sm font-bold text-gray-900'>{value}</div>
    </div>
  </div>
);

const ServerCountCard: React.FC<{
  count: number;
  label: string;
  color: string;
}> = ({ count, label, color }) => (
  <div className='text-center'>
    <div className={`text-lg font-bold ${color}`}>{count}</div>
    <div className='text-xs text-gray-500'>{label}</div>
  </div>
);

export const CompactMonitoringHeader: React.FC<
  CompactMonitoringHeaderProps
> = ({ serverStats, onSettingsClick, className = '' }) => {
  const systemIntegration = useSystemIntegration();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // 5초마다 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`h-[33vh] bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-gray-200 ${className}`}
    >
      <div className='h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        {/* 헤더 타이틀 */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <Monitor className='w-6 h-6 text-blue-600' />
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                실시간 모니터링
              </h2>
              <p className='text-xs text-gray-500'>
                마지막 업데이트: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => setLastRefresh(new Date())}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all'
              title='새로고침'
            >
              <RefreshCw className='w-4 h-4' />
            </button>
            <button
              onClick={onSettingsClick}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all'
              title='설정'
            >
              <Settings className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-60px)]'>
          {/* 서버 통계 (왼쪽) */}
          <div className='lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm'>
            <div className='flex items-center gap-2 mb-3'>
              <BarChart3 className='w-5 h-5 text-blue-600' />
              <h3 className='font-semibold text-gray-900'>서버 현황</h3>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <ServerCountCard
                count={serverStats.total}
                label='전체'
                color='text-gray-700'
              />
              <ServerCountCard
                count={serverStats.online}
                label='온라인'
                color='text-green-600'
              />
              <ServerCountCard
                count={serverStats.warning}
                label='경고'
                color='text-orange-600'
              />
              <ServerCountCard
                count={serverStats.offline}
                label='오프라인'
                color='text-red-600'
              />
            </div>
          </div>

          {/* 모니터링 모듈 상태 (중앙) */}
          <div className='lg:col-span-6 space-y-3'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 h-full'>
              {/* RealTime Hub */}
              <StatusIndicator
                isActive={systemIntegration.realTimeHub.isConnected}
                label='RealTime Hub'
                value={`${systemIntegration.realTimeHub.connectionCount} 연결`}
                icon={
                  systemIntegration.realTimeHub.isConnected ? Wifi : WifiOff
                }
              />

              {/* Pattern Matcher */}
              <StatusIndicator
                isActive={systemIntegration.patternMatcher.isActive}
                label='Pattern Matcher'
                value={`${systemIntegration.patternMatcher.activeRules} 룰`}
                icon={Activity}
              />

              {/* Data Retention */}
              <StatusIndicator
                isActive={systemIntegration.dataRetention.isRunning}
                label='Data Retention'
                value={`${systemIntegration.dataRetention.activePolicies} 정책`}
                icon={Database}
              />
            </div>
          </div>

          {/* 시스템 요약 (오른쪽) */}
          <div className='lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm'>
            <h3 className='font-semibold text-gray-900 mb-3'>시스템 요약</h3>

            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>활성 모듈</span>
                <span className='font-medium'>
                  {systemIntegration.moduleCount.active}/
                  {systemIntegration.moduleCount.total}
                </span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>총 이벤트</span>
                <span className='font-medium'>
                  {systemIntegration.eventStats.total}
                </span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>심각 이벤트</span>
                <span className='font-medium text-red-600'>
                  {systemIntegration.eventStats.critical}
                </span>
              </div>

              <div className='flex justify-between'>
                <span className='text-gray-600'>응답 시간</span>
                <span className='font-medium'>
                  {systemIntegration.patternMatcher.averageProcessingTime}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
