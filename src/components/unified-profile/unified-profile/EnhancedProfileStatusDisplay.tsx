/**
 * 🟢 TDD Green - 강화된 프로필 시스템 상태 표시 컴포넌트
 *
 * @description
 * 테스트를 통과하는 최소한의 기능을 구현합니다.
 * 추후 Refactor 단계에서 개선될 예정입니다.
 *
 * @features
 * - 실시간 시스템 상태 표시
 * - 사용자 수 표시
 * - 시스템 버전 정보
 * - 업타임 표시
 * - 환경 정보
 * - 서비스 상태
 */

'use client';

import { useSystemStatus } from '@/hooks/useSystemStatus';
import {
  formatEnvironment,
  formatUptime,
  getStatusStyle,
  getStatusText,
} from '@/utils/system-status-formatters';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Clock,
  Database,
  Globe,
  Loader2,
  RefreshCw,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface EnhancedProfileStatusDisplayProps {
  compact?: boolean;
}

// 유틸리티 함수들은 @/utils/system-status-formatters에서 import됩니다

export const EnhancedProfileStatusDisplay: React.FC<
  EnhancedProfileStatusDisplayProps
> = ({ compact = false }) => {
  const { status, isLoading, error, refresh } = useSystemStatus();
  const [showDetails, setShowDetails] = useState(false);

  // 로딩 중일 때 스켈레톤 UI
  if (isLoading) {
    return (
      <div data-testid='status-skeleton' className='p-4 space-y-3'>
        <div className='animate-pulse space-y-2'>
          <div className='h-4 bg-gray-300 rounded w-3/4'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2'></div>
          <div className='h-3 bg-gray-300 rounded w-2/3'></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div data-testid='error-display' className='p-4 text-red-500'>
        <div className='flex items-center gap-2'>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // 유틸리티 함수들을 사용하여 상태를 처리합니다

  // 컴팩트 레이아웃
  if (compact) {
    return (
      <div data-testid='compact-layout' className='p-2 space-y-1 text-xs'>
        <div className='flex items-center gap-2'>
          <Activity
            size={12}
            className={getStatusStyle(status.isRunning, status.isStarting)}
            data-testid='system-status-indicator'
          />
          <span className='font-medium'>
            {getStatusText(status.isRunning, status.isStarting)}
          </span>
        </div>
        {status.userCount !== undefined && (
          <div data-testid='user-count-display'>
            접속자: {status.userCount}명
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='p-4 space-y-4 bg-white/50 dark:bg-gray-800/50 rounded-lg'>
      {/* 메인 상태 표시 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Activity
            size={20}
            className={getStatusStyle(status.isRunning, status.isStarting)}
            data-testid='system-status-indicator'
          />
          <div>
            <div className='font-medium'>
              {getStatusText(status.isRunning, status.isStarting)}
            </div>
            {status.isStarting && (
              <Loader2
                size={16}
                className='animate-spin'
                data-testid='loading-spinner'
              />
            )}
          </div>
        </div>

        <button
          onClick={refresh}
          data-testid='refresh-button'
          title='상태 새로고침'
          aria-label='시스템 상태 새로고침'
          className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors'
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 기본 정보 */}
      <div className='grid grid-cols-2 gap-4 text-sm'>
        {status.userCount !== undefined && (
          <div
            className='flex items-center gap-2'
            data-testid='user-count-display'
          >
            <Users size={16} className='text-blue-500' />
            <span>접속자: {status.userCount}명</span>
          </div>
        )}

        {status.version && (
          <div
            className='flex items-center gap-2'
            data-testid='version-display'
          >
            <Tag size={16} className='text-purple-500' />
            <span>v{status.version}</span>
          </div>
        )}

        {status.uptime !== undefined && (
          <div className='flex items-center gap-2' data-testid='uptime-display'>
            <Clock size={16} className='text-orange-500' />
            <span>가동시간: {formatUptime(status.uptime)}</span>
          </div>
        )}

        {status.environment && (
          <div
            className='flex items-center gap-2'
            data-testid='environment-display'
          >
            <Globe size={16} className='text-green-500' />
            <span>{formatEnvironment(status.environment)}</span>
          </div>
        )}
      </div>

      {/* 상세 정보 토글 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        data-testid='detail-toggle'
        className='flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
      >
        <span>상세 정보</span>
        <ChevronDown
          size={16}
          className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 상세 정보 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          data-testid='detailed-info'
          className='space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700'
        >
          {/* 서비스 상태 */}
          {status.services && (
            <div className='space-y-2'>
              <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                서비스 상태
              </div>
              <div className='grid grid-cols-3 gap-2 text-xs'>
                <div className='flex items-center gap-2'>
                  <Database
                    size={14}
                    className={
                      status.services.database
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                    data-testid='database-status'
                  />
                  <span>DB</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Zap
                    size={14}
                    className={
                      status.services.cache ? 'text-green-500' : 'text-red-500'
                    }
                    data-testid='cache-status'
                  />
                  <span>Cache</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Activity
                    size={14}
                    className={
                      status.services.ai ? 'text-green-500' : 'text-red-500'
                    }
                    data-testid='ai-status'
                  />
                  <span>AI</span>
                </div>
              </div>
            </div>
          )}

          {/* 마지막 업데이트 */}
          {status.lastUpdate && (
            <div className='text-xs text-gray-500'>
              마지막 업데이트:{' '}
              {new Date(status.lastUpdate).toLocaleString('ko-KR')}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
