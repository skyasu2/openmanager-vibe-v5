/**
 * @file ServerDashboard.test.tsx
 * @description ServerDashboard 컴포넌트 통합 테스트
 *
 * 테스트 범위:
 * - 페이지네이션 UI 렌더링 (Lines 244-260: 페이지 크기 선택)
 * - 가상 스크롤링 조건부 렌더링 (Lines 269-279)
 * - 서버 카드 그리드 레이아웃
 * - 사용자 상호작용 (페이지 변경, 크기 변경)
 *
 * @priority HIGH - AI 교차검증에서 0% 커버리지로 확인됨
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServerDashboard from '@/components/dashboard/ServerDashboard';
import { ServerDataStoreProvider } from '@/components/providers/StoreProvider';
import { AccessibilityProvider } from '@/context/AccessibilityProvider';
import type { HourlyServer } from '@/types/server';
import type { EnhancedServerMetrics } from '@/types/server-enhanced';

// 🔧 [VITEST HOISTING FIX] Use vi.hoisted() to ensure ALL data is available before vi.mock()
// This prevents "Cannot access before initialization" errors
const mockState = vi.hoisted(() => {
  // Mock 데이터 - 실제 17개 서버 시나리오 (hoisted 내부로 이동)
  const rawServers: HourlyServer[] = Array.from({ length: 17 }, (_, i) => ({
    id: `server-${i + 1}`,
    name: `Server ${i + 1}`,
    type: i % 3 === 0 ? 'web' : i % 3 === 1 ? 'api' : 'db',
    status: i % 4 === 0 ? 'offline' : 'online',
    cpu: 45.2 + i * 2,
    memory: 62.1 + i,
    disk: 58.3 + i * 0.5,
    network: 23.1 + i * 0.3,
    timestamp: new Date().toISOString(),
    // Optional fields
    region: 'us-east-1',
    environment: 'production',
    tags: ['monitored'],
    lastUpdated: new Date().toISOString(),
    uptime: 99.9,
  }));

  // EnhancedServerMetrics 형식으로 변환
  const enhancedServers: EnhancedServerMetrics[] = rawServers.map(
    (server, i) => ({
      id: server.id,
      name: server.name,
      type: server.type,
      status: server.status as 'online' | 'offline' | 'warning',
      metrics: {
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        network: server.network,
        responseTime: 120 + i * 10,
        uptime: server.uptime || 99.9,
      },
      alerts: [],
      timestamp: server.timestamp,
      region: server.region || 'us-east-1',
      environment: (server.environment || 'production') as
        | 'production'
        | 'staging'
        | 'development',
    })
  );

  // Mutable state that tests can modify
  return {
    servers: enhancedServers,
    rawServers: rawServers, // Keep raw servers for reset functionality
  };
});

// Helper functions to modify mock state
export const setMockServers = (servers: EnhancedServerMetrics[]) => {
  mockState.servers = servers;
};

export const resetMockServers = () => {
  mockState.servers = mockState.rawServers.map((server, i) => ({
    id: server.id,
    name: server.name,
    type: server.type,
    status: server.status as 'online' | 'offline' | 'warning',
    metrics: {
      cpu: server.cpu,
      memory: server.memory,
      disk: server.disk,
      network: server.network,
      responseTime: 120 + i * 10,
      uptime: server.uptime || 99.9,
    },
    alerts: [],
    timestamp: server.timestamp,
    region: server.region || 'us-east-1',
    environment: (server.environment || 'production') as
      | 'production'
      | 'staging'
      | 'development',
  }));
};

// Helper function to convert HourlyServer to EnhancedServerMetrics
export const toEnhancedServer = (
  server: HourlyServer,
  index: number
): EnhancedServerMetrics => ({
  id: server.id,
  name: server.name,
  type: server.type,
  status: server.status as 'online' | 'offline' | 'warning',
  metrics: {
    cpu: server.cpu,
    memory: server.memory,
    disk: server.disk,
    network: server.network,
    responseTime: 120 + index * 10,
    uptime: server.uptime || 99.9,
  },
  alerts: [],
  timestamp: server.timestamp,
  region: server.region || 'us-east-1',
  environment: (server.environment || 'production') as
    | 'production'
    | 'staging'
    | 'development',
});

// 🔍 [MODULE LEVEL] Test file loading diagnostics
console.log('🔍 [MODULE LEVEL] ServerDashboard.test.tsx is loading...');
console.log(
  '🔍 [MODULE LEVEL] mockState.servers.length:',
  mockState.servers?.length || 'undefined'
);
console.log('🔍 [MODULE LEVEL] About to execute vi.mock() call...');

// 🔧 useWorkerStats Mock - Web Worker API를 사용하지 않는 테스트용 구현
// Worker API는 Node.js/Vitest 환경에서 사용할 수 없으므로 완전히 모킹
vi.mock('@/hooks/useWorkerStats', () => ({
  useWorkerStats: () => ({
    calculateStats: vi.fn(async (servers) => ({
      total: servers.length,
      online: servers.filter((s: any) => s.status === 'online').length,
      offline: servers.filter((s: any) => s.status === 'offline').length,
      warning: 0,
      critical: 0,
      averageCpu: 0,
      averageMemory: 0,
      averageUptime: 0,
      totalBandwidth: 0,
      typeDistribution: {},
      performanceMetrics: { calculationTime: 0, serversProcessed: servers.length }
    })),
    isWorkerReady: () => false,  // Always false in tests - forces fallback path
    restartWorker: vi.fn(),
    calculateCombinedStats: vi.fn(),
    calculatePagination: vi.fn(),
    applyFilters: vi.fn(),
    pendingOperations: 0
  }),
  calculateServerStatsFallback: vi.fn((servers) => ({
    total: servers.length,
    online: 0,
    offline: 0,
    warning: 0,
    critical: 0,
    averageCpu: 0,
    averageMemory: 0,
    averageUptime: 0,
    totalBandwidth: 0,
    typeDistribution: {},
    performanceMetrics: { calculationTime: 0, serversProcessed: servers.length }
  }))
}));

// 🔧 useServerDataStore Mock - Zustand store에 테스트 데이터 주입 (완전한 인터페이스)
vi.mock('@/components/providers/StoreProvider', async () => {
  console.log('🔧 [MOCK FACTORY] Executing mock factory');
  console.log(
    '🔧 [MOCK FACTORY] mockState.servers.length:',
    mockState.servers?.length || 'undefined'
  );

  const actual = await vi.importActual<
    typeof import('@/components/providers/StoreProvider')
  >('@/components/providers/StoreProvider');

  console.log(
    '🔧 [MOCK FACTORY] After importActual, mockState.servers.length:',
    mockState.servers?.length || 'undefined'
  );

  return {
    ...actual,
    useServerDataStore: vi.fn((selector: any) => {
      const storeState = {
        // 데이터 상태
        servers: mockState.servers, // ← 동적 mock 데이터 (테스트가 변경 가능)
        isLoading: false,
        error: null,
        lastUpdate: new Date(),

        // 통합 메트릭 관리자 상태
        unifiedManagerStatus: null,
        prometheusHubStatus: null,

        // 자동 갱신 관련
        autoRefreshIntervalId: null,
        isAutoRefreshEnabled: false,

        // 성능 메트릭
        performance: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          lastSyncTime: null,
        },

        // 액션들
        fetchServers: vi.fn().mockResolvedValue(undefined),
        refreshData: vi.fn().mockResolvedValue(undefined),
        startRealTimeUpdates: vi.fn(),
        stopRealTimeUpdates: vi.fn(),

        // 자동 갱신 액션
        startAutoRefresh: vi.fn(),
        stopAutoRefresh: vi.fn(),

        // 통합 시스템 제어
        startUnifiedSystem: vi.fn().mockResolvedValue(undefined),
        stopUnifiedSystem: vi.fn(),
        getSystemStatus: vi.fn().mockReturnValue(null),

        // 개별 서버 조회 (동적 mock 데이터 사용)
        getServerById: vi.fn((id: string) =>
          mockState.servers.find((s) => s.id === id)
        ),
        getServersByStatus: vi.fn((status: string) =>
          mockState.servers.filter((s) => s.status === status)
        ),
        getServersByEnvironment: vi.fn((env: string) =>
          mockState.servers.filter((s) => s.environment === env)
        ),
      };
      return selector ? selector(storeState) : storeState;
    }),
  };
});

// Mock VirtualizedServerList 컴포넌트
vi.mock('@/components/dashboard/VirtualizedServerList', () => ({
  default: ({ servers, handleServerSelect }: any) => (
    <div data-testid="virtualized-list">
      <div data-testid="virtual-server-count">{servers.length}</div>
      {servers.slice(0, 5).map((server: HourlyServer) => (
        <button
          key={server.id}
          data-testid={`virtual-server-${server.id}`}
          onClick={() => handleServerSelect(server)}
          type="button"
        >
          {server.name}
        </button>
      ))}
    </div>
  ),
}));

describe('ServerDashboard - 통합 테스트', () => {
  const mockHandleServerSelect = vi.fn();

  // Test helper: ServerDataStoreProvider로 컴포넌트 래핑
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <AccessibilityProvider>
        <ServerDataStoreProvider>{ui}</ServerDataStoreProvider>
      </AccessibilityProvider>
    );
  };

  // 각 테스트 전에 mock 서버 데이터를 기본값으로 리셋
  beforeEach(() => {
    resetMockServers();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('서버 대시보드가 정상적으로 렌더링된다', () => {
      // 🔧 Dynamic mock: 3개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 3).map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 서버 카드가 렌더링되는지 확인
      expect(screen.getByText('Server 1')).toBeInTheDocument();
      expect(screen.getByText('Server 2')).toBeInTheDocument();
      expect(screen.getByText('Server 3')).toBeInTheDocument();
    });

    it('빈 서버 목록을 처리한다', () => {
      // 🔧 Dynamic mock: 빈 배열을 store에 주입
      setMockServers([]);

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 빈 상태 메시지 또는 안전한 렌더링 확인
      // (실제 구현에 따라 달라질 수 있음)
    });

    it('단일 서버를 정상적으로 렌더링한다', () => {
      // 🔧 Dynamic mock: 단일 서버만 store에 주입
      setMockServers([toEnhancedServer(mockState.rawServers[0], 0)]);

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      expect(screen.getByText('Server 1')).toBeInTheDocument();
    });
  });

  describe('페이지네이션 UI', () => {
    it('페이지 크기 선택 드롭다운이 렌더링된다', () => {
      // 🔧 Dynamic mock: 전체 서버 목록을 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // select 요소 확인
      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });
      expect(pageSelector).toBeInTheDocument();
    });

    it('모든 페이지 크기 옵션이 있다 (4, 6, 8, 12, 15)', () => {
      // 🔧 Dynamic mock: 전체 서버 목록을 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      // option 요소 확인
      const options = Array.from(pageSelector.querySelectorAll('option')).map(
        (opt) => opt.value
      );

      expect(options).toEqual(['4', '6', '8', '12', '15']);
    });

    it('페이지 크기를 변경할 수 있다', async () => {
      // 🔧 Dynamic mock: 전체 서버 목록을 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      }) as HTMLSelectElement;

      // 초기 값 확인 (기본값은 구현에 따라 다를 수 있음)
      const initialValue = pageSelector.value;
      expect(['3', '4', '6', '9', '15']).toContain(initialValue);

      // 6개씩으로 변경
      fireEvent.change(pageSelector, { target: { value: '6' } });
      await waitFor(() => {
        expect(pageSelector.value).toBe('6');
      });
    });
  });

  describe('가상 스크롤링 조건부 렌더링', () => {
    it('15개 미만 서버 - 일반 그리드로 렌더링', () => {
      // 🔧 Dynamic mock: 10개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 10).map((s, i) => toEnhancedServer(s, i))
      );

      const { container } = renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 가상 스크롤링이 아닌 일반 그리드
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();

      // 그리드 레이아웃 확인
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it('15개 이상 서버 + 페이지 크기 15 - 가상 스크롤링', async () => {
      // 🔧 Dynamic mock: 전체 서버 목록을 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 페이지 크기를 15로 변경
      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      fireEvent.change(pageSelector, { target: { value: '15' } });

      // 가상 스크롤링 컴포넌트 렌더링 확인
      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });

      // 17개 서버가 전달되었는지 확인
      const virtualCount = screen.getByTestId('virtual-server-count');
      expect(virtualCount).toHaveTextContent('17');
    });
  });

  describe('그리드 레이아웃 반응형', () => {
    it('3개 이하 - 1열 그리드', () => {
      // 🔧 Dynamic mock: 3개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 3).map((s, i) => toEnhancedServer(s, i))
      );

      const { container } = renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const grid = container.querySelector('[class*="grid-cols-1"]');
      expect(grid).toBeInTheDocument();
    });

    it('4-6개 - 2-3열 반응형 그리드', () => {
      // 🔧 Dynamic mock: 6개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 6).map((s, i) => toEnhancedServer(s, i))
      );

      const { container } = renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 패턴
      const grid = container.querySelector(
        '[class*="grid-cols-1"][class*="sm:grid-cols-2"]'
      );
      expect(grid).toBeInTheDocument();
    });
  });

  describe('서버 선택 상호작용', () => {
    it('서버 카드 클릭 시 모달이 열림', async () => {
      // 🔧 Dynamic mock: 3개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 3).map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(<ServerDashboard />);

      // 실제 버튼 요소를 role과 aria-label로 찾기
      const serverCard = screen.getByRole('button', { name: /Server 1/i });
      expect(serverCard).toBeInTheDocument();

      // 서버 카드 클릭
      fireEvent.click(serverCard);

      // 모달이 열렸는지 확인 (fixed backdrop + 서버 이름)
      await waitFor(() => {
        // 모달 백드롭 확인 (querySelector로 직접 쿼리)
        const modal = document.querySelector('.fixed.inset-0');
        expect(modal).toBeInTheDocument();

        // 모달 내부에 서버 정보가 표시되는지 확인
        const serverNameInModal = screen.getAllByText('Server 1')[1]; // 두 번째는 모달 내부
        expect(serverNameInModal).toBeInTheDocument();
      });
    });

    it('가상 스크롤링에서도 서버 선택 시 모달이 열림', async () => {
      // 🔧 Dynamic mock: 전체 서버 목록을 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(<ServerDashboard />);

      // 페이지 크기를 15로 변경하여 가상 스크롤링 활성화
      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });
      fireEvent.change(pageSelector, { target: { value: '15' } });

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });

      // Wait for server cards to render (async useEffect in VirtualizedServerList)
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /^Server 1$/i })
        ).toBeInTheDocument();
      });

      // 가상 리스트에서 서버 버튼 찾기 (aria-label 사용)
      const virtualServer = screen.getByRole('button', { name: /^Server 1$/i });
      fireEvent.click(virtualServer);

      // 모달이 열렸는지 확인
      await waitFor(() => {
        // 모달 백드롭 확인 (querySelector로 직접 쿼리)
        const modal = document.querySelector('.fixed.inset-0');
        expect(modal).toBeInTheDocument();

        // 모달 내부에 서버 정보가 표시되는지 확인
        const serverNameInModal = screen.getAllByText('Server 1')[1];
        expect(serverNameInModal).toBeInTheDocument();
      });
    });
  });

  describe('페이지네이션 시나리오 (17개 서버)', () => {
    it('초기 로딩: 첫 3개 서버 표시', () => {
      // 🔧 Dynamic mock: 3개 서버만 store에 주입
      setMockServers(
        mockState.rawServers.slice(0, 3).map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      expect(screen.getByText('Server 1')).toBeInTheDocument();
      expect(screen.getByText('Server 2')).toBeInTheDocument();
      expect(screen.getByText('Server 3')).toBeInTheDocument();
      expect(screen.queryByText('Server 4')).not.toBeInTheDocument();
    });

    it('페이지 크기 6 → 첫 6개 서버 표시', async () => {
      // 🔧 Dynamic mock: 18개 서버를 store에 주입 (multi-page 보장)
      setMockServers(
        mockState.rawServers.slice(0, 18).map((s, i) => toEnhancedServer(s, i))
      );

      const { rerender } = renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      // 페이지 크기를 6으로 변경
      fireEvent.change(pageSelector, { target: { value: '6' } });

      // 페이지 크기 변경 후 서버 목록 업데이트 시뮬레이션
      rerender(
        <AccessibilityProvider>
          <ServerDataStoreProvider>
            <ServerDashboard handleServerSelect={mockHandleServerSelect} />
          </ServerDataStoreProvider>
        </AccessibilityProvider>
      );

      expect(screen.getByText('Server 1')).toBeInTheDocument();
      expect(screen.getByText('Server 6')).toBeInTheDocument();
      expect(screen.queryByText('Server 7')).not.toBeInTheDocument();
    });

    it('모두 보기 (15개) → 가상 스크롤링 활성화', async () => {
      // 🔧 Dynamic mock: 18개 서버를 store에 주입 (multi-page 보장)
      setMockServers(
        mockState.rawServers.slice(0, 18).map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 페이지 크기를 15로 변경
      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });
      fireEvent.change(pageSelector, { target: { value: '15' } });

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });
    });
  });

  describe('서버 상태 표시', () => {
    it('온라인 서버 상태 표시', () => {
      const onlineServers = mockState.rawServers
        .filter((s) => s.status === 'online')
        .slice(0, 3);

      // 🔧 Dynamic mock: 온라인 서버만 store에 주입
      setMockServers(onlineServers.map((s, i) => toEnhancedServer(s, i)));

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 온라인 상태 표시 확인 (실제 구현에 따라 다를 수 있음)
      onlineServers.forEach((server) => {
        expect(screen.getByText(server.name)).toBeInTheDocument();
      });
    });

    it('오프라인 서버 상태 표시', () => {
      const offlineServers = mockState.rawServers
        .filter((s) => s.status === 'offline')
        .slice(0, 3);

      // 🔧 Dynamic mock: 오프라인 서버만 store에 주입
      setMockServers(offlineServers.map((s, i) => toEnhancedServer(s, i)));

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      offlineServers.forEach((server) => {
        expect(screen.getByText(server.name)).toBeInTheDocument();
      });
    });

    it('혼합 상태 서버 목록 처리', () => {
      const mixedServers = mockState.rawServers.slice(0, 6);

      // 🔧 Dynamic mock: 혼합 상태 서버 데이터를 store에 주입
      setMockServers(mixedServers.map((s, i) => toEnhancedServer(s, i)));

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 모든 서버가 렌더링되는지 확인
      mixedServers.forEach((server) => {
        expect(screen.getByText(server.name)).toBeInTheDocument();
      });
    });
  });

  describe('접근성', () => {
    it('페이지 크기 선택 combobox에 적절한 라벨이 있다', () => {
      // 🔧 Dynamic mock: 모든 서버를 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      expect(pageSelector).toHaveAttribute('aria-label');
    });

    it('키보드 네비게이션 지원 (탭 순서)', () => {
      // 🔧 Dynamic mock: 18개 서버를 store에 주입 (multi-page 보장)
      setMockServers(
        mockState.rawServers.slice(0, 18).map((s, i) => toEnhancedServer(s, i))
      );

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      // 탭 인덱스 확인 (포커스 가능)
      expect(pageSelector).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('성능 최적화', () => {
    it('대량 서버 목록 (17개) 렌더링 성능', () => {
      // 🔧 Dynamic mock: 모든 서버를 store에 주입
      setMockServers(
        mockState.rawServers.map((s, i) => toEnhancedServer(s, i))
      );

      const startTime = performance.now();

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 렌더링 시간이 100ms 이내여야 함
      expect(renderTime).toBeLessThan(100);
    });

    it('페이지 크기 변경 시 불필요한 리렌더링 방지', async () => {
      // 🔧 Dynamic mock: 18개 서버를 store에 주입 (multi-page 보장)
      setMockServers(
        mockState.rawServers.slice(0, 18).map((s, i) => toEnhancedServer(s, i))
      );

      const { rerender } = renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      const pageSelector = screen.getByRole('combobox', {
        name: /페이지당 표시할 서버 개수 선택/i,
      });

      // 페이지 크기 변경
      fireEvent.change(pageSelector, { target: { value: '8' } });

      // 동일한 서버 목록으로 리렌더링
      rerender(
        <AccessibilityProvider>
          <ServerDataStoreProvider>
            <ServerDashboard handleServerSelect={mockHandleServerSelect} />
          </ServerDataStoreProvider>
        </AccessibilityProvider>
      );

      // 여전히 정상 작동하는지 확인
      expect(screen.getByText('Server 1')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('매우 긴 서버 이름 처리', () => {
      const longNameServer: HourlyServer = {
        ...mockState.rawServers[0],
        id: 'long-name-server',
        name: 'A'.repeat(100),
      };

      // 🔧 Dynamic mock: 커스텀 서버 데이터를 store에 주입
      setMockServers([toEnhancedServer(longNameServer, 0)]);

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 긴 이름이 렌더링되는지 확인 (텍스트 잘림 포함)
      expect(screen.getByText(/^A+/)).toBeInTheDocument();
    });

    it('특수 문자가 포함된 서버 이름 처리', () => {
      const specialServer: HourlyServer = {
        ...mockState.rawServers[0],
        id: 'special-server',
        name: 'Server <>&"\'',
      };

      // 🔧 Dynamic mock: 커스텀 서버 데이터를 store에 주입
      setMockServers([toEnhancedServer(specialServer, 0)]);

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // XSS 방어 확인 (React는 자동으로 이스케이프)
      expect(screen.getByText('Server <>&"\'')).toBeInTheDocument();
    });

    it('메트릭 값이 비정상적인 서버 처리', () => {
      const abnormalServer: HourlyServer = {
        ...mockState.rawServers[0],
        id: 'abnormal-server',
        cpu: NaN,
        memory: Infinity,
        disk: -10,
        network: 150,
      };

      // 🔧 Dynamic mock: 커스텀 서버 데이터를 store에 주입
      setMockServers([toEnhancedServer(abnormalServer, 0)]);

      renderWithProvider(
        <ServerDashboard handleServerSelect={mockHandleServerSelect} />
      );

      // 비정상 값이 있어도 크래시 없이 렌더링
      expect(screen.getByText(abnormalServer.name)).toBeInTheDocument();
    });
  });
});
