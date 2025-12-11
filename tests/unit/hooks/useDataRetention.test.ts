import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataRetention } from '@/hooks/useDataRetention';

// Mock DataRetentionScheduler
const mockScheduler = {
  getStats: vi.fn(),
  runCleanup: vi.fn(),
  updatePolicy: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

vi.mock('@/lib/DataRetentionScheduler', () => ({
  getDataRetentionScheduler: vi.fn(() => mockScheduler),
}));

describe('useDataRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScheduler.getStats.mockResolvedValue({
      totalRecords: 1000,
      oldRecords: 50,
      lastCleanup: new Date().toISOString(),
      nextCleanup: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  it('initializes with null stats', () => {
    const { result } = renderHook(() => useDataRetention());

    expect(result.current.stats).toBeNull();
    expect(result.current.isLoading).toBe(true);
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
    mockScheduler.runCleanup.mockResolvedValue({
      deletedRecords: 25,
      errors: [],
      duration: 1500,
    });

    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      const cleanupResult = await result.current.runManualCleanup();
      expect(cleanupResult.deletedRecords).toBe(25);
    });

    expect(mockScheduler.runCleanup).toHaveBeenCalled();
  });

  it('updates retention policy', async () => {
    const newPolicy = {
      maxAge: 30,
      maxRecords: 10000,
      cleanupInterval: 86400,
    };

    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      await result.current.updatePolicy(newPolicy);
    });

    expect(mockScheduler.updatePolicy).toHaveBeenCalledWith(newPolicy);
  });

  it('refreshes stats manually', async () => {
    const { result } = renderHook(() => useDataRetention());

    await act(async () => {
      await result.current.refreshStats();
    });

    expect(mockScheduler.getStats).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  it('handles errors gracefully', async () => {
    mockScheduler.getStats.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDataRetention());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('provides loading state during operations', async () => {
    mockScheduler.runCleanup.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ deletedRecords: 10, errors: [], duration: 1000 }),
            100
          )
        )
    );

    const { result } = renderHook(() => useDataRetention());

    act(() => {
      result.current.runManualCleanup();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
