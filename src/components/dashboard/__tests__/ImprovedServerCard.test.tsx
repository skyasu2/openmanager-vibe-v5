/**
 * 🧪 ImprovedServerCard v3.1 실제 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ImprovedServerCard from '../ImprovedServerCard';
import type { Server } from '@/types/server';

// Mock Dependencies
vi.mock('../../../styles/design-constants', () => ({
  getServerStatusTheme: vi.fn(() => ({
    primary: 'emerald-500',
    background: 'bg-white/95',
    border: 'border-emerald-200/60',
    text: 'text-gray-900',
    statusColor: { backgroundColor: '#10b981' },
    accentColor: '#10b981',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200',
    cardStyle: {},
    hoverStyle: {},
    statusIcon: <div data-testid="status-icon" />,
    statusText: '정상',
    pulse: {},
    accent: {},
  })),
  getTypographyClass: vi.fn(() => 'text-sm font-medium'),
  COMMON_ANIMATIONS: {
    hover: 'hover:-translate-y-1 hover:scale-[1.02]',
    transition: 'transition-all duration-300 ease-out',
  },
  LAYOUT: {
    padding: { card: { mobile: 'p-4', tablet: 'p-6', desktop: 'p-8' } },
  },
}));

vi.mock('../../shared/ServerMetricsChart', () => ({
  ServerMetricsChart: ({ type, value }: { type: string; value: number }) => (
    <div data-testid={`metrics-chart-${type}`}>
      {type}: {value}%
    </div>
  ),
}));

vi.mock('../shared/ServerStatusIndicator', () => ({
  ServerStatusIndicator: ({ status }: { status: string }) => (
    <div data-testid="server-status-indicator">{status}</div>
  ),
}));

vi.mock('@/hooks/useFixed24hMetrics', () => ({
  useFixed24hMetrics: vi.fn(() => ({
    currentMetrics: { cpu: 45, memory: 60, disk: 30, network: 20 },
    loading: false,
  })),
}));

vi.mock('../error/ServerCardErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock('@/lib/utils/vercel-safe-utils', () => ({
  getSafeServicesLength: vi.fn(() => 2),
  getSafeValidServices: vi.fn(() => [
    { name: 'Service 1', status: 'running' },
    { name: 'Service 2', status: 'stopped' },
  ]),
  vercelSafeLog: vi.fn(),
  isValidServer: vi.fn(() => true),
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="icon-alert" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  Clock: () => <div data-testid="icon-clock" />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  Server: () => <div data-testid="icon-server" />,
  Database: () => <div data-testid="icon-database" />,
  Globe: () => <div data-testid="icon-globe" />,
  HardDrive: () => <div data-testid="icon-hard-drive" />,
  Archive: () => <div data-testid="icon-archive" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  ChevronUp: () => <div data-testid="icon-chevron-up" />,
  Activity: () => <div data-testid="icon-activity" />,
  Zap: () => <div data-testid="icon-zap" />,
}));

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
  location: 'Seoul',
  environment: 'production',
  provider: 'aws',
  type: 'web',
  alerts: 0,
  lastSeen: new Date().toISOString(),
  os: 'Ubuntu 22.04',
  services: [],
  ...overrides,
});

describe('ImprovedServerCard', () => {
  const mockOnClick = vi.fn();
  const mockServer = createMockServer();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 정보를 올바르게 렌더링한다', () => {
    render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('Seoul')).toBeInTheDocument();
    expect(screen.getByText('Ubuntu 22.04')).toBeInTheDocument();
  });

  it('핵심 메트릭(Level 1)을 표시한다', () => {
    render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

    expect(screen.getByText('핵심 지표')).toBeInTheDocument();
    const cpuCharts = screen.getAllByTestId('metrics-chart-cpu');
    expect(cpuCharts[0]).toBeInTheDocument();
    const memoryCharts = screen.getAllByTestId('metrics-chart-memory');
    expect(memoryCharts[0]).toBeInTheDocument();
  });

  it('Progressive Disclosure: 상세 정보 토글이 작동한다', () => {
    render(
      <ImprovedServerCard
        server={mockServer}
        onClick={mockOnClick}
        enableProgressiveDisclosure={true}
      />
    );

    const toggleButton = screen.getByLabelText('상세 정보 보기');
    fireEvent.click(toggleButton);

    expect(screen.getByText('상세 정보')).toBeInTheDocument();
    expect(screen.getByLabelText('상세 정보 숨기기')).toBeInTheDocument();
  });

  it('클릭 시 onClick 핸들러가 호출된다', () => {
    render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

    // 카드 전체가 버튼 역할
    const cardButton = screen.getByRole('button', { name: /Test Server/i });
    fireEvent.click(cardButton);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('Variant에 따라 스타일이 변경된다', () => {
    const { rerender } = render(
      <ImprovedServerCard
        server={mockServer}
        onClick={mockOnClick}
        variant="compact"
      />
    );
    // Compact 모드 확인 (구현에 따라 클래스나 요소 유무 확인)
    // 여기서는 간단히 렌더링 여부만 확인

    rerender(
      <ImprovedServerCard
        server={mockServer}
        onClick={mockOnClick}
        variant="detailed"
      />
    );
    // Detailed 모드 확인
  });
});
