import type { Meta, StoryObj } from '@storybook/react';
import AvailabilityChart from './AvailabilityChart';

// 📊 Mock 데이터 생성기
const generateAvailabilityData = (
  scenario:
    | 'excellent'
    | 'good'
    | 'warning'
    | 'critical'
    | 'empty' = 'excellent'
) => {
  if (scenario === 'empty') return [];

  const scenarios = {
    excellent: [
      { name: '온라인', value: 48, color: '#82ca9d' },
      { name: '오프라인', value: 1, color: '#ff7c7c' },
      { name: '점검중', value: 1, color: '#ffc658' },
    ],
    good: [
      { name: '온라인', value: 38, color: '#82ca9d' },
      { name: '오프라인', value: 7, color: '#ff7c7c' },
      { name: '점검중', value: 5, color: '#ffc658' },
    ],
    warning: [
      { name: '온라인', value: 27, color: '#82ca9d' },
      { name: '오프라인', value: 15, color: '#ff7c7c' },
      { name: '점검중', value: 8, color: '#ffc658' },
    ],
    critical: [
      { name: '온라인', value: 15, color: '#82ca9d' },
      { name: '오프라인', value: 25, color: '#ff7c7c' },
      { name: '점검중', value: 10, color: '#ffc658' },
    ],
  };

  return scenarios[scenario];
};

const meta: Meta<typeof AvailabilityChart> = {
  title: 'Charts/AvailabilityChart',
  component: AvailabilityChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '서버 가용성을 도넛 차트로 시각화하는 컴포넌트입니다. SLA 목표 대비 현재 가용률을 모니터링할 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: { type: 'object' },
      description: '차트에 표시할 가용성 데이터 배열',
    },
    title: {
      control: { type: 'text' },
      description: '차트 제목',
      defaultValue: '서버 가용성',
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
    slaTarget: {
      control: { type: 'number', min: 90, max: 100, step: 0.1 },
      description: 'SLA 목표 비율 (%)',
      defaultValue: 99.9,
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
    data: generateAvailabilityData('excellent'),
    title: '서버 가용성',
    height: 300,
    showTitle: true,
    isLoading: false,
    slaTarget: 99.9,
    isMobile: false,
  },
};

export const ExcellentAvailability: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    title: '우수한 가용성 (99.9%+)',
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const GoodAvailability: Story = {
  args: {
    data: generateAvailabilityData('good'),
    title: '양호한 가용성 (95%+)',
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const WarningAvailability: Story = {
  args: {
    data: generateAvailabilityData('warning'),
    title: '주의 가용성 (90%+)',
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const CriticalAvailability: Story = {
  args: {
    data: generateAvailabilityData('critical'),
    title: '위험 가용성 (90% 미만)',
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    title: '가용성 차트 로딩',
    isLoading: true,
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    title: '데이터 없음',
    isLoading: false,
    height: 300,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const WithoutTitle: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    showTitle: false,
    height: 300,
    slaTarget: 99.9,
  },
};

export const CustomSLA: Story = {
  args: {
    data: generateAvailabilityData('good'),
    title: '커스텀 SLA 목표 (95%)',
    height: 300,
    showTitle: true,
    slaTarget: 95.0,
  },
};

export const MobileOptimized: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    title: '모바일 최적화',
    height: 250,
    isMobile: true,
    showTitle: true,
    slaTarget: 99.9,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const CustomHeight: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    title: '커스텀 높이 차트',
    height: 500,
    showTitle: true,
    slaTarget: 99.9,
  },
};

export const CustomStyling: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    title: '커스텀 스타일링',
    height: 300,
    className: 'border-2 border-green-200',
    showTitle: true,
    slaTarget: 99.9,
  },
};
