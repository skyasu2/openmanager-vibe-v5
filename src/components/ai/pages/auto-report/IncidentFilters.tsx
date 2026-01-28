'use client';

import { Search, X } from 'lucide-react';
import { memo } from 'react';
import type { HistoryFilters } from './useIncidentHistory';

interface IncidentFiltersProps {
  searchInput: string;
  filters: HistoryFilters;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeverityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDateRangeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
}

export const IncidentFilters = memo(function IncidentFilters({
  searchInput,
  filters,
  onSearchChange,
  onSeverityChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
}: IncidentFiltersProps) {
  return (
    <div className="border-b border-gray-200 bg-white/50 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="보고서 검색..."
            value={searchInput}
            onChange={onSearchChange}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={filters.severity}
          onChange={onSeverityChange}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">모든 심각도</option>
          <option value="critical">심각</option>
          <option value="high">높음</option>
          <option value="medium">중간</option>
          <option value="low">낮음</option>
        </select>

        <select
          value={filters.status}
          onChange={onStatusChange}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">모든 상태</option>
          <option value="open">열림</option>
          <option value="investigating">조사중</option>
          <option value="resolved">해결됨</option>
          <option value="closed">종료</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={onDateRangeChange}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">전체 기간</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="90d">최근 90일</option>
        </select>

        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
          초기화
        </button>
      </div>
    </div>
  );
});
