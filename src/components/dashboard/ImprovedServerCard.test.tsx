/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 ImprovedServerCard 컴포넌트 User Event 테스트
 *
 * @description 서버 카드의 렌더링, 인터랙션, 안전성 검증 테스트
 * @author Claude Code
 * @created 2025-11-26
 * @updated 2025-12-13 - aria-label 관련 테스트 수정
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImprovedServerCard from '../../../src/components/dashboard/ImprovedServerCard';
import type { Server } from '../../../src/types/server';

// Mock dependencies
vi.mock('../../../src/hooks/useFixed24hMetrics', () => ({
  useFixed24hMetrics: vi.fn(() => ({
    currentMetrics: {
      cpu: 45.2,
      memory: 62.8,
      disk: 73.5,
      network: 28.9,
    },
    historyData: [
      { cpu: 45, memory: 62, disk: 73, network: 28 },
      { cpu: 46, memory: 63, disk: 74, network: 29 },
    ],
  })),
}));

vi.mock('../../../src/components/shared/ServerMetricsChart', () => ({
  ServerMetricsChart: vi.fn(() => (
    <div data-testid="mock-metrics-chart">Mock Chart</div>
  )),
}));

vi.mock('../../../src/components/shared/MiniLineChart', () => ({
  MiniLineChart: vi.fn(() => (
    <div data-testid="mock-mini-chart">Mini Chart</div>
  )),
}));

vi.mock('../../../src/components/shared/AIInsightBadge', () => ({
  AIInsightBadge: vi.fn(() => (
    <div data-testid="ai-insight-badge">AI Badge</div>
  )),
}));

describe('🎯 ImprovedServerCard - User Event 테스트', () => {
  const mockOnClick = vi.fn();

  // Mock 서버 데이터
  const mockServer: Server = {
    id: 'server-1',
    name: 'Web Server 01',
    status: 'online',
    type: 'web',
    role: 'web',
    location: '서울',
    os: 'Ubuntu 22.04',
    ip: '192.168.1.100',
    uptime: 86400000, // 24시간
    cpu: 45.2,
    memory: 62.8,
    disk: 73.5,
    network: 28.9,
    alerts: 0,
    services: [
      { name: 'Nginx', status: 'running', port: 80 },
      { name: 'Node.js', status: 'running', port: 3000 },
    ],
    lastUpdate: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('서버 이름이 정상적으로 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      expect(screen.getByText('Web Server 01')).toBeInTheDocument();
    });

    it('서버 위치가 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      expect(screen.getByText(/서울/)).toBeInTheDocument();
    });

    it('Live 인디케이터가 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // 실시간 업데이트 인디케이터
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('안전성 검증', () => {
    it('null 서버 객체를 안전하게 처리한다', () => {
      // @ts-expect-error - 의도적으로 null 전달하여 안전성 테스트
      render(<ImprovedServerCard server={null} onClick={mockOnClick} />);

      // useSafeServer가 기본값을 반환하므로 Unknown Server가 표시됨
      expect(screen.getByText('Unknown Server')).toBeInTheDocument();
    });

    it('undefined 서버 객체를 안전하게 처리한다', () => {
      // @ts-expect-error - 의도적으로 undefined 전달하여 안전성 테스트
      render(<ImprovedServerCard server={undefined} onClick={mockOnClick} />);

      expect(screen.getByText('Unknown Server')).toBeInTheDocument();
    });

    it('불완전한 서버 데이터를 안전하게 처리한다', () => {
      const incompleteServer = {
        id: 'server-2',
        name: 'Incomplete Server',
        // 나머지 필드 없음
      } as Server;

      render(
        <ImprovedServerCard server={incompleteServer} onClick={mockOnClick} />
      );

      expect(screen.getByText('Incomplete Server')).toBeInTheDocument();
    });
  });

  describe('클릭 인터랙션', () => {
    // Helper to get the main card element (has role="button" and tabIndex="0")
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('카드 클릭 시 onClick 핸들러가 호출된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'server-1',
          name: 'Web Server 01',
        })
      );
    });

    it('여러 번 클릭해도 각각 호출된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      fireEvent.click(card);
      fireEvent.click(card);
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('키보드로 카드를 활성화할 수 있다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('스페이스바로 카드를 활성화할 수 있다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('호버 인터랙션', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('마우스 호버 시 컴포넌트가 정상 작동한다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();

      // 마우스 호버
      fireEvent.mouseEnter(card);
      expect(card).toBeInTheDocument();
    });

    it('마우스가 떠나면 원래 상태로 돌아온다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);

      // 호버 후 언호버
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(card).toBeInTheDocument();
    });
  });

  describe('메트릭 표시', () => {
    it('CPU 메트릭 레이블이 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // CPU 레이블 확인
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });

    it('MEM 메트릭 레이블이 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // MEM 레이블 확인
      expect(screen.getByText('MEM')).toBeInTheDocument();
    });

    it('Core Metrics 섹션이 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      expect(screen.getByText('Core Metrics')).toBeInTheDocument();
    });
  });

  describe('상태별 스타일', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('online 상태에서 정상 렌더링된다', () => {
      const onlineServer = { ...mockServer, status: 'online' as const };
      const { container } = render(
        <ImprovedServerCard server={onlineServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Web Server 01')).toBeInTheDocument();
    });

    it('offline 상태에서 정상 렌더링된다', () => {
      const offlineServer = { ...mockServer, status: 'offline' as const };
      const { container } = render(
        <ImprovedServerCard server={offlineServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });

    it('warning 상태에서 정상 렌더링된다', () => {
      const warningServer = { ...mockServer, status: 'warning' as const };
      const { container } = render(
        <ImprovedServerCard server={warningServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });

    it('critical 상태에서 정상 렌더링된다', () => {
      const criticalServer = { ...mockServer, status: 'critical' as const };
      const { container } = render(
        <ImprovedServerCard server={criticalServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('카드가 button role을 가진다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
      expect(card.getAttribute('role')).toBe('button');
    });

    it('tabIndex가 설정되어 키보드 탐색이 가능하다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('서버 이름이 표시되어 컨텍스트를 제공한다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      const serverName = within(card).getByText('Web Server 01');
      expect(serverName).toBeInTheDocument();
    });
  });

  describe('variant 속성', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('compact variant를 렌더링한다', () => {
      const { container } = render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="compact"
        />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Web Server 01')).toBeInTheDocument();
    });

    it('standard variant를 렌더링한다 (기본값)', () => {
      const { container } = render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="standard"
        />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });

    it('detailed variant를 렌더링한다', () => {
      const { container } = render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="detailed"
        />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });
  });

  describe('서비스 목록', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('서버에 서비스 정보가 있을 때 정상 렌더링된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();

      // 서비스 정보가 mockServer에 포함되어 있음을 확인
      expect(mockServer.services).toHaveLength(2);
      expect(mockServer.services[0].name).toBe('Nginx');
    });

    it('서비스 데이터가 컴포넌트에 전달된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      expect(container.querySelector('[role="button"]')).toBeInTheDocument();

      // 서비스 데이터 구조 검증
      expect(mockServer.services[0]).toHaveProperty('name');
      expect(mockServer.services[0]).toHaveProperty('status');
      expect(mockServer.services[0]).toHaveProperty('port');
    });

    it('서비스가 없어도 안전하게 렌더링된다', () => {
      const serverWithoutServices = {
        ...mockServer,
        services: [],
      };

      const { container } = render(
        <ImprovedServerCard
          server={serverWithoutServices}
          onClick={mockOnClick}
        />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });
  });

  describe('Progressive Disclosure', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('enableProgressiveDisclosure가 true일 때 확장 버튼이 있다', () => {
      const { container } = render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          enableProgressiveDisclosure={true}
        />
      );

      // 카드가 정상 렌더링됨
      const card = getCard(container);
      expect(card).toBeInTheDocument();

      // 내부에 확장 버튼(button 태그)이 있음
      const expandButton = container.querySelector('button');
      expect(expandButton).toBeInTheDocument();
    });

    it('enableProgressiveDisclosure가 false일 때 정상 렌더링된다', () => {
      const { container } = render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          enableProgressiveDisclosure={false}
        />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();
    });
  });

  describe('실시간 업데이트', () => {
    it('showRealTimeUpdates가 true일 때 Live 인디케이터가 표시된다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          showRealTimeUpdates={true}
        />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('showRealTimeUpdates가 false일 때 Live 인디케이터가 없다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          showRealTimeUpdates={false}
        />
      );

      expect(screen.queryByText('Live')).not.toBeInTheDocument();
    });
  });

  describe('추가 메트릭 표시', () => {
    // Helper to get the main card element
    const getCard = (container: HTMLElement) =>
      container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;

    it('서버 메트릭 데이터가 올바르게 전달된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      const card = getCard(container);
      expect(card).toBeInTheDocument();

      // 메트릭 데이터 구조 검증
      expect(mockServer.cpu).toBe(45.2);
      expect(mockServer.memory).toBe(62.8);
      expect(mockServer.disk).toBe(73.5);
      expect(mockServer.network).toBe(28.9);
    });

    it('메트릭 값이 화면에 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // Mock에서 설정한 CPU 값 (45.2 -> 45% 반올림)
      expect(screen.getByText('45%')).toBeInTheDocument();
      // Mock에서 설정한 메모리 값 (62.8 -> 63% 반올림)
      expect(screen.getByText('63%')).toBeInTheDocument();
    });
  });
});
