import type { Meta, StoryObj } from '@storybook/react';
import type { ChartDataPoint } from '../../types/dashboard';
import PerformanceChart from './PerformanceChart';

// 📊 Mock 데이터 생성기
const generatePerformanceData = (
  count: number,
  pattern: 'normal' | 'high' | 'mixed' | 'empty' = 'normal'
): ChartDataPoint[] => {
  if (pattern === 'empty') return [];

  const baseData = [
    { name: '00:00', value: 45, color: '#8884d8' },
    { name: '04:00', value: 32, color: '#82ca9d' },
    { name: '08:00', value: 78, color: '#ffc658' },
    { name: '12:00', value: 89, color: '#ff7c7c' },
    { name: '16:00', value: 95, color: '#8dd1e1' },
    { name: '20:00', value: 67, color: '#d084d0' },
  ];

  if (pattern === 'high') {
    return baseData.map(item => ({
      ...item,
      value: Math.min(item.value + 20, 100),
    }));
  }

  if (pattern === 'mixed') {
    return baseData.map((item, index) => ({
      ...item,
      value:
        index % 2 === 0
          ? Math.min(item.value + 30, 100)
          : Math.max(item.value - 20, 0),
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
          '시스템 성능 사용률을 바 차트로 시각화하는 컴포넌트입니다. 실시간 성능 모니터링에 사용됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: { type: 'object' },
      description: '차트에 표시할 성능 데이터 배열',
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
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '시스템 성능',
    height: 300,
    showTitle: true,
    isLoading: false,
    isMobile: false,
  },
};

export const HighUsage: Story = {
  args: {
    data: generatePerformanceData(6, 'high'),
    title: '높은 사용률 상황',
    height: 300,
    showTitle: true,
  },
};

export const MixedUsage: Story = {
  args: {
    data: generatePerformanceData(6, 'mixed'),
    title: '혼합 사용률 패턴',
    height: 300,
    showTitle: true,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    title: '성능 차트 로딩',
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
    title: '커스텀 높이 차트',
    height: 500,
    showTitle: true,
  },
};

export const MobileOptimized: Story = {
  args: {
    data: generatePerformanceData(6),
    title: '모바일 최적화',
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
    title: '커스텀 스타일링',
    height: 300,
    className: 'border-2 border-blue-200',
    showTitle: true,
  },
};

export const SmallDataset: Story = {
  args: {
    data: generatePerformanceData(3),
    title: '작은 데이터셋',
    height: 300,
    showTitle: true,
  },
};
