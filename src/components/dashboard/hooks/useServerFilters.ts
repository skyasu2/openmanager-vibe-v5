/**
 * 🔍 useServerFilters Hook
 *
 * ⚠️ 중요: 이 파일은 ServerDashboard 핵심 모듈입니다 - 삭제 금지!
 *
 * 서버 필터링 전용 훅
 * - 검색, 상태, 위치 필터링
 * - 필터 상태 관리
 * - 디바운싱 적용 (300ms)
 *
 * 📍 사용처:
 * - src/components/dashboard/ServerDashboard.tsx (검색 및 필터 기능)
 * - src/components/dashboard/server-dashboard/ServerDashboardServers.tsx
 * - 향후 서버 검색 관련 컴포넌트들
 *
 * 🔄 의존성:
 * - ../types/dashboard.types (ServerFilters, ViewMode 타입)
 * - ../../../types/server (Server 타입)
 * - React hooks (useState, useCallback, useMemo, useEffect)
 *
 * 📅 생성일: 2025.06.14 (ServerDashboard 1522줄 분리 작업)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Server } from '../../../types/server';
import { ServerFilters, ViewMode } from '../types/dashboard.types';

// 간단한 디바운스 훅 구현
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const useServerFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'online' | 'offline' | 'warning' | 'all'
  >('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // 검색어 디바운싱 (300ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 현재 필터 상태
  const currentFilters: ServerFilters = useMemo(
    () => ({
      status: statusFilter,
      location: locationFilter,
      searchTerm: debouncedSearchTerm,
    }),
    [statusFilter, locationFilter, debouncedSearchTerm]
  );

  // 서버 필터링 함수
  const filterServers = useCallback(
    (servers: Server[]): Server[] => {
      return servers.filter(server => {
        // 상태 필터
        if (
          currentFilters.status &&
          currentFilters.status !== 'all' &&
          server.status !== currentFilters.status
        ) {
          return false;
        }

        // 위치 필터
        if (
          currentFilters.location &&
          !server.location
            .toLowerCase()
            .includes(currentFilters.location.toLowerCase())
        ) {
          return false;
        }

        // 검색어 필터
        if (currentFilters.searchTerm) {
          const searchLower = currentFilters.searchTerm.toLowerCase();
          return (
            server.name.toLowerCase().includes(searchLower) ||
            server.location.toLowerCase().includes(searchLower) ||
            server.id.toLowerCase().includes(searchLower)
          );
        }

        return true;
      });
    },
    [currentFilters]
  );

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('');
  }, []);

  // 활성 필터 개수
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentFilters.status && currentFilters.status !== 'all') count++;
    if (currentFilters.location) count++;
    if (currentFilters.searchTerm) count++;
    return count;
  }, [currentFilters]);

  // 필터가 적용되었는지 확인
  const hasActiveFilters = activeFiltersCount > 0;

  // 위치 목록 추출 (서버 목록에서)
  const getUniqueLocations = useCallback((servers: Server[]): string[] => {
    const locations = servers.map(server => server.location);
    return Array.from(new Set(locations)).sort();
  }, []);

  return {
    // 필터 상태
    searchTerm,
    statusFilter,
    locationFilter,
    viewMode,
    currentFilters,

    // 필터 설정 함수
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    setViewMode,

    // 필터링 함수
    filterServers,
    resetFilters,
    getUniqueLocations,

    // 필터 상태 정보
    activeFiltersCount,
    hasActiveFilters,
  };
};
