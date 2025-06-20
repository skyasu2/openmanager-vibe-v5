import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import AdminDashboardCharts from './AdminDashboardCharts';

const meta: Meta<typeof AdminDashboardCharts> = {
  title: 'Components/AdminDashboardCharts',
  component: AdminDashboardCharts,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '시스템 헬스 메트릭을 시각적으로 표시하는 관리자 대시보드 차트 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-50 p-4'>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 모의 API 응답을 위한 fetch mock (Storybook 호환)
const createMockFetch = (responseData: any, shouldFail = false) => {
  return () => {
    (global as any).fetch = () =>
      shouldFail
        ? Promise.reject(new Error('API 오류'))
        : Promise.resolve({
            ok: true,
            json: () => Promise.resolve(responseData),
          } as Response);
  };
};

// 모의 건강한 시스템 데이터
const healthySystemData = {
  success: true,
  timestamp: new Date().toISOString(),
  summary: {
    overallStatus: 'healthy' as const,
    healthScore: 95,
    serverCount: 12,
    criticalIssues: 0,
    warnings: 1,
    dataSource: 'api' as const,
  },
  metrics: {
    current: {
      avgCpuUsage: 45,
      avgMemoryUsage: 62,
      avgDiskUsage: 78,
      avgResponseTime: 120,
      totalAlerts: 3,
      serverStatusDistribution: {
        running: 10,
        warning: 2,
        error: 0,
      },
      providerDistribution: {
        AWS: 6,
        GCP: 4,
        Azure: 2,
      },
      healthScore: 95,
    },
    trends: {
      cpuUsage: {
        trend: 'stable' as const,
        changeRate: 2.1,
        volatility: 0.15,
      },
      memoryUsage: {
        trend: 'increasing' as const,
        changeRate: 5.3,
        volatility: 0.22,
      },
    },
    movingAverages: {
      cpuUsage: 43.2,
      memoryUsage: 58.7,
    },
    predictions: {
      cpuUsage: { nextValue: 47, confidence: 0.85 },
      memoryUsage: { nextValue: 65, confidence: 0.78 },
    },
  },
  anomalies: [
    {
      id: 'anom_001',
      type: 'performance' as const,
      severity: 'medium' as const,
      description: '서버 3번의 응답 시간이 평균보다 높습니다',
      recommendation: 'CPU 사용량을 확인하고 프로세스를 최적화하세요',
      detectedAt: new Date().toISOString(),
    },
  ],
  recommendations: [
    '메모리 사용량이 증가 추세입니다. 모니터링을 강화하세요.',
    '전체적으로 시스템이 안정적입니다.',
  ],
  charts: {
    performanceChart: {
      labels: ['CPU', 'Memory', 'Disk', 'Network'],
      datasets: [
        {
          label: '사용률',
          data: [45, 62, 78, 34],
          status: 'good',
          trend: 'stable',
        },
      ],
    },
    availabilityChart: {
      rate: 99.5,
      status: 'excellent',
      online: 12,
      total: 12,
    },
    alertsChart: {
      total: 3,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 2,
        low: 1,
      },
      trend: 'decreasing',
    },
    trendsChart: {
      timePoints: ['00:00', '06:00', '12:00', '18:00', '24:00'],
      metrics: {
        cpuUsage: [42, 38, 45, 52, 45],
        memoryUsage: [58, 60, 62, 65, 62],
        responseTime: [100, 95, 120, 110, 120],
      },
    },
  },
};

// 경고 상태 시스템 데이터
const warningSystemData = {
  ...healthySystemData,
  summary: {
    ...healthySystemData.summary,
    overallStatus: 'warning' as const,
    healthScore: 75,
    criticalIssues: 0,
    warnings: 5,
  },
  metrics: {
    ...healthySystemData.metrics,
    current: {
      ...healthySystemData.metrics.current,
      avgCpuUsage: 85,
      avgMemoryUsage: 88,
      totalAlerts: 8,
    },
  },
  charts: {
    ...healthySystemData.charts,
    performanceChart: {
      ...healthySystemData.charts.performanceChart,
      datasets: [
        {
          label: '사용률',
          data: [85, 88, 78, 67],
          status: 'warning',
          trend: 'increasing',
        },
      ],
    },
    alertsChart: {
      total: 8,
      bySeverity: {
        critical: 0,
        high: 2,
        medium: 4,
        low: 2,
      },
      trend: 'increasing',
    },
  },
};

// 위험 상태 시스템 데이터
const criticalSystemData = {
  ...healthySystemData,
  summary: {
    ...healthySystemData.summary,
    overallStatus: 'critical' as const,
    healthScore: 35,
    criticalIssues: 3,
    warnings: 8,
  },
  metrics: {
    ...healthySystemData.metrics,
    current: {
      ...healthySystemData.metrics.current,
      avgCpuUsage: 95,
      avgMemoryUsage: 98,
      totalAlerts: 15,
      serverStatusDistribution: {
        running: 6,
        warning: 4,
        error: 2,
      },
    },
  },
  charts: {
    ...healthySystemData.charts,
    performanceChart: {
      ...healthySystemData.charts.performanceChart,
      datasets: [
        {
          label: '사용률',
          data: [95, 98, 89, 78],
          status: 'critical',
          trend: 'increasing',
        },
      ],
    },
    availabilityChart: {
      rate: 83.3,
      status: 'critical',
      online: 10,
      total: 12,
    },
    alertsChart: {
      total: 15,
      bySeverity: {
        critical: 3,
        high: 5,
        medium: 4,
        low: 3,
      },
      trend: 'increasing',
    },
  },
};

export const HealthySystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '정상 상태의 시스템 메트릭을 보여줍니다.',
      },
    },
  },
  decorators: [
    Story => {
      createMockFetch(healthySystemData)();
      return <Story />;
    },
  ],
};

export const WarningSystem: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '경고 상태의 시스템 메트릭을 보여줍니다. 리소스 사용량이 높은 상태입니다.',
      },
    },
  },
  decorators: [
    Story => {
      createMockFetch(warningSystemData)();
      return <Story />;
    },
  ],
};

export const CriticalSystem: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '위험 상태의 시스템 메트릭을 보여줍니다. 즉시 조치가 필요한 상태입니다.',
      },
    },
  },
  decorators: [
    Story => {
      createMockFetch(criticalSystemData)();
      return <Story />;
    },
  ],
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: '데이터 로딩 중인 상태를 보여줍니다.',
      },
    },
  },
  decorators: [
    Story => {
      // 긴 지연시간으로 로딩 상태 시뮬레이션
      (global as any).fetch = () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(healthySystemData),
            } as Response);
          }, 10000);
        });
      return <Story />;
    },
  ],
};

export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'API 오류가 발생했을 때의 상태를 보여줍니다.',
      },
    },
  },
  decorators: [
    Story => {
      createMockFetch(null, true)();
      return <Story />;
    },
  ],
};
