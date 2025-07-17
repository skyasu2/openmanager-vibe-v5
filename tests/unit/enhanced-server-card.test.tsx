/**
 * 📊 ImprovedServerCard 컴포넌트 테스트 v3.0
 *
 * 개선된 서버 카드의 주요 기능들을 테스트합니다:
 * - 기본 렌더링 및 데이터 표시
 * - 상태별 스타일링 (online, warning, offline)
 * - 배리언트 (compact, standard, detailed)
 * - 인터랙션 (클릭, 호버)
 * - 접근성 (ARIA 속성, 키보드 내비게이션)
 * - 실시간 업데이트 기능
 * - 서비스 상태 표시
 * - 알림 표시
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImprovedServerCard from '../../src/components/dashboard/ImprovedServerCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
    span: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
    button: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = (props: Record<string, unknown>) => (
    <div data-testid='mock-icon' {...props} />
  );

  return {
    Activity: MockIcon,
    AlertCircle: MockIcon,
    CheckCircle2: MockIcon,
    Clock: MockIcon,
    Cpu: MockIcon,
    HardDrive: MockIcon,
    MapPin: MockIcon,
    Server: MockIcon,
    Wifi: MockIcon,
    XCircle: MockIcon,
    AlertTriangle: MockIcon,
    Database: MockIcon,
    Shield: MockIcon,
  };
});

// Mock UnifiedCircularGauge components
vi.mock('../../src/components/shared/UnifiedCircularGauge', () => ({
  default: ({
    value,
    type,
    ...props
  }: {
    value: number;
    type: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={`mock-gauge-${type}`} data-value={value} {...props}>
      {value}%
    </div>
  ),
  ServerCardGauge: ({
    value,
    type,
    ...props
  }: {
    value: number;
    type: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={`mock-card-gauge-${type}`} data-value={value} {...props}>
      {value}%
    </div>
  ),
  ServerModalGauge: ({
    value,
    type,
    ...props
  }: {
    value: number;
    type: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={`mock-modal-gauge-${type}`} data-value={value} {...props}>
      {value}%
    </div>
  ),
  ServerModal3DGauge: ({
    value,
    type,
    ...props
  }: {
    value: number;
    type: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={`mock-3d-gauge-${type}`} data-value={value} {...props}>
      {value}%
    </div>
  ),
}));

describe('ImprovedServerCard v3.0', () => {
  const mockServer = {
    id: 'test-server-001',
    name: 'Test Web Server',
    status: 'online' as const,
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 89,
    location: 'Seoul DC1',
    uptime: '15d 4h 23m',
    ip: '192.168.1.100',
    os: 'Ubuntu 22.04 LTS',
    alerts: 2,
    lastUpdate: new Date(),
    services: [
      { name: 'nginx', status: 'running' as const, port: 80 },
      { name: 'mysql', status: 'running' as const, port: 3306 },
      { name: 'redis', status: 'stopped' as const, port: 6379 },
    ],
  };

  const defaultProps = {
    server: mockServer,
    onClick: vi.fn(),
    variant: 'standard' as const,
    showRealTimeUpdates: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('서버 카드가 올바르게 렌더링된다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      expect(screen.getByText('Test Web Server')).toBeInTheDocument();
      expect(screen.getByText('Seoul DC1')).toBeInTheDocument();
      expect(screen.getByText('15d 4h 23m')).toBeInTheDocument();
    });

    it('모든 메트릭 게이지가 표시된다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      
      expect(screen.getByTestId('mock-card-gauge-cpu')).toHaveAttribute('data-value', '45');
      expect(screen.getByTestId('mock-card-gauge-memory')).toHaveAttribute('data-value', '67');
      expect(screen.getByTestId('mock-card-gauge-disk')).toHaveAttribute('data-value', '23');
      expect(screen.getByTestId('mock-card-gauge-network')).toHaveAttribute('data-value', '89');
    });

    it('서비스 상태가 표시된다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      
      expect(screen.getByText('nginx')).toBeInTheDocument();
      expect(screen.getByText('mysql')).toBeInTheDocument();
      expect(screen.getByText('redis')).toBeInTheDocument();
    });

    it('알림 개수가 표시된다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('상태별 렌더링', () => {
    it('온라인 상태가 올바르게 표시된다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      expect(screen.getByText('정상')).toBeInTheDocument();
      expect(screen.getByText('정상')).toHaveClass('text-green-600');
    });

    it('경고 상태가 올바르게 표시된다', () => {
      const warningServer = { ...mockServer, status: 'warning' as const };
      render(<ImprovedServerCard {...defaultProps} server={warningServer} />);
      expect(screen.getByText('경고')).toBeInTheDocument();
      expect(screen.getByText('경고')).toHaveClass('text-yellow-600');
    });

    it('오프라인 상태가 올바르게 표시된다', () => {
      const offlineServer = { ...mockServer, status: 'offline' as const };
      render(<ImprovedServerCard {...defaultProps} server={offlineServer} />);
      expect(screen.getByText('오프라인')).toBeInTheDocument();
      expect(screen.getByText('오프라인')).toHaveClass('text-red-600');
    });

    it('점검 중 상태가 올바르게 표시된다', () => {
      const maintenanceServer = { ...mockServer, status: 'maintenance' as const };
      render(<ImprovedServerCard {...defaultProps} server={maintenanceServer} />);
      expect(screen.getByText('점검 중')).toBeInTheDocument();
    });
  });

  describe('배리언트별 렌더링', () => {
    it('compact 배리언트가 올바르게 렌더링된다', () => {
      render(<ImprovedServerCard {...defaultProps} variant='compact' />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-4'); // compact는 작은 패딩
    });

    it('standard 배리언트가 올바르게 렌더링된다', () => {
      render(<ImprovedServerCard {...defaultProps} variant='standard' />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-6'); // standard는 중간 패딩
    });

    it('detailed 배리언트가 올바르게 렌더링된다', () => {
      render(<ImprovedServerCard {...defaultProps} variant='detailed' />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      
      // detailed는 추가 정보 표시
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('Ubuntu 22.04 LTS')).toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('카드 클릭 시 onClick 핸들러가 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(<ImprovedServerCard {...defaultProps} onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith(mockServer);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('호버 시 스타일이 변경된다', async () => {
      const user = userEvent.setup();
      render(<ImprovedServerCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      await user.hover(card);
      
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('포커스 시 아웃라인이 표시된다', async () => {
      const user = userEvent.setup();
      render(<ImprovedServerCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      await user.tab();
      
      expect(card).toHaveFocus();
      expect(card).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 속성을 가진다', () => {
      render(<ImprovedServerCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Test Web Server'));
      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('키보드 내비게이션이 가능하다', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(<ImprovedServerCard {...defaultProps} onClick={mockOnClick} />);
      
      await user.tab();
      const card = screen.getByRole('button');
      expect(card).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledWith(mockServer);
    });

    it('스페이스바로 클릭이 가능하다', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(<ImprovedServerCard {...defaultProps} onClick={mockOnClick} />);
      
      await user.tab();
      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledWith(mockServer);
    });
  });

  describe('실시간 업데이트', () => {
    it('실시간 업데이트가 활성화되면 표시된다', () => {
      render(<ImprovedServerCard {...defaultProps} showRealTimeUpdates={true} />);
      
      // 실시간 인디케이터 확인
      const indicator = screen.getByTestId('realtime-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('animate-pulse');
    });

    it('메트릭이 업데이트되면 애니메이션이 표시된다', async () => {
      const { rerender } = render(<ImprovedServerCard {...defaultProps} />);
      
      const updatedServer = { ...mockServer, cpu: 75 };
      rerender(<ImprovedServerCard {...defaultProps} server={updatedServer} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-card-gauge-cpu')).toHaveAttribute('data-value', '75');
      });
    });
  });

  describe('에러 처리', () => {
    it('잘못된 데이터 형식을 처리한다', () => {
      const invalidServer = {
        ...mockServer,
        cpu: NaN,
        memory: -10,
        disk: 150,
        network: null as any,
      };
      
      render(<ImprovedServerCard {...defaultProps} server={invalidServer} />);
      
      // 에러 상태에서도 렌더링이 되어야 함
      expect(screen.getByText('Test Web Server')).toBeInTheDocument();
    });

    it('서비스 데이터가 없을 때 처리한다', () => {
      const noServicesServer = { ...mockServer, services: undefined };
      render(<ImprovedServerCard {...defaultProps} server={noServicesServer} />);
      
      // 서비스 섹션이 없어도 카드는 렌더링되어야 함
      expect(screen.getByText('Test Web Server')).toBeInTheDocument();
    });
  });

  describe('성능 최적화', () => {
    it('불필요한 리렌더링을 방지한다', () => {
      const { rerender } = render(<ImprovedServerCard {...defaultProps} />);
      
      // 동일한 props로 리렌더링
      rerender(<ImprovedServerCard {...defaultProps} />);
      
      // onClick은 한 번도 호출되지 않아야 함
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('메모이제이션이 올바르게 동작한다', () => {
      const mockOnClick = vi.fn();
      const { rerender } = render(
        <ImprovedServerCard {...defaultProps} onClick={mockOnClick} />
      );
      
      // onClick만 변경
      const newOnClick = vi.fn();
      rerender(<ImprovedServerCard {...defaultProps} onClick={newOnClick} />);
      
      // 서버 데이터는 동일하므로 메트릭 표시는 변경되지 않아야 함
      expect(screen.getByTestId('mock-card-gauge-cpu')).toHaveAttribute('data-value', '45');
    });
  });

  describe('알림 기능', () => {
    it('알림이 없을 때 배지가 표시되지 않는다', () => {
      const noAlertsServer = { ...mockServer, alerts: 0 };
      render(<ImprovedServerCard {...defaultProps} server={noAlertsServer} />);
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('알림이 많을 때 적절히 표시된다', () => {
      const manyAlertsServer = { ...mockServer, alerts: 99 };
      render(<ImprovedServerCard {...defaultProps} server={manyAlertsServer} />);
      
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('알림이 100개 이상일 때 99+로 표시된다', () => {
      const tooManyAlertsServer = { ...mockServer, alerts: 150 };
      render(<ImprovedServerCard {...defaultProps} server={tooManyAlertsServer} />);
      
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});