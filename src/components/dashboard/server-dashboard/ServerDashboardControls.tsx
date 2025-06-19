'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { ViewMode } from '@/types/dashboard';

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
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by server name or location..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
            onChange={e => onLocationFilterChange(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            aria-label="Location Filter"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800"
          >
            Reset
          </button>
        )}
      </div>

      {/* View Mode */}
      <div className="flex items-center space-x-2">
        <button onClick={() => onViewModeChange('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
          <LayoutGrid size={20} />
        </button>
        <button onClick={() => onViewModeChange('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
          <List size={20} />
        </button>
      </div>
    </div>
  );
} 