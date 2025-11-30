/**
 * 🧪 EnhancedServerModal 컴포넌트 User Event 테스트
 *
 * @description 서버 상세 모달의 렌더링, 인터랙션, 탭 전환 검증 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnhancedServerModal from '@/components/dashboard/EnhancedServerModal';
import type { Server } from '@/types/server';

// Mock 5개 탭 컴포넌트
vi.mock('@/components/dashboard/EnhancedServerModal.OverviewTab', () => ({
  OverviewTab: vi.fn(() => (
    <div data-testid="mock-overview-tab">Overview Tab</div>
  )),
}));

vi.mock('@/components/dashboard/EnhancedServerModal.MetricsTab', () => ({
  MetricsTab: vi.fn(() => (
    <div data-testid="mock-metrics-tab">Metrics Tab</div>
  )),
}));

vi.mock('@/components/dashboard/EnhancedServerModal.ProcessesTab', () => ({
  ProcessesTab: vi.fn(() => (
    <div data-testid="mock-processes-tab">Processes Tab</div>
  )),
}));

vi.mock('@/components/dashboard/EnhancedServerModal.LogsTab', () => ({
  LogsTab: vi.fn(() => <div data-testid="mock-logs-tab">Logs Tab</div>),
}));

vi.mock('@/components/dashboard/EnhancedServerModal.NetworkTab', () => ({
  NetworkTab: vi.fn(() => (
    <div data-testid="mock-network-tab">Network Tab</div>
  )),
}));

describe('🎯 EnhancedServerModal - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = vi.fn();

  // Mock 서버 데이터
  const mockServer: Server = {
    id: 'server-1',
    name: 'Web Server 01',
    hostname: 'web01.example.com',
    type: 'web',
    environment: 'production',
    location: '서울',
    provider: 'AWS',
    status: 'online',
    cpu: 45.2,
    memory: 62.8,
    disk: 73.5,
    network: 28.9,
    uptime: '24h 30m',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'Nginx', status: 'running', port: 80 },
      { name: 'Node.js', status: 'running', port: 3000 },
    ],
    specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
    os: 'Ubuntu 22.04',
    ip: '192.168.1.100',
    networkStatus: 'online',
    health: { score: 85, trend: [] },
    alertsSummary: { total: 0, critical: 0, warning: 0 },
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('기본 모달 렌더링', () => {
    it('모달이 dialog role로 표시된다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('서버 이름이 헤더에 표시된다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      expect(screen.getByText('Web Server 01')).toBeDefined();
    });

    it('overlay가 표시된다', () => {
      const { container } = render(
        <EnhancedServerModal server={mockServer} onClose={mockOnClose} />
      );

      const overlay = container.querySelector('.backdrop-blur-md');
      expect(overlay).toBeDefined();
    });
  });

  describe('onClose 호출', () => {
    it('overlay 클릭 시 onClose가 호출된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const overlay = screen.getByLabelText('모달 닫기');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const closeButton = screen.getByTitle('모달 닫기');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escape 키 입력 시 onClose가 호출된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('에러 상태', () => {
    it('server가 null일 때 에러 UI가 표시된다', () => {
      // @ts-expect-error - 의도적으로 null 전달
      render(<EnhancedServerModal server={null} onClose={mockOnClose} />);

      expect(screen.getByText('서버 데이터 오류')).toBeDefined();
      expect(screen.getByText('서버 정보를 불러올 수 없습니다.')).toBeDefined();
    });

    it('에러 상태에서 닫기 버튼이 작동한다', async () => {
      // @ts-expect-error - 의도적으로 null 전달
      render(<EnhancedServerModal server={null} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '닫기' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('탭 전환 인터랙션', () => {
    it('초기 탭은 overview이다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      // OverviewTab Mock 컴포넌트가 렌더링됨
      expect(screen.getByTestId('mock-overview-tab')).toBeDefined();
    });

    it('metrics 탭 클릭 시 탭이 전환된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const metricsTabButton = screen.getByRole('button', {
        name: /성능 분석/,
      });
      await user.click(metricsTabButton);

      // MetricsTab이 표시되고, ProcessesTab도 함께 표시됨 (통합 탭)
      expect(screen.getByTestId('mock-metrics-tab')).toBeDefined();
      expect(screen.getByTestId('mock-processes-tab')).toBeDefined();
    });

    it('logs 탭 클릭 시 탭이 전환된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const logsTabButton = screen.getByRole('button', { name: /로그/ });
      await user.click(logsTabButton);

      // LogsTab과 NetworkTab이 표시됨 (통합 탭)
      expect(screen.getByTestId('mock-logs-tab')).toBeDefined();
      expect(screen.getByTestId('mock-network-tab')).toBeDefined();
    });
  });

  describe('실시간 토글', () => {
    it('실시간 버튼이 초기 상태는 활성화되어 있다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const realtimeButton = screen.getByRole('button', { name: /실시간/ });
      expect(realtimeButton.className).toContain('text-green-600');
    });

    it('실시간 버튼 클릭 시 일시정지 상태로 변경된다', async () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const realtimeButton = screen.getByRole('button', { name: /실시간/ });
      await user.click(realtimeButton);

      // 일시정지 텍스트가 표시됨
      await waitFor(() => {
        const pauseButton = screen.getByRole('button', { name: /일시정지/ });
        expect(pauseButton).toBeDefined();
      });
    });
  });

  describe('접근성', () => {
    it('모달은 aria-modal="true"를 가진다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('닫기 버튼은 적절한 aria-label을 가진다', () => {
      render(<EnhancedServerModal server={mockServer} onClose={mockOnClose} />);

      const overlayCloseButton = screen.getByLabelText('모달 닫기');
      expect(overlayCloseButton).toBeDefined();
    });
  });
});
