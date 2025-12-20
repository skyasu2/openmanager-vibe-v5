/**
 * 🧪 useFixed24hMetrics 훅 테스트
 *
 * UnifiedServerDataSource 기반 메트릭 훅의 정확한 동작을 검증
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from '@/types/server';
import {
  getFixedMetricNow,
  useFixed24hMetrics,
  useMultipleFixed24hMetrics,
  useSingleMetric,
} from './useFixed24hMetrics';

// Mock Types
interface MockUnifiedServerDataSourceInstance {
  getServers: Mock;
}

// Mock UnifiedServerDataSource
vi.mock('@/services/data/UnifiedServerDataSource', () => {
  const mockGetServers = vi.fn();
  const mockInstance = { getServers: mockGetServers };
  return {
    UnifiedServerDataSource: {
      getInstance: vi.fn(() => mockInstance),
    },
  };
});

vi.mock('@/lib/api/errorHandler', () => ({
  createSuccessResponse: vi.fn((data) => ({ success: true, data })),
  createErrorResponse: vi.fn((message, code, metadata) => ({
    success: false,
    error: message,
    code,
    metadata,
  })),
  withErrorHandler: vi.fn((handler) => handler),
}));

import { UnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';

// Mock 서버 데이터 생성 헬퍼
function createMockServer(overrides?: Partial<Server>): Server {
  return {
    id: 'server-1',
    name: 'Test Server 1',
    hostname: 'server-1.example.com',
    status: 'online',
    cpu: 50,
    memory: 60,
    disk: 30,
    network: 20,
    responseTime: 100,
    uptime: 86400,
    location: '서울',
    ip: '192.168.1.1',
    os: 'Ubuntu 22.04',
    type: 'web',
    role: 'web',
    environment: 'production',
    provider: 'AWS',
    specs: {
      cpu_cores: 4,
      memory_gb: 16,
      disk_gb: 500,
      network_speed: '10Gbps',
    },
    ...overrides,
  };
}

describe('useFixed24hMetrics', () => {
  let mockGetServers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockInstance =
      UnifiedServerDataSource.getInstance() as unknown as MockUnifiedServerDataSourceInstance;
    mockGetServers = vi.fn();
    mockInstance.getServers = mockGetServers;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('기본 동작', () => {
    it('서버 ID로 훅을 초기화할 수 있다', async () => {
      const mockServer = createMockServer({ id: 'server-1', cpu: 50 });
      mockGetServers.mockResolvedValueOnce([mockServer]);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentMetrics).toBeDefined();
      expect(result.current.currentMetrics?.cpu).toBe(50);
    });

    it('서버 데이터를 찾지 못하면 fallback 데이터를 사용한다', async () => {
      // 실제 구현: 서버를 못 찾으면 fallback 데이터 사용 (에러 아님)
      mockGetServers.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFixed24hMetrics('invalid-id'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Fallback 사용 시 에러 없음, 기본 메트릭 반환
      expect(result.current.error).toBeNull();
      expect(result.current.currentMetrics).toBeDefined();
    });

    it('API 오류 시 적절한 에러를 반환한다', async () => {
      const errorMessage = 'Network error';
      mockGetServers.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useFixed24hMetrics('error-server'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('히스토리 데이터', () => {
    it('히스토리 데이터를 정상적으로 가져온다', async () => {
      const mockServer = createMockServer({
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
      });

      mockGetServers.mockResolvedValueOnce([mockServer]);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // New system returns current snapshot only
      expect(result.current.historyData).toHaveLength(1);
      expect(result.current.historyData[0]).toEqual(
        expect.objectContaining({
          cpu: 50,
          memory: 60,
          disk: 30,
          network: 20,
        })
      );
    });
  });

  describe('업데이트 기능', () => {
    it('refreshMetrics 함수로 데이터를 다시 로드할 수 있다', async () => {
      const firstServer = createMockServer({ id: 'server-1', cpu: 50 });
      const secondServer = createMockServer({ id: 'server-1', cpu: 55 });

      mockGetServers
        .mockResolvedValueOnce([firstServer])
        .mockResolvedValueOnce([secondServer]);

      const { result } = renderHook(() => useFixed24hMetrics('server-1'));

      // 첫 번째 결과 확인
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.currentMetrics?.cpu).toBe(50);

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
      const mockServer = createMockServer({ id: 'server-1', cpu: 50 });
      mockGetServers.mockResolvedValueOnce([mockServer]);

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
      const mockServer = createMockServer({ id: 'server-1', cpu: 50 });
      mockGetServers.mockResolvedValueOnce([mockServer]);

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
  let mockGetServers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Singleton instance is already mocked at top level
    const mockInstance =
      UnifiedServerDataSource.getInstance() as unknown as MockUnifiedServerDataSourceInstance;
    mockGetServers = mockInstance.getServers;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('여러 서버의 메트릭을 동시에 가져올 수 있다', async () => {
    const mockServers = [
      createMockServer({ id: 'server-1', cpu: 50 }),
      createMockServer({ id: 'server-2', cpu: 45 }),
    ];

    mockGetServers.mockResolvedValueOnce(mockServers);

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
    const mockServers = [createMockServer({ id: 'server-1', cpu: 50 })];

    mockGetServers.mockResolvedValue(mockServers);

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
      const firstBatch = [createMockServer({ id: 'server-1', cpu: 50 })];
      const secondBatch = [
        createMockServer({ id: 'server-1', cpu: 60 }),
        createMockServer({ id: 'server-2', cpu: 45 }),
      ];

      let returnSecondBatch = false;
      mockGetServers.mockImplementation(async () => {
        if (returnSecondBatch) return secondBatch;
        return firstBatch;
      });

      const { result } = renderHook(() =>
        useMultipleFixed24hMetrics(['server-1', 'server-2'])
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.metricsMap.size).toBe(1);
      expect(result.current.metricsMap.get('server-1')?.cpu).toBe(50);

      // refresh 호출
      returnSecondBatch = true;
      await result.current.refreshMetrics();

      // 데이터 갱신 확인
      await waitFor(() => {
        const server1 = result.current.metricsMap.get('server-1');
        expect(server1?.cpu).toBe(60);
      });
      expect(result.current.metricsMap.get('server-2')?.cpu).toBe(45);
    });
  });
});

/**
 * 🧪 useSingleMetric 훅 테스트
 */
describe('useSingleMetric', () => {
  let mockGetServers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockInstance =
      UnifiedServerDataSource.getInstance() as unknown as MockUnifiedServerDataSourceInstance;
    mockGetServers = vi.fn();
    mockInstance.getServers = mockGetServers;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('특정 메트릭 타입의 값을 가져올 수 있다', async () => {
    const mockServer = createMockServer({ id: 'server-1', cpu: 50 });
    mockGetServers.mockResolvedValueOnce([mockServer]);

    const { result } = renderHook(() => useSingleMetric('server-1', 'cpu'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe(50);
  });

  it('서버 데이터가 없을 경우 적절한 에러를 반환한다', async () => {
    mockGetServers.mockResolvedValueOnce([]);

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
      const mockServer = createMockServer({
        id: 'server-1',
        cpu: 50,
        memory: 60,
        disk: 30,
        network: 20,
      });

      mockGetServers.mockResolvedValue([mockServer]);

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

/**
 * 🧪 getFixedMetricNow 함수 테스트
 */
describe('getFixedMetricNow', () => {
  let mockGetServers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockInstance =
      UnifiedServerDataSource.getInstance() as unknown as MockUnifiedServerDataSourceInstance;
    mockGetServers = vi.fn();
    mockInstance.getServers = mockGetServers;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('현재 시간의 서버 메트릭을 가져올 수 있다', async () => {
    const expectedServer = createMockServer({ id: 'server-1', cpu: 50 });
    mockGetServers.mockResolvedValueOnce([expectedServer]);

    const result = await getFixedMetricNow('server-1');

    expect(result).toEqual(expectedServer);
  });

  it('서버를 찾지 못하면 null을 반환한다', async () => {
    mockGetServers.mockResolvedValueOnce([]);

    const result = await getFixedMetricNow('invalid-server');

    expect(result).toBeNull();
  });

  it('API 오류가 발생하면 null을 반환한다', async () => {
    mockGetServers.mockRejectedValueOnce(new Error('Network error'));

    const result = await getFixedMetricNow('error-server');

    expect(result).toBeNull();
  });
});
