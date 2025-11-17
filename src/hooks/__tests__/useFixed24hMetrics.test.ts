/**
 * 🧪 useFixed24hMetrics 훅 테스트
 *
 * 24시간 고정 데이터 기반 메트릭 훅의 정확한 동작을 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useFixed24hMetrics,
  useMultipleFixed24hMetrics,
  useSingleMetric,
} from '../useFixed24hMetrics';
import * as hourlyDataModule from '@/data/hourly-server-data';
import * as kstTimeModule from '@/utils/kst-time';

// Mock Modules
vi.mock('@/data/hourly-server-data', () => ({
  getServerMetricAt: vi.fn(),
  getRecentMetrics: vi.fn(),
  getMultipleServerMetrics: vi.fn(),
}));

interface InterpolatedMetric {
  id: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: string;
  isInterpolated: boolean;
  timestamp: string;
}

vi.mock('@/utils/kst-time', () => ({
  getCurrentKST: vi.fn(),
}));

vi.mock('../../../lib/api/errorHandler', () => ({
  createSuccessResponse: vi.fn((data) => ({ success: true, data })),
  createErrorResponse: vi.fn((message, code, metadata) => ({
    success: false,
    error: message,
    code,
    metadata,
  })),
  withErrorHandler: vi.fn((handler) => handler),
}));

// Mock KST
const mockKST = {
  getUTCHours: vi.fn(),
  getUTCMinutes: vi.fn(),
};

describe('useFixed24hMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kstTimeModule.getCurrentKST).mockReturnValue(mockKST as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('기본 동작', () => {
    it('서버 ID로 훅을 초기화할 수 있다', async () => {
      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce({
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });

      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentMetrics).toBeDefined();
      expect(result.current.currentMetrics?.cpu).toBe(50);
    });

    it('서버 데이터를 찾지 못하면 에러를 반환한다', async () => {
      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(null);
      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() => useFixed24hMetrics('invalid-id'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('데이터를 찾을 수 없습니다');
    });

    it('API 오류 시 적절한 에러를 반환한다', async () => {
      const errorMessage = 'Network error';
      vi.mocked(hourlyDataModule.getServerMetricAt).mockRejectedValueOnce(
        new Error(errorMessage)
      );
      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() => useFixed24hMetrics('error-server'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('히스토리 데이터', () => {
    it('히스토리 데이터를 정상적으로 가져온다', async () => {
      const mockMetric = {
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      };

      const mockHistory = [
        { timestamp: '09:00', cpu: 45, memory: 55, disk: 25, network: 15 },
        { timestamp: '09:30', cpu: 48, memory: 58, disk: 28, network: 18 },
        { timestamp: '10:00', cpu: 50, memory: 60, disk: 30, network: 20 },
      ];

      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(
        mockMetric
      );
      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce(
        mockHistory
      );

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.historyData).toHaveLength(3);
      expect(result.current.historyData[0]).toEqual({
        time: '09:00',
        cpu: 45,
        memory: 55,
        disk: 25,
        network: 15,
      });
    });
  });

  describe('업데이트 기능', () => {
    it('refreshMetrics 함수로 데이터를 다시 로드할 수 있다', async () => {
      const firstMetric = {
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '01:00',
      };
      const secondMetric = {
        id: 'server-1',
        cpu: 55,
        memory: 65,
        disk: 35,
        network: 25,
        status: 'online',
        isInterpolated: false,
        timestamp: '02:00',
      };

      const getMetricSpy = vi.spyOn(hourlyDataModule, 'getServerMetricAt');

      vi.mocked(getMetricSpy)
        .mockResolvedValueOnce(firstMetric)
        .mockResolvedValueOnce(secondMetric);
      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      // 첫 번째 결과 확인
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.currentMetrics?.cpu).toBe(50);

      // 두 번째 결과 설정
      mockKST.getUTCHours.mockReturnValue(11);
      mockKST.getUTCMinutes.mockReturnValue(45);

      // refresh 호출
      await result.current.refreshMetrics();

      // 두 번째 결과 확인
      await waitFor(() => {
        expect(result.current.currentMetrics?.cpu).toBe(55);
      });
    });
  });

  describe('업데이트 간격 설정', () => {
    it('업데이트 간격을 커스터마이징할 수 있다', async () => {
      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce({
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });

      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() =>
        useFixed24hMetrics('server-1', 120000)
      ); // 2분 간격

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentMetrics).toBeDefined();
    });
  });

  describe('컴포넌트 언마운트 처리', () => {
    it('훅이 언마운트되면 더 이상 데이터를 업데이트하지 않는다', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce({
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });

      vi.mocked(hourlyDataModule.getRecentMetrics).mockResolvedValueOnce([]);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { unmount, result } = renderHook(() =>
        useFixed24hMetrics('server-1')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});

/**
 * 🧪 useMultipleFixed24hMetrics 훅 테스트
 */
describe('useMultipleFixed24hMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kstTimeModule.getCurrentKST).mockReturnValue(mockKST as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('여러 서버의 메트릭을 동시에 가져올 수 있다', async () => {
    const mockMetricsMap = new Map();
    mockMetricsMap.set('server-1', {
      id: 'server-1',
      cpu: 50,
      memory: 60,
      disk: 30,
      network: 20,
      status: 'online',
      isInterpolated: false,
      timestamp: '2023-01-01T00:00:00Z',
    });
    mockMetricsMap.set('server-2', {
      id: 'server-2',
      cpu: 45,
      memory: 55,
      disk: 25,
      network: 15,
      status: 'online',
      isInterpolated: false,
      timestamp: '2023-01-01T00:00:00Z',
    });

    vi.mocked(hourlyDataModule.getMultipleServerMetrics).mockResolvedValueOnce(
      mockMetricsMap
    );

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const { result } = renderHook(() =>
      useMultipleFixed24hMetrics(['server-1', 'server-2'])
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metricsMap.size).toBe(2);
    expect(result.current.metricsMap.get('server-1')).toEqual(
      expect.objectContaining({ cpu: 50 })
    );
    expect(result.current.metricsMap.get('server-2')).toEqual(
      expect.objectContaining({ cpu: 45 })
    );
  });

  it('서버 ID 배열이 변경되면 데이터를 다시 가져온다', async () => {
    const mockMetricsMap = new Map();
    mockMetricsMap.set('server-1', {
      id: 'server-1',
      cpu: 50,
      memory: 60,
      disk: 30,
      network: 20,
      status: 'online',
      isInterpolated: false,
      timestamp: '2023-01-01T00:00:00Z',
    });

    vi.mocked(hourlyDataModule.getMultipleServerMetrics).mockResolvedValueOnce(
      mockMetricsMap
    );

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const { result, rerender } = renderHook(
      (serverIds) => useMultipleFixed24hMetrics(serverIds as string[]),
      {
        initialProps: ['server-1'],
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metricsMap.size).toBe(1);

    // Rerender with different server IDs
    rerender(['server-1', 'server-2']);

    await waitFor(() => {
      expect(result.current.metricsMap.size).toBe(1); // Only server-1 data in mock
    });
  });

  describe('업데이트 기능', () => {
    it('refreshMetrics 함수로 여러 서버 데이터를 다시 로드할 수 있다', async () => {
      const mockMetricsMap1 = new Map();
      mockMetricsMap1.set('server-1', {
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });

      const mockMetricsMap2 = new Map();
      mockMetricsMap2.set('server-1', {
        id: 'server-1',
        cpu: 60,
        memory: 70,
        disk: 40,
        network: 30,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });
      mockMetricsMap2.set('server-2', {
        id: 'server-2',
        cpu: 45,
        memory: 55,
        disk: 25,
        network: 15,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      });

      const getMultipleServerMetricsSpy = vi.spyOn(
        hourlyDataModule,
        'getMultipleServerMetrics'
      );
      vi.mocked(getMultipleServerMetricsSpy)
        .mockResolvedValueOnce(mockMetricsMap1)
        .mockResolvedValueOnce(mockMetricsMap2);

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      const { result } = renderHook(() =>
        useMultipleFixed24hMetrics(['server-1'])
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.metricsMap.size).toBe(1);
      expect(result.current.metricsMap.get('server-1')?.cpu).toBe(50);

      // refresh 호출
      await result.current.refreshMetrics();

      // 데이터 갱신 확인
      expect(result.current.metricsMap.get('server-1')?.cpu).toBe(60);
      expect(result.current.metricsMap.get('server-2')?.cpu).toBe(45);
    });
  });
});

/**
 * 🧪 useSingleMetric 훅 테스트
 */
describe('useSingleMetric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kstTimeModule.getCurrentKST).mockReturnValue(mockKST as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('특정 메트릭 타입의 값을 가져올 수 있다', async () => {
    const mockMetric = {
      id: 'server-1',
      cpu: 50,
      memory: 60,
      disk: 30,
      network: 20,
      status: 'online',
      isInterpolated: false,
      timestamp: '2023-01-01T00:00:00Z',
    };

    vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(
      mockMetric
    );

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const { result } = renderHook(() => useSingleMetric('server-1', 'cpu'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe(50);
  });

  it('서버 데이터가 없을 경우 적절한 에러를 반환한다', async () => {
    vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(null);

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const { result } = renderHook(() =>
      useSingleMetric('invalid-server', 'cpu')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('데이터를 찾을 수 없습니다');
  });

  describe('업데이트 기능', () => {
    it('다양한 메트릭 타입(cpu, memory, disk, network)을 가져올 수 있다', async () => {
      const mockMetric = {
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
        status: 'online',
        isInterpolated: false,
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(
        mockMetric
      );

      mockKST.getUTCHours.mockReturnValue(10);
      mockKST.getUTCMinutes.mockReturnValue(30);

      // CPU 메트릭 테스트
      const { result: cpuResult } = renderHook(() =>
        useSingleMetric('server-1', 'cpu')
      );
      await waitFor(() => expect(cpuResult.current.isLoading).toBe(false));
      expect(cpuResult.current.value).toBe(50);

      // Memory 메트릭 테스트
      const { result: memoryResult } = renderHook(() =>
        useSingleMetric('server-1', 'memory')
      );
      await waitFor(() => expect(memoryResult.current.isLoading).toBe(false));
      expect(memoryResult.current.value).toBe(60);

      // Disk 메트릭 테스트
      const { result: diskResult } = renderHook(() =>
        useSingleMetric('server-1', 'disk')
      );
      await waitFor(() => expect(diskResult.current.isLoading).toBe(false));
      expect(diskResult.current.value).toBe(30);

      // Network 메트릭 테스트
      const { result: networkResult } = renderHook(() =>
        useSingleMetric('server-1', 'network')
      );
      await waitFor(() => expect(networkResult.current.isLoading).toBe(false));
      expect(networkResult.current.value).toBe(20);
    });
  });
});

// Import the function at the end to test it independently
import { getFixedMetricNow } from '../useFixed24hMetrics';

/**
 * 🧪 getFixedMetricNow 함수 테스트
 */
describe('getFixedMetricNow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kstTimeModule.getCurrentKST).mockReturnValue(mockKST as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('현재 시간의 서버 메트릭을 가져올 수 있다', async () => {
    const expectedMetric = {
      id: 'server-1',
      cpu: 50,
      memory: 60,
      disk: 30,
      network: 20,
      status: 'online',
      isInterpolated: false,
      timestamp: '2023-01-01T00:00:00Z',
    };

    vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(
      expectedMetric
    );

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const result = await getFixedMetricNow('server-1');

    expect(result).toEqual(expectedMetric);
  });

  it('서버를 찾지 못하면 null을 반환한다', async () => {
    vi.mocked(hourlyDataModule.getServerMetricAt).mockResolvedValueOnce(null);

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const result = await getFixedMetricNow('invalid-server');

    expect(result).toBeNull();
  });

  it('API 오류가 발생하면 null을 반환한다', async () => {
    vi.mocked(hourlyDataModule.getServerMetricAt).mockRejectedValueOnce(
      new Error('Network error')
    );

    mockKST.getUTCHours.mockReturnValue(10);
    mockKST.getUTCMinutes.mockReturnValue(30);

    const result = await getFixedMetricNow('error-server');

    expect(result).toBeNull();
  });
});
