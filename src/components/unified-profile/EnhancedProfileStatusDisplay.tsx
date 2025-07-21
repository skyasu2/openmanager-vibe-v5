'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  Users,
  Server,
  Database,
  Zap,
  Brain,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';

interface EnhancedProfileStatusDisplayProps {
  compact?: boolean;
}

export function EnhancedProfileStatusDisplay({
  compact = false,
}: EnhancedProfileStatusDisplayProps) {
  const { status, isLoading, error, refresh } = useSystemStatus();
  const [showDetails, setShowDetails] = useState(false);

  // 업타임을 사람이 읽기 쉬운 형태로 변환
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 환경 표시 이름 변환
  const getEnvironmentDisplay = (env: string): string => {
    switch (env) {
      case 'production':
        return 'Production';
      case 'development':
        return 'Development';
      case 'test':
        return 'Test';
      default:
        return env;
    }
  };

  // 로딩 스켈레톤 UI
  if (isLoading) {
    return (
      <div
        data-testid='status-skeleton'
        className={`${compact ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg animate-pulse`}
      >
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 bg-gray-300 rounded-full' />
          <div className='w-20 h-4 bg-gray-300 rounded' />
        </div>
        {!compact && (
          <div className='mt-2 space-y-1'>
            <div className='w-16 h-3 bg-gray-300 rounded' />
            <div className='w-24 h-3 bg-gray-300 rounded' />
          </div>
        )}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div
        data-testid='error-display'
        className={`${compact ? 'p-2' : 'p-3'} bg-red-50 rounded-lg border border-red-200`}
      >
        <div className='flex items-center gap-2'>
          <AlertTriangle className='w-4 h-4 text-red-500' />
          <span className='text-sm text-red-700'>상태 확인 실패</span>
        </div>
        {!compact && <p className='text-xs text-red-600 mt-1'>{error}</p>}
      </div>
    );
  }

  const getStatusColor = () => {
    if (status?.isStarting) return 'text-yellow-500';
    if (status?.isRunning) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (status?.isStarting) return '시스템 시작 중...';
    if (status?.isRunning) return '시스템 실행 중';
    return '시스템 중지됨';
  };

  return (
    <div
      className={`${compact ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg`}
      data-testid={compact ? 'compact-layout' : 'full-layout'}
    >
      {/* 기본 상태 표시 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Activity
              data-testid='system-status-indicator'
              className={`w-4 h-4 ${getStatusColor()} ${
                status?.isRunning ? 'animate-pulse' : ''
              }`}
            />
            {status?.isStarting && (
              <div
                data-testid='loading-spinner'
                className='absolute inset-0 animate-spin'
              >
                <RefreshCw className='w-4 h-4 text-yellow-500' />
              </div>
            )}
          </div>
          <span className='text-sm font-medium text-gray-700'>
            {getStatusText()}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          {/* 새로고침 버튼 */}
          <button
            data-testid='refresh-button'
            onClick={refresh}
            className='p-1 hover:bg-gray-200 rounded transition-colors'
            title='상태 새로고침'
          >
            <RefreshCw className='w-3 h-3 text-gray-500' />
          </button>

          {/* 상세 정보 토글 */}
          {!compact && (
            <button
              data-testid='detail-toggle'
              onClick={() => setShowDetails(!showDetails)}
              className='p-1 hover:bg-gray-200 rounded transition-colors'
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-500 transition-transform ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* 컴팩트 모드가 아닐 때 기본 정보 표시 */}
      {!compact && status && (
        <div
          data-testid='full-layout'
          className='mt-2 grid grid-cols-2 gap-2 text-xs'
        >
          <div className='flex items-center gap-1'>
            <Users className='w-3 h-3 text-blue-500' />
            <span data-testid='user-count-display' className='text-gray-600'>
              접속자: {status.userCount || 0}명
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Server className='w-3 h-3 text-purple-500' />
            <span data-testid='version-display' className='text-gray-600'>
              v{status.version || '0.0.0'}
            </span>
          </div>

          {status.uptime > 0 && (
            <div className='flex items-center gap-1 col-span-2'>
              <Clock className='w-3 h-3 text-green-500' />
              <span data-testid='uptime-display' className='text-gray-600'>
                가동시간: {formatUptime(status.uptime)}
              </span>
            </div>
          )}

          <div className='flex items-center gap-1 col-span-2'>
            <span
              data-testid='environment-display'
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status.environment === 'production'
                  ? 'bg-green-100 text-green-700'
                  : status.environment === 'development'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {getEnvironmentDisplay(status.environment || 'unknown')}
            </span>
          </div>
        </div>
      )}

      {/* 상세 정보 (토글 가능) */}
      <AnimatePresence>
        {showDetails && !compact && (
          <motion.div
            data-testid='detailed-info'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='mt-3 pt-3 border-t border-gray-200'
          >
            <div className='text-xs text-gray-600 mb-2 font-medium'>
              서비스 상태
            </div>

            <div className='space-y-2'>
              {/* 데이터베이스 상태 */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Database className='w-3 h-3 text-blue-500' />
                  <span className='text-xs text-gray-700'>데이터베이스</span>
                </div>
                <div
                  data-testid='database-status'
                  className={`w-2 h-2 rounded-full ${
                    status?.services?.database ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {/* 캐시 상태 */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Zap className='w-3 h-3 text-yellow-500' />
                  <span className='text-xs text-gray-700'>캐시</span>
                </div>
                <div
                  data-testid='cache-status'
                  className={`w-2 h-2 rounded-full ${
                    status?.services?.cache ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {/* AI 서비스 상태 */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Brain className='w-3 h-3 text-purple-500' />
                  <span className='text-xs text-gray-700'>AI 서비스</span>
                </div>
                <div
                  data-testid='ai-status'
                  className={`w-2 h-2 rounded-full ${
                    status?.services?.ai ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* 마지막 업데이트 시간 */}
            {status?.lastUpdate && (
              <div className='mt-3 pt-2 border-t border-gray-200'>
                <div className='text-xs text-gray-500'>
                  마지막 업데이트:{' '}
                  {new Date(status.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
