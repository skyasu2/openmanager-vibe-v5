'use client';

// framer-motion 제거 - CSS 애니메이션 사용
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
import ServerCardErrorBoundary from '@/components/error/ServerCardErrorBoundary';
import type { ServerDisplayMode } from '@/config/display-config';
import type { ViewMode } from '@/hooks/useServerDashboard';
import type { Server } from '@/types/server';
import ImprovedServerCard from '../ImprovedServerCard';

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
  servers: _servers,
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

    const pages: number[] = [];
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
      <div className="mt-6 flex items-center justify-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="이전 페이지"
        >
          <ChevronLeft size={16} />
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg border px-3 py-2 ${
              currentPage === page
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="다음 페이지"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 🆕 표시 정보 헤더 */}
      {displayInfo && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="text-blue-600" size={20} />
              <div>
                <p className="font-medium text-blue-900">
                  {displayInfo.statusMessage}
                </p>
                <p className="text-sm text-blue-700">
                  {displayInfo.modeDescription} •{' '}
                  {displayInfo.paginationMessage}
                </p>
              </div>
            </div>
            <div className="font-mono text-sm text-blue-600">
              {displayInfo.displayRange}
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          {/* 검색 */}
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="서버 이름 또는 위치 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              size={16}
            />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              aria-label="상태 필터"
            >
              <option value="all">모든 상태</option>
              <option value="online">정상</option>
              <option value="warning">경고</option>
              <option value="offline">오프라인</option>
            </select>
          </div>

          {/* 위치 필터 */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => onLocationFilterChange(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              aria-label="위치 필터"
            >
              <option value="all">모든 위치</option>
              {uniqueLocations.map((location) => (
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
              type="button"
              onClick={onResetFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              필터 리셋
            </button>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div className="flex items-center gap-4">
          {/* 🆕 표시 모드 선택 */}
          {onDisplayModeChange && (
            <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1">
              {displayModeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() =>
                      onDisplayModeChange(option.value as ServerDisplayMode)
                    }
                    className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs transition-colors ${
                      displayMode === option.value
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={option.label}
                  >
                    <IconComponent size={14} />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 뷰 모드 토글 */}
          <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="그리드 뷰"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="리스트 뷰"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 서버 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div
            key={`${viewMode}-${currentPage}-${displayMode}`}
            className={
              viewMode === 'grid'
                ? gridLayout?.className ||
                  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-4'
            }
          >
            {paginatedServers.map((server) => (
              <div key={server.id}>
                <ServerCardErrorBoundary
                  key={`boundary-dashboard-${server.id}`}
                >
                  <ImprovedServerCard
                    server={server}
                    onClick={() => onServerSelect(server)}
                    variant="compact"
                  />
                </ServerCardErrorBoundary>
              </div>
            ))}
          </div>

          {(!paginatedServers ||
            !Array.isArray(paginatedServers) ||
            paginatedServers.length === 0) && (
            <div className="py-12 text-center">
              <div className="text-lg text-gray-500">검색 결과가 없습니다</div>
              <div className="mt-2 text-sm text-gray-400">
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
