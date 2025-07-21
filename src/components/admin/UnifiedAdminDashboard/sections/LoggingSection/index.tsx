/**
 * 🎯 로깅 섹션
 *
 * 시스템 로그 표시 및 관리
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Download, Search } from 'lucide-react';
import type { SystemStatus } from '../../UnifiedAdminDashboard.types';
import { STATUS_COLORS } from '../../UnifiedAdminDashboard.types';

interface LoggingSectionProps {
  loggingStatus: SystemStatus['logging'];
}

export default function LoggingSection({ loggingStatus }: LoggingSectionProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='space-y-6'>
      {/* 로깅 상태 요약 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold mb-4'>로깅 시스템 상태</h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <FileText className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  loggingStatus.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {loggingStatus.status === 'active' ? '활성' : '비활성'}
              </span>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>상태</p>
            <p className='text-xl font-semibold'>
              {loggingStatus.status === 'active' ? '정상 작동' : '중지됨'}
            </p>
          </div>

          <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              총 로그
            </p>
            <p className='text-2xl font-semibold'>
              {loggingStatus.totalLogs.toLocaleString()}
            </p>
            {loggingStatus.lastLogTime && (
              <p className='text-xs text-gray-500 mt-1'>
                마지막:{' '}
                {new Date(loggingStatus.lastLogTime).toLocaleTimeString(
                  'ko-KR'
                )}
              </p>
            )}
          </div>

          <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              에러율
            </p>
            <p
              className='text-2xl font-semibold'
              style={{
                color:
                  loggingStatus.errorRate < 5
                    ? STATUS_COLORS.healthy
                    : loggingStatus.errorRate < 10
                      ? STATUS_COLORS.warning
                      : STATUS_COLORS.critical,
              }}
            >
              {loggingStatus.errorRate}%
            </p>
            <div className='mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loggingStatus.errorRate}%` }}
                className={`h-full ${
                  loggingStatus.errorRate < 5
                    ? 'bg-green-500'
                    : loggingStatus.errorRate < 10
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 로그 필터 및 검색 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <div className='flex flex-col md:flex-row justify-between gap-4 mb-6'>
          <h3 className='text-lg font-semibold'>로그 뷰어</h3>

          <div className='flex flex-col md:flex-row gap-3'>
            {/* 검색 */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='로그 검색...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* 필터 */}
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-gray-600 dark:text-gray-400' />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>전체</option>
                <option value='error'>에러</option>
                <option value='warning'>경고</option>
                <option value='info'>정보</option>
              </select>
            </div>

            {/* 내보내기 */}
            <button className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
              <Download className='w-4 h-4' />
              내보내기
            </button>
          </div>
        </div>

        {/* 로그 리스트 플레이스홀더 */}
        <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center'>
          <FileText className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <p className='text-gray-600 dark:text-gray-400'>
            실시간 로그 스트리밍은 별도 구현이 필요합니다
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-500 mt-2'>
            WebSocket 또는 SSE를 통한 실시간 로그 표시
          </p>
        </div>
      </div>
    </div>
  );
}
