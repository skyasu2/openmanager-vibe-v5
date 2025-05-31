import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useServers, useServerStats } from './useServerQueries';
import { createTestQueryClient, mockServerData, createMockResponse } from '@/testing/setup';

// Test wrapper component for React Query
function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useServerQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useServers', () => {
    it('서버 목록을 성공적으로 가져와야 함', async () => {
      // Mock fetch response
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(mockServerData)
      );
      global.fetch = mockFetch;

      const { result } = renderHook(() => useServers(), {
        wrapper: createWrapper(),
      });

      // 초기 로딩 상태 확인
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // 데이터 로드 완료 대기
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 결과 검증
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0]).toMatchObject({
        id: 'test-server-1',
        name: 'test-web-01',
        status: 'healthy',
        location: 'test',
        type: 'WEB',
      });

      // API 호출 검증
      expect(mockFetch).toHaveBeenCalledWith('/api/servers');
    });

    it('API 에러 시 에러 상태를 반환해야 함', async () => {
      // Mock fetch error
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(null, false)
      );
      global.fetch = mockFetch;

      const { result } = renderHook(() => useServers(), {
        wrapper: createWrapper(),
      });

      // 에러 상태 대기
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
    });

    it('필터링이 올바르게 동작해야 함', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(mockServerData)
      );
      global.fetch = mockFetch;

      const filters = { status: 'healthy', search: 'web' };
      const { result } = renderHook(() => useServers(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 필터링 결과 확인
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].name).toBe('test-web-01');
      expect(result.current.data[0].status).toBe('healthy');
    });
  });

  describe('useServerStats', () => {
    it('서버 통계를 올바르게 계산해야 함', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(mockServerData)
      );
      global.fetch = mockFetch;

      const { result } = renderHook(() => useServerStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 통계 검증
      expect(result.current.stats).toEqual({
        total: 2,
        online: 1, // healthy 상태
        warning: 1, // warning 상태
        offline: 0, // critical 상태
      });

      expect(result.current.servers).toHaveLength(2);
    });

    it('빈 데이터에 대해 0 통계를 반환해야 함', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({ success: true, data: { servers: [] } })
      );
      global.fetch = mockFetch;

      const { result } = renderHook(() => useServerStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        total: 0,
        online: 0,
        warning: 0,
        offline: 0,
      });
    });
  });
}); 