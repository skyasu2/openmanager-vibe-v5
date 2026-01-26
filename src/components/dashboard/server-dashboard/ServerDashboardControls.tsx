'use client';

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import { LayoutGrid, List, Search } from 'lucide-react';
import type { ViewMode } from '../types/dashboard.types';

interface ServerDashboardControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  locationFilter: string;
  onLocationFilterChange: (location: string) => void;
  uniqueLocations: string[];
  onResetFilters: () => void;
}

export function ServerDashboardControls({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  locationFilter,
  onLocationFilterChange,
  uniqueLocations,
  onResetFilters,
}: ServerDashboardControlsProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex w-full flex-1 flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by server name or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="appearance-none rounded-lg border border-gray-700 bg-gray-900 py-2 pl-4 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            aria-label="Status Filter"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="relative">
          <select
            value={locationFilter}
            onChange={(e) => onLocationFilterChange(e.target.value)}
            className="appearance-none rounded-lg border border-gray-700 bg-gray-900 py-2 pl-4 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            aria-label="Location Filter"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Reset
          </button>
        )}
      </div>

      {/* View Mode */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <LayoutGrid size={20} />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <List size={20} />
        </button>
      </div>
    </div>
  );
}
