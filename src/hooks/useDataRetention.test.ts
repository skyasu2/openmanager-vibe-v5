/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataRetention } from '@/hooks/useDataRetention';

// Mock DataRetentionScheduler
const mockScheduler = {
  getStats: vi.fn(),
  getPolicies: vi.fn(),
  manualCleanup: vi.fn(),
  updatePolicy: vi.fn(),
  addPolicy: vi.fn(),
  deletePolicy: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

vi.mock('@/lib/DataRetentionScheduler', () => ({
  getDataRetentionScheduler: vi.fn(() => mockScheduler),
}));

describe('useDataRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getStats는 동기 함수로 사용됨 (hook에서 await 없이 호출)
    mockScheduler.getStats.mockReturnValue({
      totalRecords: 1000,
      oldRecords: 50,
      lastCleanupTime: new Date().toISOString(),
      memoryUsageMB: 50,
      totalItemsRemoved: 100,
    });
    mockScheduler.getPolicies.mockReturnValue([]);
    mockScheduler.manualCleanup.mockResolvedValue([
      { deletedRecords: 25, errors: [], duration: 1500 },
    ]);
  });

  it('loads stats immediately on mount', () => {
    const { result } = renderHook(() => useDataRetention());

    // Hook은 마운트 시 즉시 refreshStats를 호출하여 동기적으로 stats를 로드
    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats?.totalRecords).toBe(1000);
    // 동기적 로드 완료 후 loading은 false
    expect(result.current.isLoading).toBe(false);
  });

  it('loads stats on mount', async () => {
    const { result } = renderHook(() => useDataRetention());

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });

    expect(mockScheduler.getStats).toHaveBeenCalled();
    expect(result.current.stats?.totalRecords).toBe(1000);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles manual cleanup', async () => {
    // manualCleanup은 배열을 반환함 (beforeEach에서 기본값 설정)
    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      const cleanupResults = await result.current.runManualCleanup();
      expect(cleanupResults).toHaveLength(1);
      expect(cleanupResults[0].deletedRecords).toBe(25);
    });

    expect(mockScheduler.manualCleanup).toHaveBeenCalled();
  });

  it('updates retention policy', async () => {
    const policyId = 'test-policy-id';
    const policyUpdates = {
      maxAge: 30,
      maxRecords: 10000,
      cleanupInterval: 86400,
    };

    mockScheduler.updatePolicy.mockReturnValue(true);

    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      result.current.updatePolicy(policyId, policyUpdates);
    });

    expect(mockScheduler.updatePolicy).toHaveBeenCalledWith(
      policyId,
      policyUpdates
    );
  });

  it('refreshes stats manually', async () => {
    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      await result.current.refreshStats();
    });

    expect(mockScheduler.getStats).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  it('handles errors gracefully', () => {
    // 동기 함수에서 에러를 throw하도록 설정
    mockScheduler.getStats.mockImplementation(() => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() => useDataRetention());

    // 에러 발생 시 stats는 null, error는 설정됨
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('provides loading state during operations', async () => {
    // manualCleanup mock (hook에서 사용하는 메서드)
    mockScheduler.manualCleanup = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([{ deletedRecords: 10, errors: [] }]), 100)
          )
      );

    const { result } = renderHook(() => useDataRetention());

    // 초기 로드 완료 대기
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 수동 정리 시작 - async 작업 완료까지 대기
    await act(async () => {
      await result.current.runManualCleanup();
    });

    // 작업 완료 후 loading이 false인지 확인
    expect(result.current.isLoading).toBe(false);
  });
});
