'use client';

import { type ServerDisplayMode } from '@/config/display-config';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  Info,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import { ViewMode } from '../../../hooks/useServerDashboard';
import { Server } from '../../../types/server';
import ServerCard from '../ServerCard';

interface ServerDashboardServersProps {
  servers: Server[];
  paginatedServers: Server[];
  viewMode: ViewMode;
  displayMode?: ServerDisplayMode;
  searchTerm: string;
  statusFilter: string;
  locationFilter: string;
  uniqueLocations: string[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;

  // 🆕 UI/UX 개선 props
  displayInfo?: {
    totalServers: number;
    displayedCount: number;
    statusMessage: string;
    paginationMessage: string;
    modeDescription: string;
    displayRange: string;
  };
  gridLayout?: {
    className: string;
    cols: number;
    rows: number;
  };

  onViewModeChange: (mode: ViewMode) => void;
  onDisplayModeChange?: (mode: ServerDisplayMode) => void;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onLocationFilterChange: (location: string) => void;
  onServerSelect: (server: Server) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export function ServerDashboardServers({
  servers,
  paginatedServers,
  viewMode,
  displayMode = 'SHOW_TWO_ROWS',
  searchTerm,
  statusFilter,
  locationFilter,
  uniqueLocations,
  currentPage,
  totalPages,
  isLoading,
  displayInfo,
  gridLayout,
  onViewModeChange,
  onDisplayModeChange,
  onSearchChange,
  onStatusFilterChange,
  onLocationFilterChange,
  onServerSelect,
  onPageChange,
  onResetFilters,
}: ServerDashboardServersProps) {
  // 🎯 표시 모드 옵션
  const displayModeOptions = [
    { value: 'SHOW_TWO_ROWS', label: '2줄 표시', icon: Grid3X3 },
    { value: 'SHOW_ALL', label: '전체 표시', icon: LayoutGrid },
    { value: 'SHOW_HALF', label: '8개씩', icon: BarChart3 },
    { value: 'SHOW_QUARTER', label: '4개씩', icon: BarChart3 },
  ];

  // 🎯 페이지네이션 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className='flex items-center justify-center space-x-2 mt-6'>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          aria-label='이전 페이지'
        >
          <ChevronLeft size={16} />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className='px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50'
            >
              1
            </button>
            {startPage > 2 && <span className='px-2'>...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg border ${
              currentPage === page
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className='px-2'>...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className='px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50'
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          aria-label='다음 페이지'
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* 🆕 표시 정보 헤더 */}
      {displayInfo && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Info className='text-blue-600' size={20} />
              <div>
                <p className='text-blue-900 font-medium'>
                  {displayInfo.statusMessage}
                </p>
                <p className='text-blue-700 text-sm'>
                  {displayInfo.modeDescription} •{' '}
                  {displayInfo.paginationMessage}
                </p>
              </div>
            </div>
            <div className='text-blue-600 text-sm font-mono'>
              {displayInfo.displayRange}
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
        <div className='flex flex-col sm:flex-row gap-4 flex-1'>
          {/* 검색 */}
          <div className='relative flex-1 max-w-md'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              size={20}
            />
            <input
              type='text'
              placeholder='서버 이름 또는 위치 검색...'
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* 상태 필터 */}
          <div className='relative'>
            <Filter
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              size={16}
            />
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              className='pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'
              aria-label='상태 필터'
            >
              <option value='all'>모든 상태</option>
              <option value='online'>정상</option>
              <option value='warning'>경고</option>
              <option value='offline'>오프라인</option>
            </select>
          </div>

          {/* 위치 필터 */}
          <div className='relative'>
            <select
              value={locationFilter}
              onChange={e => onLocationFilterChange(e.target.value)}
              className='pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'
              aria-label='위치 필터'
            >
              <option value='all'>모든 위치</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* 필터 리셋 */}
          {(searchTerm ||
            statusFilter !== 'all' ||
            locationFilter !== 'all') && (
            <button
              onClick={onResetFilters}
              className='px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              필터 리셋
            </button>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div className='flex items-center gap-4'>
          {/* 🆕 표시 모드 선택 */}
          {onDisplayModeChange && (
            <div className='flex items-center space-x-2 bg-gray-100 rounded-lg p-1'>
              {displayModeOptions.map(option => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      onDisplayModeChange(option.value as ServerDisplayMode)
                    }
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs transition-colors ${
                      displayMode === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={option.label}
                  >
                    <IconComponent size={14} />
                    <span className='hidden sm:inline'>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 뷰 모드 토글 */}
          <div className='flex items-center space-x-2 bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label='그리드 뷰'
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label='리스트 뷰'
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 서버 목록 */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      ) : (
        <>
          <AnimatePresence mode='wait'>
            <motion.div
              key={`${viewMode}-${currentPage}-${displayMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={
                viewMode === 'grid'
                  ? gridLayout?.className ||
                    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {paginatedServers.map((server, index) => (
                <motion.div
                  key={server.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ServerCard
                    server={server}
                    onClick={() => onServerSelect(server)}
                    variant='compact'
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {paginatedServers.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-500 text-lg'>검색 결과가 없습니다</div>
              <div className='text-gray-400 text-sm mt-2'>
                다른 검색어나 필터를 시도해보세요
              </div>
            </div>
          )}

          {/* 페이지네이션 */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}
