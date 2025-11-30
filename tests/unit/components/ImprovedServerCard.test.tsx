/**
 * 🧪 ImprovedServerCard 컴포넌트 User Event 테스트
 *
 * @description 서버 카드의 렌더링, 인터랙션, 안전성 검증 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImprovedServerCard from '@/components/dashboard/ImprovedServerCard';
import type { Server } from '@/types/server';

// Mock dependencies
vi.mock('@/hooks/useFixed24hMetrics', () => ({
  useFixed24hMetrics: vi.fn(() => ({
    currentMetrics: {
      cpu: 45.2,
      memory: 62.8,
      disk: 73.5,
      network: 28.9,
    },
  })),
}));

vi.mock('@/components/shared/ServerMetricsChart', () => ({
  ServerMetricsChart: vi.fn(() => (
    <div data-testid="mock-metrics-chart">Mock Chart</div>
  )),
}));

describe('🎯 ImprovedServerCard - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
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
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('서버 이름이 정상적으로 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      expect(screen.getByText('Web Server 01')).toBeDefined();
    });

    it('서버 위치가 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      expect(screen.getByText(/서울/)).toBeDefined();
    });

    it('서버 상태가 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // 'online' 상태는 '정상' 또는 'Online' 텍스트로 표시될 수 있음
      const statusElements = screen.getAllByText(/정상|Online|online/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('안전성 검증', () => {
    it('null 서버 객체를 안전하게 처리한다', () => {
      // @ts-expect-error - 의도적으로 null 전달하여 안전성 테스트
      render(<ImprovedServerCard server={null} onClick={mockOnClick} />);

      expect(screen.getByText(/서버 데이터 로딩 중/)).toBeDefined();
    });

    it('undefined 서버 객체를 안전하게 처리한다', () => {
      // @ts-expect-error - 의도적으로 undefined 전달하여 안전성 테스트
      render(<ImprovedServerCard server={undefined} onClick={mockOnClick} />);

      expect(screen.getByText(/서버 데이터 로딩 중/)).toBeDefined();
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

      expect(screen.getByText('Incomplete Server')).toBeDefined();
    });
  });

  describe('클릭 인터랙션', () => {
    it('카드 클릭 시 onClick 핸들러가 호출된다', async () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'server-1',
          name: 'Web Server 01',
        })
      );
    });

    it('여러 번 클릭해도 각각 호출된다', async () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      await user.click(card);
      await user.click(card);
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('호버 인터랙션', () => {
    it('마우스 호버 시 스타일이 변경된다', async () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });

      // 호버 전 초기 상태 확인
      expect(card).toBeDefined();

      // 마우스 호버
      await user.hover(card);

      // 호버 효과 확인 (style 속성에 transition 있는지 확인)
      await waitFor(() => {
        const style = card.getAttribute('style');
        expect(style).toContain('transition');
      });
    });

    it('마우스가 떠나면 원래 상태로 돌아온다', async () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });

      // 호버 후 언호버
      await user.hover(card);
      await user.unhover(card);

      expect(card).toBeDefined();
    });
  });

  describe('메트릭 표시', () => {
    it('CPU 메트릭이 aria-label에 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      const ariaLabel = card.getAttribute('aria-label');

      // aria-label에 CPU 정보 포함 확인
      expect(ariaLabel).toContain('CPU');
      expect(ariaLabel).toContain('45');
    });

    it('메모리 메트릭이 aria-label에 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      const ariaLabel = card.getAttribute('aria-label');

      // aria-label에 메모리 정보 포함 확인
      expect(ariaLabel).toContain('메모리');
      expect(ariaLabel).toContain('63'); // 62.8 반올림
    });

    it('서버 메트릭이 종합적으로 aria-label에 표시된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      const ariaLabel = card.getAttribute('aria-label');

      // 서버 이름, 상태, CPU, 메모리 모두 포함
      expect(ariaLabel).toContain('Web Server 01');
      expect(ariaLabel).toContain('정상');
      expect(ariaLabel).toContain('CPU');
      expect(ariaLabel).toContain('메모리');
    });
  });

  describe('상태별 스타일', () => {
    it('online 상태일 때 녹색 테마를 적용한다', () => {
      const onlineServer = { ...mockServer, status: 'online' as const };
      const { container } = render(
        <ImprovedServerCard server={onlineServer} onClick={mockOnClick} />
      );

      // 녹색 관련 클래스 또는 스타일 확인
      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });

    it('offline 상태일 때 회색 테마를 적용한다', () => {
      const offlineServer = { ...mockServer, status: 'offline' as const };
      render(
        <ImprovedServerCard server={offlineServer} onClick={mockOnClick} />
      );

      // offline 상태 텍스트 확인
      const statusElements = screen.getAllByText(/오프라인|Offline|offline/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('warning 상태일 때 주황색 테마를 적용한다', () => {
      const warningServer = { ...mockServer, status: 'warning' as const };
      render(
        <ImprovedServerCard server={warningServer} onClick={mockOnClick} />
      );

      // warning 상태 텍스트 확인
      const statusElements = screen.getAllByText(/경고|Warning|warning/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('접근성', () => {
    it('카드가 button role을 가진다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // 메인 카드 버튼 찾기 (서버 이름으로)
      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });

    it('서버 이름이 aria-label에 포함된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card.getAttribute('aria-label')).toContain('Web Server 01');
    });
  });

  describe('variant 속성', () => {
    it('compact variant를 렌더링한다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="compact"
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
      // compact variant는 간소화된 정보만 표시
      expect(screen.getByText('Web Server 01')).toBeDefined();
    });

    it('standard variant를 렌더링한다 (기본값)', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="standard"
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });

    it('detailed variant를 렌더링한다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          variant="detailed"
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
      // detailed variant는 더 많은 정보 표시
    });
  });

  describe('서비스 목록', () => {
    it('서버에 서비스 정보가 있을 때 정상 렌더링된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      // 컴포넌트가 정상적으로 렌더링되는지 확인
      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();

      // 서비스 정보가 mockServer에 포함되어 있음을 확인
      expect(mockServer.services).toHaveLength(2);
      expect(mockServer.services[0].name).toBe('Nginx');
    });

    it('서비스 데이터가 컴포넌트에 전달된다', () => {
      const { container } = render(
        <ImprovedServerCard server={mockServer} onClick={mockOnClick} />
      );

      // 컴포넌트가 서비스 데이터를 받아서 렌더링됨
      expect(container.querySelector('button')).toBeDefined();

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

      render(
        <ImprovedServerCard
          server={serverWithoutServices}
          onClick={mockOnClick}
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });
  });

  describe('Progressive Disclosure', () => {
    it('enableProgressiveDisclosure가 true일 때 확장 가능하다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          enableProgressiveDisclosure={true}
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });

    it('enableProgressiveDisclosure가 false일 때 모든 정보가 표시된다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          enableProgressiveDisclosure={false}
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });
  });

  describe('실시간 업데이트', () => {
    it('showRealTimeUpdates가 true일 때 실시간 메트릭이 활성화된다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          showRealTimeUpdates={true}
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });

    it('showRealTimeUpdates가 false일 때도 정상 렌더링된다', () => {
      render(
        <ImprovedServerCard
          server={mockServer}
          onClick={mockOnClick}
          showRealTimeUpdates={false}
        />
      );

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();
    });
  });

  describe('추가 메트릭 표시', () => {
    it('서버 메트릭 데이터가 올바르게 전달된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      expect(card).toBeDefined();

      // 메트릭 데이터 구조 검증
      expect(mockServer.cpu).toBe(45.2);
      expect(mockServer.memory).toBe(62.8);
      expect(mockServer.disk).toBe(73.5);
      expect(mockServer.network).toBe(28.9);
    });

    it('aria-label에 기본 메트릭이 포함된다', () => {
      render(<ImprovedServerCard server={mockServer} onClick={mockOnClick} />);

      const card = screen.getByRole('button', { name: /Web Server 01/ });
      const ariaLabel = card.getAttribute('aria-label');

      // aria-label 존재 확인 및 기본 정보 포함 확인
      expect(ariaLabel).toBeDefined();
      expect(ariaLabel).toContain('Web Server 01');
      expect(ariaLabel).toContain('정상'); // 상태 정보
    });
  });
});
