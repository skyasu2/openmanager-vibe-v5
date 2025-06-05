import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardHeader from './DashboardHeader';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useAISidebarStore } from '@/stores/useAISidebarStore';

// Mock props 타입 정의
const mockProps = {
  serverStats: {
    total: 10,
    online: 8,
    warning: 1,
    offline: 1,
  },
  onNavigateHome: vi.fn(),
  onToggleAgent: vi.fn(),
  systemStatusDisplay: <div data-testid="system-status">시스템 정상</div>,
};

beforeEach(() => {
  useUnifiedAdminStore.setState({
    aiAgent: { isEnabled: true, isAuthenticated: false, state: 'enabled' }
  });
  useAISidebarStore.setState({ isOpen: false });
});

describe('DashboardHeader', () => {
  it('서버 통계를 올바르게 표시해야 함', () => {
    render(<DashboardHeader {...mockProps} />);
    
    // 서버 통계 확인 - 라벨과 함께 검증
    expect(screen.getByText(/10대/)).toBeInTheDocument();
    expect(screen.getByText('전체 서버')).toBeInTheDocument();
    
    expect(screen.getByText(/8대/)).toBeInTheDocument(); // 온라인
    
    // 1대가 여러 개이므로 getAllByText 사용
    const oneServerElements = screen.getAllByText(/1대/);
    expect(oneServerElements.length).toBe(2); // 경고 1대, 오프라인 1대
    
    // 상태별 라벨 확인
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText('경고')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
  });

  it('홈 버튼 클릭 시 onNavigateHome이 호출되어야 함', () => {
    render(<DashboardHeader {...mockProps} />);
    
    const homeButton = screen.getByRole('button', { name: /홈/i });
    fireEvent.click(homeButton);
    
    expect(mockProps.onNavigateHome).toHaveBeenCalledTimes(1);
  });

  it('AI 에이전트 토글 버튼이 올바르게 동작해야 함', () => {
    render(<DashboardHeader {...mockProps} />);
    
    const agentButton = screen.getByRole('button', { name: /ai 에이전트/i });
    fireEvent.click(agentButton);
    
    expect(mockProps.onToggleAgent).toHaveBeenCalledTimes(1);
  });

  it('AI 에이전트가 열린 상태일 때 버튼 스타일이 변경되어야 함', () => {
    useAISidebarStore.setState({ isOpen: true });

    render(<DashboardHeader {...mockProps} />);

    const agentButton = screen.getByRole('button', { name: /ai 에이전트/i });
    expect(agentButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('시스템 상태 디스플레이가 렌더링되어야 함', () => {
    render(<DashboardHeader {...mockProps} />);
    
    expect(screen.getByTestId('system-status')).toBeInTheDocument();
    expect(screen.getByText('시스템 정상')).toBeInTheDocument();
  });

  it('서버가 없을 때 0을 표시해야 함', () => {
    const propsWithNoServers = {
      ...mockProps,
      serverStats: {
        total: 0,
        online: 0,
        warning: 0,
        offline: 0,
      },
    };
    
    render(<DashboardHeader {...propsWithNoServers} />);
    
    // 0대가 여러 개이므로 getAllByText 사용
    const zeroElements = screen.getAllByText(/0대/);
    expect(zeroElements.length).toBe(4); // 전체, 온라인, 경고, 오프라인
    
    // 라벨들 확인
    expect(screen.getByText('전체 서버')).toBeInTheDocument();
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText('경고')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
  });

  it('접근성 속성이 올바르게 설정되어야 함', () => {
    render(<DashboardHeader {...mockProps} />);
    
    // AI 에이전트 버튼 접근성
    const agentButton = screen.getByRole('button', { name: /ai 에이전트/i });
    expect(agentButton).toHaveAttribute('aria-pressed', 'false');
    expect(agentButton).toHaveAttribute('aria-label');
    
    // 홈 버튼 접근성
    const homeButton = screen.getByRole('button', { name: /홈/i });
    expect(homeButton).toBeInTheDocument();
    
    // 서버 통계 접근성
    const statsElement = screen.getByRole('status');
    expect(statsElement).toHaveAttribute('aria-label', '서버 통계');
  });

  it('대량의 서버 수도 올바르게 표시해야 함', () => {
    const propsWithManyServers = {
      ...mockProps,
      serverStats: {
        total: 999,
        online: 850,
        warning: 100,
        offline: 49,
      },
    };
    
    render(<DashboardHeader {...propsWithManyServers} />);
    
    // 각 고유한 숫자들 확인
    expect(screen.getByText(/999대/)).toBeInTheDocument();
    expect(screen.getByText(/850대/)).toBeInTheDocument();
    expect(screen.getByText(/100대/)).toBeInTheDocument();
    expect(screen.getByText(/49대/)).toBeInTheDocument();
    
    // 라벨들이 표시되는지 확인
    expect(screen.getByText('전체 서버')).toBeInTheDocument();
    expect(screen.getByText('온라인')).toBeInTheDocument();
    expect(screen.getByText('경고')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
  });
}); 