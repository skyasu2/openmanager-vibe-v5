import type { Meta, StoryObj } from '@storybook/react';
import { vi } from 'vitest';
import AdminDashboardCharts from './AdminDashboardCharts';

// 커스텀 훅 목업 (SystemHealth)
const mockSystemHealthHook = {
  data: {
    performance: [
      { name: '08:00', value: 45, color: '#8884d8' },
      { name: '12:00', value: 78, color: '#82ca9d' },
      { name: '16:00', value: 89, color: '#ffc658' },
      { name: '20:00', value: 67, color: '#ff7c7c' },
    ],
    availability: [
      { name: '온라인', value: 48, color: '#82ca9d' },
      { name: '오프라인', value: 2, color: '#ff7c7c' },
    ],
    alerts: [
      { name: '높음', value: 3, color: '#ff7c7c' },
      { name: '보통', value: 8, color: '#ffc658' },
      { name: '낮음', value: 15, color: '#82ca9d' },
    ],
  },
  loading: false,
  error: null,
  lastUpdate: new Date(),
  autoRefresh: false,
  setAutoRefresh: () => {},
  refresh: () => {},
};

// SystemHealth 훅 목업
vi.mock('../hooks/useSystemHealth', () => ({
  useSystemHealth: () => mockSystemHealthHook,
}));

// Chart 컴포넌트들 목업
vi.mock('./charts/PerformanceChart', () => ({
  default: ({ title, data, isLoading }: any) => (
    <div
      data-testid='performance-chart'
      className='bg-white p-4 rounded-lg shadow'
    >
      <h3 className='font-semibold text-gray-900'>{title}</h3>
      {isLoading ? (
        <div className='animate-pulse bg-gray-200 h-32 rounded'></div>
      ) : (
        <div className='h-32 bg-blue-50 rounded flex items-center justify-center'>
          Performance Chart ({data?.length || 0} points)
        </div>
      )}
    </div>
  ),
}));

vi.mock('./charts/AvailabilityChart', () => ({
  default: ({ title, data, isLoading }: any) => (
    <div
      data-testid='availability-chart'
      className='bg-white p-4 rounded-lg shadow'
    >
      <h3 className='font-semibold text-gray-900'>{title}</h3>
      {isLoading ? (
        <div className='animate-pulse bg-gray-200 h-32 rounded'></div>
      ) : (
        <div className='h-32 bg-green-50 rounded flex items-center justify-center'>
          Availability Chart ({data?.length || 0} items)
        </div>
      )}
    </div>
  ),
}));

vi.mock('./charts/AlertsChart', () => ({
  default: ({ title, data, isLoading }: any) => (
    <div data-testid='alerts-chart' className='bg-white p-4 rounded-lg shadow'>
      <h3 className='font-semibold text-gray-900'>{title}</h3>
      {isLoading ? (
        <div className='animate-pulse bg-gray-200 h-32 rounded'></div>
      ) : (
        <div className='h-32 bg-red-50 rounded flex items-center justify-center'>
          Alerts Chart ({data?.length || 0} items)
        </div>
      )}
    </div>
  ),
}));

const meta: Meta<typeof AdminDashboardCharts> = {
  title: 'Dashboard/AdminDashboardCharts',
  component: AdminDashboardCharts,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '관리자 대시보드의 모든 차트를 포함하는 통합 컴포넌트입니다. 시스템 성능, 가용성, 알림 등을 종합적으로 모니터링할 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className='bg-gray-50 min-h-screen p-4'>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  beforeEach: () => {
    // 로딩 상태로 목업 변경
    mockSystemHealthHook.loading = true;
    mockSystemHealthHook.data = null as any;
  },
};

export const WithError: Story = {
  beforeEach: () => {
    // 오류 상태로 목업 변경
    mockSystemHealthHook.loading = false;
    mockSystemHealthHook.error =
      '데이터를 불러오는 중 오류가 발생했습니다.' as any;
    mockSystemHealthHook.data = null as any;
  },
};

export const HighAlertScenario: Story = {
  beforeEach: () => {
    // 높은 알림 상황
    mockSystemHealthHook.data = {
      ...mockSystemHealthHook.data,
      performance: [
        { name: '08:00', value: 85, color: '#ff7c7c' },
        { name: '12:00', value: 92, color: '#ff7c7c' },
        { name: '16:00', value: 89, color: '#ff7c7c' },
        { name: '20:00', value: 95, color: '#ff7c7c' },
      ],
      alerts: [
        { name: '높음', value: 15, color: '#ff7c7c' },
        { name: '보통', value: 8, color: '#ffc658' },
        { name: '낮음', value: 2, color: '#82ca9d' },
      ],
    };
  },
};

export const LowUsageScenario: Story = {
  beforeEach: () => {
    // 낮은 사용률 상황
    mockSystemHealthHook.data = {
      ...mockSystemHealthHook.data,
      performance: [
        { name: '08:00', value: 25, color: '#82ca9d' },
        { name: '12:00', value: 30, color: '#82ca9d' },
        { name: '16:00', value: 28, color: '#82ca9d' },
        { name: '20:00', value: 35, color: '#82ca9d' },
      ],
      alerts: [
        { name: '높음', value: 0, color: '#ff7c7c' },
        { name: '보통', value: 2, color: '#ffc658' },
        { name: '낮음', value: 18, color: '#82ca9d' },
      ],
    };
  },
};

export const AutoRefreshEnabled: Story = {
  beforeEach: () => {
    // 자동 새로고침 활성화
    mockSystemHealthHook.autoRefresh = true;
  },
};
