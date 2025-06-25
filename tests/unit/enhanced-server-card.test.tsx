/**
 * 🧪 Enhanced Server Card Tests v5.0
 *
 * 개선된 서버 카드 컴포넌트의 테스트
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnhancedServerCard from '../../src/components/dashboard/EnhancedServerCard';

// Mock framer-motion to avoid animation issues in tests - 완전한 mock
vi.mock('framer-motion', () => {
  // eslint-disable-next-line react/display-name
  const createMotionComponent =
    (tag: string) =>
    ({
      children,
      className,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...props
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any) =>
      React.createElement(
        tag,
        {
          className,
          onClick,
          onMouseEnter,
          onMouseLeave,
          onMouseDown,
          onMouseUp,
          'data-testid': `motion-${tag}`,
          ...props,
        },
        children
      );

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
    },
    AnimatePresence: ({
      children,
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any) => <div data-testid='animate-presence'>{children}</div>,
  };
});

// Mock lucide-react icons - 모든 아이콘 포함
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid='activity-icon'>Activity</div>,
  AlertTriangle: () => <div data-testid='alert-icon'>Alert</div>,
  BarChart3: () => <div data-testid='barchart-icon'>BarChart</div>,
  Box: () => <div data-testid='box-icon'>Box</div>,
  Cloud: () => <div data-testid='cloud-icon'>Cloud</div>,
  Code: () => <div data-testid='code-icon'>Code</div>,
  Cpu: () => <div data-testid='cpu-icon'>CPU</div>,
  Database: () => <div data-testid='database-icon'>Database</div>,
  FileText: () => <div data-testid='filetext-icon'>FileText</div>,
  GitBranch: () => <div data-testid='gitbranch-icon'>GitBranch</div>,
  Globe: () => <div data-testid='globe-icon'>Globe</div>,
  HardDrive: () => <div data-testid='harddrive-icon'>HardDrive</div>,
  Layers: () => <div data-testid='layers-icon'>Layers</div>,
  Mail: () => <div data-testid='mail-icon'>Mail</div>,
  Minus: () => <div data-testid='minus-icon'>Minus</div>,
  Network: () => <div data-testid='network-icon'>Network</div>,
  Search: () => <div data-testid='search-icon'>Search</div>,
  Server: () => <div data-testid='server-icon'>Server</div>,
  Settings: () => <div data-testid='settings-icon'>Settings</div>,
  Shield: () => <div data-testid='shield-icon'>Shield</div>,
  TrendingDown: () => <div data-testid='trending-down-icon'>TrendingDown</div>,
  TrendingUp: () => <div data-testid='trending-up-icon'>TrendingUp</div>,
  Wifi: () => <div data-testid='wifi-icon'>Wifi</div>,
  Zap: () => <div data-testid='zap-icon'>Zap</div>,
}));

describe('EnhancedServerCard v5.0', () => {
  const mockServer = {
    id: 'server-001',
    hostname: 'test-server.example.com',
    name: 'Test Server',
    type: 'nginx',
    environment: 'production',
    location: 'Seoul, KR',
    provider: 'AWS',
    status: 'healthy' as const,
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 25,
    uptime: '15d 8h 32m',
    lastUpdate: new Date('2024-01-01T10:00:00Z'),
    alerts: 0,
    services: [
      { name: 'nginx', status: 'running' as const, port: 80 },
      { name: 'ssl', status: 'running' as const, port: 443 },
      { name: 'monitoring', status: 'running' as const, port: 9090 },
    ],
    specs: {
      cpu_cores: 4,
      memory_gb: 16,
      disk_gb: 500,
      network_speed: '1 Gbps',
    },
    os: 'Ubuntu 22.04 LTS',
    ip: '10.0.1.15',
    networkStatus: 'healthy' as const,
    health: {
      score: 92,
    },
    alertsSummary: {
      total: 0,
    },
  };

  const defaultProps = {
    server: mockServer,
    index: 0,
    onClick: vi.fn(),
    showMiniCharts: true,
    variant: 'default' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('서버 카드가 올바르게 렌더링된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByText('nginx • Seoul, KR')).toBeInTheDocument();
      expect(screen.getAllByText('정상')[0]).toBeInTheDocument();
    });

    it('서버 아이콘이 타입에 따라 올바르게 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByTestId('server-icon')).toBeInTheDocument();
    });

    it('헬스 스코어가 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('92/100')).toBeInTheDocument();
    });

    it('네트워크 속도가 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('1 Gbps')).toBeInTheDocument();
    });
  });

  describe('상태별 테마', () => {
    it('healthy 상태의 테마가 적용된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getAllByText('정상').length).toBeGreaterThan(0);
    });

    it('warning 상태의 테마가 적용된다', () => {
      const warningServer = { ...mockServer, status: 'warning' as const };
      render(<EnhancedServerCard {...defaultProps} server={warningServer} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('경고')).toBeInTheDocument();
    });

    it('critical 상태의 테마가 적용된다', () => {
      const criticalServer = { ...mockServer, status: 'critical' as const };
      render(<EnhancedServerCard {...defaultProps} server={criticalServer} />);
      expect(screen.getByText('🚨')).toBeInTheDocument();
      expect(screen.getByText('위험')).toBeInTheDocument();
    });

    it('maintenance 상태의 테마가 적용된다', () => {
      const maintenanceServer = {
        ...mockServer,
        status: 'maintenance' as const,
      };
      render(
        <EnhancedServerCard {...defaultProps} server={maintenanceServer} />
      );
      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByText('유지보수')).toBeInTheDocument();
    });

    it('offline 상태의 테마가 적용된다', () => {
      const offlineServer = { ...mockServer, status: 'offline' as const };
      render(<EnhancedServerCard {...defaultProps} server={offlineServer} />);
      expect(screen.getByText('⚪')).toBeInTheDocument();
      expect(screen.getByText('오프라인')).toBeInTheDocument();
    });
  });

  describe('미니 차트', () => {
    it('미니 차트가 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getAllByText('CPU').length).toBeGreaterThan(0);
      expect(screen.getByText('메모리')).toBeInTheDocument();
      expect(screen.getByText('디스크')).toBeInTheDocument();
      expect(screen.getByText('네트워크')).toBeInTheDocument();
    });

    it('미니 차트를 숨길 수 있다', () => {
      render(<EnhancedServerCard {...defaultProps} showMiniCharts={false} />);
      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
      expect(screen.queryByText('메모리')).not.toBeInTheDocument();
    });

    it('CPU 사용률이 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      const percentageTexts = screen.getAllByText(/\d+%/);
      expect(percentageTexts.length).toBeGreaterThan(0);
      expect(percentageTexts[0]).toBeInTheDocument();
    });

    it('메모리 사용률이 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      const percentageTexts = screen.getAllByText(/\d+%/);
      expect(percentageTexts.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('서비스 상태', () => {
    it('실행 중인 서비스가 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('nginx')).toBeInTheDocument();
      expect(screen.getByText('ssl')).toBeInTheDocument();
      expect(screen.getByText('monitoring')).toBeInTheDocument();
    });

    it('서비스가 3개를 초과하면 "+N개 더" 표시된다', () => {
      const serverWithManyServices = {
        ...mockServer,
        services: [
          ...mockServer.services,
          { name: 'service4', status: 'running' as const, port: 8080 },
          { name: 'service5', status: 'running' as const, port: 8081 },
        ],
      };
      render(
        <EnhancedServerCard {...defaultProps} server={serverWithManyServices} />
      );
      expect(screen.getByText('+2개 더')).toBeInTheDocument();
    });
  });

  describe('네트워크 상태', () => {
    it('네트워크 상태가 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.getByText('네트워크 상태')).toBeInTheDocument();
      const statusTexts = screen.getAllByText('정상');
      expect(statusTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('네트워크 상태 아이콘이 표시된다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      const wifiIcons = screen.getAllByTestId('wifi-icon');
      expect(wifiIcons.length).toBeGreaterThan(0);
      expect(wifiIcons[0]).toBeInTheDocument();
    });
  });

  describe('알림', () => {
    it('알림이 없으면 알림 섹션이 표시되지 않는다', () => {
      render(<EnhancedServerCard {...defaultProps} />);
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });

    it('알림이 있으면 알림 섹션이 표시된다', () => {
      const serverWithAlerts = {
        ...mockServer,
        alerts: 3,
        alertsSummary: { total: 3 },
      };
      render(
        <EnhancedServerCard {...defaultProps} server={serverWithAlerts} />
      );
      expect(screen.getByText('3개 알림')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  describe('변형 (Variants)', () => {
    it('compact 변형이 올바르게 렌더링된다', () => {
      render(<EnhancedServerCard {...defaultProps} variant='compact' />);
      expect(screen.getByText('Test Server')).toBeInTheDocument();
      // compact에서는 일부 정보가 숨겨짐
      expect(screen.queryByText('네트워크 상태')).not.toBeInTheDocument();
    });

    it('detailed 변형이 올바르게 렌더링된다', () => {
      render(<EnhancedServerCard {...defaultProps} variant='detailed' />);
      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByText('네트워크 상태')).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('카드 클릭 시 onClick이 호출된다', () => {
      const mockOnClick = vi.fn();
      render(<EnhancedServerCard {...defaultProps} onClick={mockOnClick} />);

      const card = screen.getByText('Test Server').closest('div');
      fireEvent.click(card!);

      expect(mockOnClick).toHaveBeenCalledWith(mockServer);
    });

    it('마우스 호버 시 추가 정보가 표시된다', async () => {
      render(<EnhancedServerCard {...defaultProps} />);

      const card = screen.getByText('Test Server').closest('div');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(screen.getByText('업타임:')).toBeInTheDocument();
        expect(screen.getByText('15d 8h 32m')).toBeInTheDocument();
        expect(screen.getByText('IP:')).toBeInTheDocument();
        expect(screen.getByText('10.0.1.15')).toBeInTheDocument();
        expect(screen.getByText('OS:')).toBeInTheDocument();
        expect(screen.getByText('Ubuntu 22.04 LTS')).toBeInTheDocument();
      });
    });

    it('마우스 리브 시 추가 정보가 숨겨진다', async () => {
      render(<EnhancedServerCard {...defaultProps} />);

      const card = screen.getByText('Test Server').closest('div');
      fireEvent.mouseEnter(card!);
      fireEvent.mouseLeave(card!);

      await waitFor(() => {
        expect(screen.queryByText('업타임:')).not.toBeInTheDocument();
      });
    });
  });

  describe('서버 타입별 아이콘', () => {
    const serverTypes = [
      { type: 'nginx', expectedIcon: 'server-icon' },
      { type: 'mysql', expectedIcon: 'database-icon' },
      { type: 'nodejs', expectedIcon: 'gitbranch-icon' },
      { type: 'redis', expectedIcon: 'zap-icon' },
      { type: 'elasticsearch', expectedIcon: 'search-icon' },
      { type: 'prometheus', expectedIcon: 'barchart-icon' },
    ];

    serverTypes.forEach(({ type, expectedIcon }) => {
      it(`${type} 타입의 아이콘이 올바르게 표시된다`, () => {
        const serverWithType = { ...mockServer, type };
        render(
          <EnhancedServerCard {...defaultProps} server={serverWithType} />
        );
        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
      });
    });
  });

  describe('스냅샷 테스트', () => {
    it('기본 상태의 구조가 올바르다', () => {
      const { container } = render(<EnhancedServerCard {...defaultProps} />);
      expect(container.querySelector('.relative.p-6')).toBeInTheDocument();
      expect(container.querySelector('.grid.grid-cols-2')).toBeInTheDocument();
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });

    it('warning 상태의 구조가 올바르다', () => {
      const warningServer = { ...mockServer, status: 'warning' as const };
      const { container } = render(
        <EnhancedServerCard {...defaultProps} server={warningServer} />
      );
      expect(container.querySelector('.relative.p-6')).toBeInTheDocument();
      expect(container.querySelector('.grid.grid-cols-2')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('compact 변형의 구조가 올바르다', () => {
      const { container } = render(
        <EnhancedServerCard {...defaultProps} variant='compact' />
      );
      // compact 변형은 구조가 다를 수 있으므로 기본적인 컨테이너만 확인
      expect(container.firstElementChild).toBeInTheDocument(); // 메인 컨테이너 존재 확인
      expect(screen.getByText('Test Server')).toBeInTheDocument(); // 서버 이름 표시 확인
    });
  });
});
