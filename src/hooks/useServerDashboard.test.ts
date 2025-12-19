/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 useServerDashboard Hook 테스트
 *
 * @description 서버 대시보드 로직의 핵심 Hook 테스트 (데이터 로드, 페이지네이션, 선택 로직)
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerDashboard } from '../../../src/hooks/useServerDashboard';

// Mock React Query hook
vi.mock('../../../src/hooks/useServerQuery', () => ({
  useServerQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../../src/hooks/dashboard/useServerDataCache', () => ({
  useServerDataCache: vi.fn(() => ({ cachedServers: [] })),
}));

vi.mock('../../../src/hooks/dashboard/useResponsivePageSize', () => ({
  useResponsivePageSize: vi.fn(() => ({
    pageSize: 12,
    setPageSize: vi.fn(),
  })),
}));

vi.mock('../../../src/hooks/dashboard/useServerPagination', () => ({
  useServerPagination: vi.fn(() => ({
    paginatedItems: [],
    totalPages: 1,
    currentPage: 1,
    setCurrentPage: vi.fn(),
    setPageSize: vi.fn(),
  })),
}));

vi.mock('../../../src/hooks/dashboard/useServerStats', () => ({
  useServerStats: vi.fn(() => ({
    stats: { total: 0, online: 0, warning: 0, offline: 0, unknown: 0 },
  })),
}));

vi.mock('../../../src/hooks/useServerMetrics', () => ({
  useServerMetrics: vi.fn(() => ({
    metricsHistory: [],
  })),
}));

vi.mock('../../../src/utils/dashboard/server-transformer', () => ({
  transformServerData: vi.fn((data) => data),
}));

// Mock timer functions
vi.useFakeTimers();

describe('📊 useServerDashboard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Lifecycle & Initialization', () => {
    it('초기화 시 에러 없이 렌더링된다', () => {
      const { result } = renderHook(() => useServerDashboard());
      expect(result.current).toBeDefined();
      expect(result.current.servers).toBeDefined();
      expect(Array.isArray(result.current.servers)).toBe(true);
    });

    it('기본 상태값들이 올바르게 설정된다', () => {
      const { result } = renderHook(() => useServerDashboard());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedServer).toBeNull();
    });
  });

  describe('Server Selection', () => {
    const mockServer = {
      id: 'server-1',
      name: 'Test Server',
      status: 'online',
      metrics: { cpu: 50, memory: 60, disk: 70, network: 80 },
    };

    it('서버를 선택할 수 있다', () => {
      const { result } = renderHook(() => useServerDashboard());

      act(() => {
        result.current.handleServerSelect(mockServer as any);
      });

      expect(result.current.selectedServer).toEqual(mockServer);
    });

    it('선택된 서버를 해제(모달 닫기)할 수 있다', () => {
      const { result } = renderHook(() => useServerDashboard());

      // Select first
      act(() => {
        result.current.handleServerSelect(mockServer as any);
      });
      expect(result.current.selectedServer).toEqual(mockServer);

      // Deselect
      act(() => {
        result.current.handleModalClose();
      });
      expect(result.current.selectedServer).toBeNull();
    });
  });

  describe('Metrics Calculation', () => {
    const mockServerWithMetrics = {
      id: 'server-1',
      name: 'Test Server',
      status: 'online',
      cpu: 45,
      memory: 60,
      disk: 75,
      network: 30,
      uptime: 1000,
    };

    it('선택된 서버의 메트릭을 계산하여 반환한다', () => {
      const { result } = renderHook(() => useServerDashboard());

      act(() => {
        result.current.handleServerSelect(mockServerWithMetrics as any);
      });

      const metrics = result.current.selectedServerMetrics;
      expect(metrics).toBeDefined();
      expect(metrics?.cpu).toBe(45);
      expect(metrics?.memory).toBe(60);
      expect(metrics?.disk).toBe(75);
      expect(metrics?.network).toBe(30);
    });

    it('서버가 선택되지 않았으면 메트릭은 null이다', () => {
      const { result } = renderHook(() => useServerDashboard());
      expect(result.current.selectedServerMetrics).toBeNull();
    });
  });

  describe('Loading State Optimization', () => {
    it('로딩 중이고 데이터가 없으면 isLoading은 true이다', async () => {
      // Dynamically import to re-mock
      const { useServerQuery } = await import(
        '../../../src/hooks/useServerQuery'
      );
      vi.mocked(useServerQuery).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as ReturnType<typeof useServerQuery>);

      const { result } = renderHook(() => useServerDashboard());
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('currentPage와 totalPages가 제공된다', () => {
      const { result } = renderHook(() => useServerDashboard());

      expect(result.current.currentPage).toBeDefined();
      expect(result.current.totalPages).toBeDefined();
      expect(typeof result.current.setCurrentPage).toBe('function');
    });

    it('pageSize 변경 핸들러가 제공된다', () => {
      const { result } = renderHook(() => useServerDashboard());

      expect(typeof result.current.changePageSize).toBe('function');
      expect(result.current.pageSize).toBeDefined();
    });
  });

  describe('Stats', () => {
    it('서버 통계가 제공된다', () => {
      const { result } = renderHook(() => useServerDashboard());

      expect(result.current.stats).toBeDefined();
      expect(result.current.stats.total).toBeDefined();
      expect(result.current.stats.online).toBeDefined();
      expect(result.current.stats.warning).toBeDefined();
      expect(result.current.stats.offline).toBeDefined();
    });
  });
});
