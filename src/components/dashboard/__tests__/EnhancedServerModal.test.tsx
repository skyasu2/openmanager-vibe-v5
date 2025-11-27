/**
 * 🧪 EnhancedServerModal 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EnhancedServerModal from '../EnhancedServerModal';
import type { Server } from '@/types/server';

// Mock Dependencies
vi.mock('@/hooks/useFixed24hMetrics', () => ({
  useFixed24hMetrics: vi.fn(() => ({
    currentMetrics: { cpu: 45, memory: 60, disk: 30, network: 20 },
    loading: false,
    history: [],
  })),
}));

vi.mock('../EnhancedServerModal.OverviewTab', () => ({
  OverviewTab: () => <div data-testid="tab-overview">Overview Content</div>,
}));

vi.mock('../EnhancedServerModal.MetricsTab', () => ({
  MetricsTab: () => <div data-testid="tab-metrics">Metrics Content</div>,
}));

vi.mock('../EnhancedServerModal.ProcessesTab', () => ({
  ProcessesTab: () => <div data-testid="tab-processes">Processes Content</div>,
}));

vi.mock('../EnhancedServerModal.NetworkTab', () => ({
  NetworkTab: () => <div data-testid="tab-network">Network Content</div>,
}));

vi.mock('../EnhancedServerModal.LogsTab', () => ({
  LogsTab: () => <div data-testid="tab-logs">Logs Content</div>,
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-close" />,
  Activity: () => <div data-testid="icon-activity" />,
  BarChart2: () => <div data-testid="icon-bar-chart" />,
  Cpu: () => <div data-testid="icon-cpu" />,
  Network: () => <div data-testid="icon-network" />,
  Terminal: () => <div data-testid="icon-terminal" />,
  Server: () => <div data-testid="icon-server" />,
  Maximize2: () => <div data-testid="icon-maximize" />,
  Minimize2: () => <div data-testid="icon-minimize" />,
  BarChart3: () => <div data-testid="icon-bar-chart-3" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Play: () => <div data-testid="icon-play" />,
  Pause: () => <div data-testid="icon-pause" />,
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

describe('EnhancedServerModal', () => {
  const mockOnClose = vi.fn();
  const mockServer = createMockServer();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('렌더링 시 서버 정보를 표시한다', () => {
    render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('Seoul')).toBeInTheDocument();
  });

  it('기본적으로 Overview 탭이 표시된다', () => {
    render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
  });

  it('탭을 전환하면 해당 컨텐츠가 표시된다', () => {
    render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

    // Metrics 탭 클릭
    const metricsTab = screen.getByText('성능 분석');
    fireEvent.click(metricsTab);
    expect(screen.getByTestId('tab-metrics')).toBeInTheDocument();

    // Logs 탭 클릭
    const logsTab = screen.getByText('로그 & 네트워크');
    fireEvent.click(logsTab);
    expect(screen.getByTestId('tab-logs')).toBeInTheDocument();
  });

  it('닫기 버튼을 클릭하면 onClose가 호출된다', () => {
    render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('모달 닫기');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
