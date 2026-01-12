/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 useTimeSeriesMetrics 훅 테스트
 *
 * 시계열 메트릭 데이터 훅의 동작을 검증
 * - API 호출
 * - 예측/이상탐지 데이터 포함
 * - 자동 새로고침
 * - 에러 처리
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type TimeSeriesData,
  useTimeSeriesMetrics,
} from './useTimeSeriesMetrics';

// Mock fetch with proper Response-like object
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger
vi.mock('@/lib/logging', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create a mock Response-like object
function createMockResponse(data: unknown, ok = true, status = 200) {
  const response = {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    bodyUsed: false,
    body: null,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    formData: vi.fn().mockResolvedValue(new FormData()),
    clone: vi.fn(),
  };
  response.clone.mockReturnValue({ ...response });
  return response;
}

// Mock 응답 데이터 생성
function createMockTimeSeriesData(
  overrides?: Partial<TimeSeriesData>
): TimeSeriesData {
  const now = Date.now();
  return {
    serverId: 'server-1',
    serverName: 'Test Server',
    metric: 'cpu',
    history: Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(now - (10 - i) * 300000).toISOString(),
      value: 50 + Math.random() * 20,
    })),
    prediction: Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(now + i * 300000).toISOString(),
      predicted: 55 + Math.random() * 15,
      upper: 65 + Math.random() * 15,
      lower: 45 + Math.random() * 15,
    })),
    anomalies: [
      {
        startTime: new Date(now - 3600000).toISOString(),
        endTime: new Date(now - 1800000).toISOString(),
        severity: 'high' as const,
        metric: 'cpu',
        description: 'CPU spike detected',
      },
    ],
    ...overrides,
  };
}

function createSuccessResponse(data: TimeSeriesData) {
  return createMockResponse({ success: true, data }, true, 200);
}

function createErrorResponse(status: number) {
  return createMockResponse(
    { success: false, message: 'API Error' },
    false,
    status
  );
}

describe('🎯 useTimeSeriesMetrics - 시계열 메트릭 훅 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('기본 동작', () => {
    it('serverId와 metric으로 데이터를 가져온다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.serverId).toBe('server-1');
      expect(result.current.data?.metric).toBe('cpu');
      expect(result.current.error).toBeNull();
    });

    it('serverId가 없으면 데이터를 가져오지 않는다', async () => {
      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: '',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('metric이 없으면 데이터를 가져오지 않는다', async () => {
      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: '' as 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('API 호출 파라미터', () => {
    it('기본 파라미터로 API를 호출한다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/api/ai/raw-metrics');
      expect(calledUrl).toContain('serverId=server-1');
      expect(calledUrl).toContain('metric=cpu');
      expect(calledUrl).toContain('range=6h'); // default
      expect(calledUrl).toContain('includePrediction=true'); // default
      expect(calledUrl).toContain('includeAnomalies=true'); // default
    });

    it('커스텀 range로 API를 호출한다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          range: '24h',
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('range=24h');
    });

    it('includePrediction=false로 API를 호출할 수 있다', async () => {
      const mockData = createMockTimeSeriesData({ prediction: undefined });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          includePrediction: false,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('includePrediction=false');
    });

    it('includeAnomalies=false로 API를 호출할 수 있다', async () => {
      const mockData = createMockTimeSeriesData({ anomalies: undefined });
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          includeAnomalies: false,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('includeAnomalies=false');
    });
  });

  describe('에러 처리', () => {
    it('API 오류 시 에러 상태가 설정된다', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse(500));

      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('API 오류');
      expect(result.current.data).toBeNull();
    });

    it('네트워크 오류 시 에러 상태가 설정된다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.data).toBeNull();
    });

    it('API 응답의 success가 false일 때 에러가 설정된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, message: '데이터 조회 실패' }),
      });

      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('데이터 조회 실패');
    });
  });

  describe('refetch 기능', () => {
    it('refetch 함수로 데이터를 다시 가져올 수 있다', async () => {
      const firstData = createMockTimeSeriesData({
        history: [{ timestamp: new Date().toISOString(), value: 50 }],
      });
      const secondData = createMockTimeSeriesData({
        history: [{ timestamp: new Date().toISOString(), value: 70 }],
      });

      mockFetch
        .mockResolvedValueOnce(createSuccessResponse(firstData))
        .mockResolvedValueOnce(createSuccessResponse(secondData));

      const { result } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.history[0].value).toBe(50);

      // refetch 호출
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data?.history[0].value).toBe(70);
      });
    });
  });

  describe('자동 새로고침', () => {
    it('refreshInterval이 설정되면 자동으로 데이터를 다시 가져온다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValue(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          refreshInterval: 5000, // 5초
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 5초 경과
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // 추가 5초 경과
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it('refreshInterval이 0이면 자동 새로고침이 비활성화된다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValue(createSuccessResponse(mockData));

      renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          refreshInterval: 0,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 10초 경과
      vi.advanceTimersByTime(10000);

      // 여전히 1번만 호출
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('컴포넌트 언마운트 처리', () => {
    it('언마운트 시 인터벌이 정리된다', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValue(createSuccessResponse(mockData));

      const { unmount } = renderHook(() =>
        useTimeSeriesMetrics({
          serverId: 'server-1',
          metric: 'cpu',
          refreshInterval: 5000,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('의존성 변경', () => {
    it('serverId가 변경되면 데이터를 다시 가져온다', async () => {
      const mockData1 = createMockTimeSeriesData({ serverId: 'server-1' });
      const mockData2 = createMockTimeSeriesData({ serverId: 'server-2' });

      mockFetch
        .mockResolvedValueOnce(createSuccessResponse(mockData1))
        .mockResolvedValueOnce(createSuccessResponse(mockData2));

      const { result, rerender } = renderHook(
        ({ serverId }) =>
          useTimeSeriesMetrics({
            serverId,
            metric: 'cpu',
          }),
        { initialProps: { serverId: 'server-1' } }
      );

      await waitFor(() => {
        expect(result.current.data?.serverId).toBe('server-1');
      });

      // serverId 변경
      rerender({ serverId: 'server-2' });

      await waitFor(() => {
        expect(result.current.data?.serverId).toBe('server-2');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('metric이 변경되면 데이터를 다시 가져온다', async () => {
      const cpuData = createMockTimeSeriesData({ metric: 'cpu' });
      const memoryData = createMockTimeSeriesData({ metric: 'memory' });

      mockFetch
        .mockResolvedValueOnce(createSuccessResponse(cpuData))
        .mockResolvedValueOnce(createSuccessResponse(memoryData));

      const { result, rerender } = renderHook(
        ({ metric }) =>
          useTimeSeriesMetrics({
            serverId: 'server-1',
            metric,
          }),
        { initialProps: { metric: 'cpu' as const } }
      );

      await waitFor(() => {
        expect(result.current.data?.metric).toBe('cpu');
      });

      // metric 변경
      rerender({ metric: 'memory' as const });

      await waitFor(() => {
        expect(result.current.data?.metric).toBe('memory');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('range가 변경되면 데이터를 다시 가져온다', async () => {
      const mockData = createMockTimeSeriesData();
      mockFetch.mockResolvedValue(createSuccessResponse(mockData));

      const { rerender } = renderHook(
        ({ range }) =>
          useTimeSeriesMetrics({
            serverId: 'server-1',
            metric: 'cpu',
            range,
          }),
        { initialProps: { range: '6h' as const } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // range 변경
      rerender({ range: '24h' as const });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      const secondCallUrl = mockFetch.mock.calls[1][0];
      expect(secondCallUrl).toContain('range=24h');
    });
  });

  describe('다양한 메트릭 타입', () => {
    const metricTypes = ['cpu', 'memory', 'disk', 'network'] as const;

    metricTypes.forEach((metric) => {
      it(`${metric} 메트릭 데이터를 가져올 수 있다`, async () => {
        const mockData = createMockTimeSeriesData({ metric });
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

        const { result } = renderHook(() =>
          useTimeSeriesMetrics({
            serverId: 'server-1',
            metric,
          })
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data?.metric).toBe(metric);
        expect(result.current.data?.history).toBeDefined();
        expect(result.current.data?.history.length).toBeGreaterThan(0);
      });
    });
  });

  describe('다양한 시간 범위', () => {
    const timeRanges = ['1h', '6h', '24h', '7d'] as const;

    timeRanges.forEach((range) => {
      it(`${range} 시간 범위로 데이터를 요청할 수 있다`, async () => {
        const mockData = createMockTimeSeriesData();
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

        renderHook(() =>
          useTimeSeriesMetrics({
            serverId: 'server-1',
            metric: 'cpu',
            range,
          })
        );

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled();
        });

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain(`range=${range}`);
      });
    });
  });
});
