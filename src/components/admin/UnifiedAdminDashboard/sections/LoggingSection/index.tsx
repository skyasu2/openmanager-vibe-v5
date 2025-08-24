/**
 * 🎯 로깅 섹션
 *
 * 시스템 로그 표시 및 관리
 */

import { useState } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
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
    <div className="space-y-6">
      {/* 로깅 상태 요약 */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold">로깅 시스템 상태</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  loggingStatus.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {loggingStatus.status === 'active' ? '활성' : '비활성'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
            <p className="text-xl font-semibold">
              {loggingStatus.status === 'active' ? '정상 작동' : '중지됨'}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
              총 로그
            </p>
            <p className="text-2xl font-semibold">
              {loggingStatus.totalLogs.toLocaleString()}
            </p>
            {loggingStatus.lastLogTime && (
              <p className="mt-1 text-xs text-gray-500">
                마지막:{' '}
                {new Date(loggingStatus.lastLogTime).toLocaleTimeString(
                  'ko-KR'
                )}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
              에러율
            </p>
            <p
              className="text-2xl font-semibold"
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
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
              <div
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
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
          <h3 className="text-lg font-semibold">로그 뷰어</h3>

          <div className="flex flex-col gap-3 md:flex-row">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="로그 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">전체</option>
                <option value="error">에러</option>
                <option value="warning">경고</option>
                <option value="info">정보</option>
              </select>
            </div>

            {/* 내보내기 */}
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700">
              <Download className="h-4 w-4" />
              내보내기
            </button>
          </div>
        </div>

        {/* 로그 리스트 플레이스홀더 */}
        <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-700">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            실시간 로그 스트리밍은 별도 구현이 필요합니다
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            WebSocket 또는 SSE를 통한 실시간 로그 표시
          </p>
        </div>
      </div>
    </div>
  );
}
