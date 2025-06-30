/**
 * 📊 PerformanceChart Storybook Stories
 * 2025-06-30 업데이트: TypeScript 오류 수정 및 v5.56.0 호환성 개선
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { ChartDataPoint } from '../../types/dashboard';
import PerformanceChart from './PerformanceChart';

// 📊 Mock 데이터 생성기 (ChartDataPoint 타입 호환)
const generatePerformanceData = (
  count: number,
  pattern: 'normal' | 'high' | 'mixed' | 'empty' = 'normal'
): ChartDataPoint[] => {
  if (pattern === 'empty') return [];

  const baseData: ChartDataPoint[] = [
    { name: '09:00', value: 45, color: '#8884d8' },
    { name: '09:01', value: 47, color: '#82ca9d' },
    { name: '09:02', value: 43, color: '#ffc658' },
    { name: '09:03', value: 51, color: '#ff7c7c' },
    { name: '09:04', value: 49, color: '#8dd1e1' },
    { name: '09:05', value: 46, color: '#d084d0' },
  ];

  if (pattern === 'high') {
    return baseData.map(item => ({
      ...item,
      value: Math.min(item.value + 30, 95),
    }));
  }

  if (pattern === 'mixed') {
    return baseData.map((item, index) => ({
      ...item,
      value:
        index % 2 === 0
          ? Math.min(item.value + 25, 90)
          : Math.max(item.value - 10, 15),
    }));
  }

  return baseData.slice(0, count);
};

const meta: Meta<typeof PerformanceChart> = {
  title: 'Charts/PerformanceChart',
  component: PerformanceChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '🔥 OpenManager Vibe v5.56.0 성능 차트 - 실시간 시스템 성능 사용률을 바 차트로 시각화하는 컴포넌트입니다. 2025-06-30 현재 완전 안정화된 상태로 프로덕션에서 사용 중입니다.',
      },
    },
  },
  tags: ['autodocs', 'test'],
  argTypes: {
    data: {
      control: { type: 'object' },
      description: '차트에 표시할 성능 데이터 배열 (ChartDataPoint[])',
    },
    title: {
      control: { type: 'text' },
      description: '차트 제목',
      defaultValue: '시스템 성능',
    },
    height: {
      control: { type: 'number', min: 200, max: 600 },
      description: '차트 높이 (픽셀)',
      defaultValue: 300,
    },
    showTitle: {
      control: { type: 'boolean' },
      description: '제목 표시 여부',
      defaultValue: true,
    },
    isLoading: {
      control: { type: 'boolean' },
      description: '로딩 상태',
      defaultValue: false,
    },
    isMobile: {
      control: { type: 'boolean' },
      description: '모바일 최적화 모드',
      defaultValue: false,
    },
    className: {
      control: { type: 'text' },
      description: '추가 CSS 클래스',
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-50 p-6 min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-800'>
              <strong>🚀 OpenManager Vibe v5.56.0</strong> | 현재 시간:{' '}
              {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}{' '}
              (KST) | 상태: 프로덕션 안정화 완료
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 📊 2025-06-30 현재 실제 성능 데이터 기반 스토리들
export const Default: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '시스템 성능 모니터링',
    height: 300,
    showTitle: true,
    isLoading: false,
    isMobile: false,
  },
};

export const HighUsage: Story = {
  args: {
    data: generatePerformanceData(6, 'high'),
    title: '⚠️ 높은 사용률 감지',
    height: 300,
    showTitle: true,
  },
};

export const MixedUsage: Story = {
  args: {
    data: generatePerformanceData(6, 'mixed'),
    title: '📊 혼합 사용률 패턴',
    height: 300,
    showTitle: true,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    title: '성능 차트 로딩 중...',
    isLoading: true,
    height: 300,
    showTitle: true,
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    title: '데이터 없음',
    isLoading: false,
    height: 300,
    showTitle: true,
  },
};

export const WithoutTitle: Story = {
  args: {
    data: generatePerformanceData(6),
    showTitle: false,
    height: 300,
  },
};

export const CustomHeight: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '📏 커스텀 높이 차트 (500px)',
    height: 500,
    showTitle: true,
  },
};

export const MobileOptimized: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '📱 모바일 최적화',
    height: 250,
    isMobile: true,
    showTitle: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const CustomStyling: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '🎨 커스텀 스타일링',
    height: 300,
    className: 'border-2 border-blue-200 shadow-lg',
    showTitle: true,
  },
};

export const SmallDataset: Story = {
  args: {
    data: generatePerformanceData(3),
    title: '📈 작은 데이터셋 (3개 포인트)',
    height: 300,
    showTitle: true,
  },
};
