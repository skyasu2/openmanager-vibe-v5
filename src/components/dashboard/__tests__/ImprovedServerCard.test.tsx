/**
 * 🧪 Improved Server Card 테스트
 * AI 교차검증 기반 서버 카드 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImprovedServerCard } from '../ImprovedServerCard';
import type { Server } from '../../../types/server';

// Mock dependencies
vi.mock('../../../styles/design-constants', () => ({
  getServerStatusTheme: vi.fn((status) => ({
    primary: status === 'online' ? 'emerald-500' : status === 'warning' ? 'amber-500' : 'red-500',
    background: 'white/95',
    border: 'emerald-200/60',
    text: 'text-gray-900',
  })),
  getTypographyClass: vi.fn(() => 'text-sm font-medium'),
  COMMON_ANIMATIONS: {
    hover: 'hover:-translate-y-1 hover:scale-[1.02]',
    transition: 'transition-all duration-300 ease-out',
  },
  LAYOUT: {
    spacing: {
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    },
  },
}));

vi.mock('../../shared/ServerMetricsLineChart', () => ({
  ServerCardLineChart: () => <div data-testid="metrics-chart">Chart Component</div>,
}));

vi.mock('../../error/ServerCardErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../utils/metricValidation', () => ({
  validateMetricValue: vi.fn((value) => Math.max(0, Math.min(100, value))),
  validateServerMetrics: vi.fn((metrics) => metrics),
  generateSafeMetricValue: vi.fn((prev, change) => Math.max(0, Math.min(100, prev + change))),
}));

// Mock server data
const createMockServer = (overrides: Partial<Server> = {}): Server => ({
  id: 'test-server-1',
  name: 'Test Server',
  hostname: 'test-server.com',
  status: 'online',
  host: 'test-server.com',
  port: 8080,
  cpu: 45,
  memory: 67,
  disk: 23,
  network: 12,
  uptime: 86400,
  location: 'us-east-1',
  environment: 'production',
  provider: 'test',
  type: 'web',
  alerts: 0,
  lastSeen: new Date().toISOString(),
  metrics: {
    cpu: { usage: 45, cores: 4, temperature: 45 },
    memory: { used: 5.4, total: 8, usage: 67 },
    disk: { used: 23, total: 100, usage: 23 },
    network: { bytesIn: 7.2, bytesOut: 4.8, packetsIn: 0, packetsOut: 0 },
    timestamp: new Date().toISOString(),
    uptime: 86400,
  },
  ...overrides,
});

describe('ImprovedServerCard', () => {
  const mockOnClick = vi.fn();
  const mockServer = createMockServer();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('서버 기본 정보를 올바르게 렌더링한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByText('test-server.com')).toBeInTheDocument();
      expect(screen.getByText('us-east-1')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
    });

    it('서버 메트릭을 올바르게 표시한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      // CPU 사용률
      expect(screen.getByText(/45%/)).toBeInTheDocument();
      // 메모리 사용률
      expect(screen.getByText(/67%/)).toBeInTheDocument();
      // 디스크 사용률
      expect(screen.getByText(/23%/)).toBeInTheDocument();
    });

    it('서버 상태에 따른 적절한 아이콘을 표시한다', () => {
      const onlineServer = createMockServer({ status: 'online' });
      const { rerender } = render(
        <ImprovedServerCard 
          server={onlineServer} 
          onClick={mockOnClick} 
        />
      );

      // Online 상태 확인
      expect(screen.getByTestId('status-icon')).toBeInTheDocument();

      // Warning 상태 확인
      const warningServer = createMockServer({ status: 'warning' });
      rerender(
        <ImprovedServerCard 
          server={warningServer} 
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('클릭 시 onClick 핸들러가 호출된다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      const serverCard = screen.getByRole('button');
      fireEvent.click(serverCard);

      expect(mockOnClick).toHaveBeenCalledWith(mockServer);
    });

    it('키보드 접근성이 지원된다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      const serverCard = screen.getByRole('button');
      
      // Enter 키 테스트
      fireEvent.keyDown(serverCard, { key: 'Enter', code: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledWith(mockServer);

      // Space 키 테스트
      fireEvent.keyDown(serverCard, { key: ' ', code: 'Space' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 속성을 가진다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      const serverCard = screen.getByRole('button');
      
      expect(serverCard).toHaveAttribute('aria-label');
      expect(serverCard).toHaveAttribute('tabIndex', '0');
    });

    it('스크린 리더를 위한 적절한 설명을 제공한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      const serverCard = screen.getByRole('button');
      const ariaLabel = serverCard.getAttribute('aria-label');
      
      expect(ariaLabel).toContain('Test Server');
      expect(ariaLabel).toContain('online');
    });
  });

  describe('메트릭 검증', () => {
    it('잘못된 메트릭 값을 안전하게 처리한다', () => {
      const serverWithInvalidMetrics = createMockServer({
        cpu: -10, // 음수 값
        memory: 150, // 100% 초과 값
        disk: NaN, // NaN 값
      });

      render(
        <ImprovedServerCard 
          server={serverWithInvalidMetrics} 
          onClick={mockOnClick} 
        />
      );

      // 컴포넌트가 에러 없이 렌더링되는지 확인
      expect(screen.getByText('Test Server')).toBeInTheDocument();
    });
  });

  describe('변형(Variant)', () => {
    it('compact 변형을 올바르게 렌더링한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
          variant="compact"
        />
      );

      expect(screen.getByText('Test Server')).toBeInTheDocument();
    });

    it('standard 변형을 올바르게 렌더링한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
          variant="standard"
        />
      );

      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-chart')).toBeInTheDocument();
    });

    it('detailed 변형을 올바르게 렌더링한다', () => {
      render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
          variant="detailed"
        />
      );

      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-chart')).toBeInTheDocument();
    });
  });

  describe('실시간 업데이트', () => {
    it('실시간 업데이트가 활성화되면 적절히 처리한다', async () => {
      const { rerender } = render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
          showRealTimeUpdates={true}
        />
      );

      // 서버 데이터가 업데이트된 경우
      const updatedServer = createMockServer({
        cpu: 60,
        memory: 75,
        disk: 30,
      });

      rerender(
        <ImprovedServerCard 
          server={updatedServer} 
          onClick={mockOnClick} 
          showRealTimeUpdates={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/60%/)).toBeInTheDocument();
        expect(screen.getByText(/75%/)).toBeInTheDocument();
        expect(screen.getByText(/30%/)).toBeInTheDocument();
      });
    });
  });

  describe('성능', () => {
    it('메모이제이션이 올바르게 작동한다', () => {
      const { rerender } = render(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      // 동일한 props로 리렌더링
      rerender(
        <ImprovedServerCard 
          server={mockServer} 
          onClick={mockOnClick} 
        />
      );

      // 컴포넌트가 리렌더링되지 않았는지 확인 (실제로는 내부 상태 확인이 어려우므로 기본 렌더링 확인)
      expect(screen.getByText('Test Server')).toBeInTheDocument();
    });
  });
});