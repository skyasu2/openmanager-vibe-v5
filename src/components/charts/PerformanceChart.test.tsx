import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChartDataPoint } from '../../types/dashboard';
import PerformanceChart from './PerformanceChart';

// Recharts 목업
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='bar-chart'>{children}</div>
  ),
  Bar: () => <div data-testid='bar' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='cartesian-grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Cell: () => <div data-testid='cell' />,
}));

// Lucide React 아이콘 목업
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid='trending-up-icon' />,
}));

describe('PerformanceChart', () => {
  const mockData: ChartDataPoint[] = [
    { name: '00:00', value: 45, color: '#8884d8' },
    { name: '04:00', value: 32, color: '#82ca9d' },
    { name: '08:00', value: 78, color: '#ffc658' },
    { name: '12:00', value: 89, color: '#ff7c7c' },
  ];

  it('기본 props로 렌더링된다', () => {
    render(<PerformanceChart data={mockData} />);

    expect(screen.getByText('시스템 성능')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('커스텀 제목을 표시한다', () => {
    const customTitle = '서버 성능 모니터링';
    render(<PerformanceChart data={mockData} title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('제목 숨기기 옵션이 작동한다', () => {
    render(<PerformanceChart data={mockData} showTitle={false} />);

    expect(screen.queryByText('시스템 성능')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trending-up-icon')).not.toBeInTheDocument();
  });

  it('로딩 상태를 표시한다', () => {
    render(<PerformanceChart data={[]} isLoading={true} />);

    expect(screen.getByText('데이터 로딩 중...')).toBeInTheDocument();
    expect(screen.getByLabelText('성능 차트 로딩 중')).toBeInTheDocument();
  });

  it('빈 데이터 상태를 처리한다', () => {
    render(<PerformanceChart data={[]} />);

    expect(
      screen.getByText('표시할 성능 데이터가 없습니다')
    ).toBeInTheDocument();
  });

  it('undefined 데이터를 처리한다', () => {
    render(<PerformanceChart data={undefined as any} />);

    expect(
      screen.getByText('표시할 성능 데이터가 없습니다')
    ).toBeInTheDocument();
  });

  it('커스텀 높이가 적용된다', () => {
    render(<PerformanceChart data={mockData} height={500} />);

    const container = screen.getByRole('presentation');
    expect(container).toHaveStyle({ height: '500px' });
  });

  it('모바일 최적화 모드가 작동한다', () => {
    render(<PerformanceChart data={mockData} isMobile={true} />);

    const container = screen.getByRole('presentation');
    expect(container).toHaveStyle({ height: '200px' });
    expect(container).toHaveClass('h-48');
  });

  it('커스텀 CSS 클래스가 적용된다', () => {
    const customClass = 'custom-chart-class';
    render(<PerformanceChart data={mockData} className={customClass} />);

    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveClass(customClass);
  });

  it('접근성 속성이 올바르게 설정된다', () => {
    render(<PerformanceChart data={mockData} />);

    const chartContainer = screen.getByRole('img');
    expect(chartContainer).toHaveAttribute('aria-label');

    const title = screen.getByText('시스템 성능');
    expect(title).toHaveAttribute('id', 'performance-chart-title');

    const presentationContainer = screen.getByRole('presentation');
    expect(presentationContainer).toHaveAttribute(
      'aria-labelledby',
      'performance-chart-title'
    );
  });

  it('차트 요소들이 렌더링된다', () => {
    render(<PerformanceChart data={mockData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
