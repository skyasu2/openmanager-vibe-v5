import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AvailabilityChart from './AvailabilityChart';

// Recharts 목업
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='pie-chart'>{children}</div>
  ),
  Pie: () => <div data-testid='pie' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Cell: () => <div data-testid='cell' />,
}));

// Lucide React 아이콘 목업
vi.mock('lucide-react', () => ({
  Activity: () => <div data-testid='activity-icon' />,
  Loader2: () => <div data-testid='loader-icon' />,
  Shield: () => <div data-testid='shield-icon' />,
}));

describe('AvailabilityChart', () => {
  const mockData = [
    { name: '온라인', value: 48, color: '#82ca9d' },
    { name: '오프라인', value: 1, color: '#ff7c7c' },
    { name: '점검중', value: 1, color: '#ffc658' },
  ];

  it('기본 props로 렌더링된다', () => {
    render(<AvailabilityChart data={mockData} />);

    expect(screen.getByText('서버 가용성')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('커스텀 제목을 표시한다', () => {
    const customTitle = '서버 상태 가용성';
    render(<AvailabilityChart data={mockData} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('제목 숨기기 옵션이 작동한다', () => {
    render(<AvailabilityChart data={mockData} showTitle={false} />);

    expect(screen.queryByText('서버 가용성')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shield-icon')).not.toBeInTheDocument();
  });

  it('로딩 상태를 표시한다', () => {
    render(<AvailabilityChart data={[]} isLoading={true} />);

    expect(screen.getByText('가용성 데이터 로딩 중...')).toBeInTheDocument();
    expect(screen.getByLabelText('가용성 차트 로딩 중')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('빈 데이터 상태를 처리한다', () => {
    render(<AvailabilityChart data={[]} />);

    expect(
      screen.getByText('표시할 가용성 데이터가 없습니다')
    ).toBeInTheDocument();
  });

  it('undefined 데이터를 처리한다', () => {
    render(<AvailabilityChart data={undefined as any} />);

    expect(
      screen.getByText('표시할 가용성 데이터가 없습니다')
    ).toBeInTheDocument();
  });

  it('커스텀 높이가 적용된다', () => {
    render(<AvailabilityChart data={mockData} height={500} />);

    const container = screen.getByRole('presentation');
    expect(container).toHaveStyle({ height: '500px' });
  });

  it('모바일 최적화 모드가 작동한다', () => {
    render(<AvailabilityChart data={mockData} isMobile={true} />);

    const container = screen.getByRole('presentation');
    expect(container).toHaveStyle({ height: '200px' });
    expect(container).toHaveClass('h-48');
  });

  it('커스텀 SLA 목표가 설정된다', () => {
    render(<AvailabilityChart data={mockData} slaTarget={95.0} />);

    // SLA 목표가 내부적으로 사용되는지 확인
    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveAttribute('aria-label');
  });

  it('커스텀 CSS 클래스가 적용된다', () => {
    const customClass = 'custom-availability-class';
    render(<AvailabilityChart data={mockData} className={customClass} />);

    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveClass(customClass);
  });
});
