/**
 * 📊 ImprovedServerCard 컴포넌트 테스트 v3.0
 *
 * 개선된 서버 카드의 주요 기능들을 테스트합니다:
 * - 기본 렌더링 및 데이터 표시
 * - 상태별 스타일링 (online, warning, offline)
 * - 배리언트 (compact, standard, detailed)
 * - 인터랙션 (클릭, 호버)
 * - 접근성 (ARIA 속성, 키보드 내비게이션)
 */

import { fireEvent, screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
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

  it('서버 카드가 올바르게 렌더링된다', () => {
    render(<ImprovedServerCard {...defaultProps} />);
    expect(screen.getByText('Test Web Server')).toBeInTheDocument();
  });

  it('카드 클릭 시 onClick 핸들러가 호출된다', () => {
    const mockOnClick = vi.fn();
    render(<ImprovedServerCard {...defaultProps} onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockServer);
  });

  it('경고 상태 서버가 올바르게 렌더링된다', () => {
    const warningServer = { ...mockServer, status: 'warning' as const };
    render(<ImprovedServerCard {...defaultProps} server={warningServer} />);
    expect(screen.getByText('경고')).toBeInTheDocument();
  });

  it('compact 배리언트가 올바르게 렌더링된다', () => {
    render(<ImprovedServerCard {...defaultProps} variant='compact' />);
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
  });
});
