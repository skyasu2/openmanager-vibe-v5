import type { Meta, StoryObj } from '@storybook/react';
import { SystemControlPanel } from './SystemControlPanel';

const meta: Meta<typeof SystemControlPanel> = {
  title: 'System/SystemControlPanel',
  component: SystemControlPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '통합 시스템 제어 패널 - 프로세스 시작/중지/재시작, 실시간 모니터링, 30분 안정성 추적',
      },
    },
  },
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-100 p-8'>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SystemControlPanel>;

// Mock API responses
const mockSystemStatus = {
  healthy: {
    isRunning: true,
    health: 'healthy' as const,
    processes: [
      {
        id: 'web-server',
        status: 'running' as const,
        healthScore: 95,
        restartCount: 0,
        uptime: 1800, // 30분
        lastHealthCheck: new Date(),
        errorCount: 0,
      },
      {
        id: 'database',
        status: 'running' as const,
        healthScore: 98,
        restartCount: 1,
        uptime: 3600, // 1시간
        lastHealthCheck: new Date(),
        errorCount: 0,
      },
      {
        id: 'ai-engine',
        status: 'running' as const,
        healthScore: 92,
        restartCount: 0,
        uptime: 2400, // 40분
        lastHealthCheck: new Date(),
        errorCount: 0,
      },
    ],
    metrics: {
      totalProcesses: 3,
      runningProcesses: 3,
      healthyProcesses: 3,
      systemUptime: 1800,
      memoryUsage: 65.4,
      averageHealthScore: 95,
      totalRestarts: 1,
    },
    startTime: new Date(Date.now() - 1800000), // 30분 전
  },
  degraded: {
    isRunning: true,
    health: 'degraded' as const,
    processes: [
      {
        id: 'web-server',
        status: 'running' as const,
        healthScore: 78,
        restartCount: 2,
        uptime: 600, // 10분
        lastHealthCheck: new Date(),
        errorCount: 3,
      },
      {
        id: 'database',
        status: 'error' as const,
        healthScore: 45,
        restartCount: 5,
        uptime: 120, // 2분
        lastHealthCheck: new Date(),
        errorCount: 12,
      },
      {
        id: 'ai-engine',
        status: 'restarting' as const,
        healthScore: 60,
        restartCount: 3,
        uptime: 30, // 30초
        lastHealthCheck: new Date(),
        errorCount: 8,
      },
    ],
    metrics: {
      totalProcesses: 3,
      runningProcesses: 2,
      healthyProcesses: 1,
      systemUptime: 600,
      memoryUsage: 85.2,
      averageHealthScore: 61,
      totalRestarts: 10,
    },
    startTime: new Date(Date.now() - 600000), // 10분 전
  },
  stopped: {
    isRunning: false,
    health: 'critical' as const,
    processes: [
      {
        id: 'web-server',
        status: 'stopped' as const,
        healthScore: 0,
        restartCount: 0,
        uptime: 0,
        errorCount: 0,
      },
      {
        id: 'database',
        status: 'stopped' as const,
        healthScore: 0,
        restartCount: 0,
        uptime: 0,
        errorCount: 0,
      },
      {
        id: 'ai-engine',
        status: 'stopped' as const,
        healthScore: 0,
        restartCount: 0,
        uptime: 0,
        errorCount: 0,
      },
    ],
    metrics: {
      totalProcesses: 3,
      runningProcesses: 0,
      healthyProcesses: 0,
      systemUptime: 0,
      memoryUsage: 15.3,
      averageHealthScore: 0,
      totalRestarts: 0,
    },
  },
};

// API Mock 설정
const setupApiMock = (status: keyof typeof mockSystemStatus) => {
  const originalFetch = global.fetch;
  global.fetch = ((url: string, options?: any) => {
    if (url.includes('/api/system/unified')) {
      if (options?.method === 'POST') {
        // 시스템 제어 액션
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: `${body.action} 작업이 성공적으로 완료되었습니다.`,
            }),
        });
      } else {
        // 상태 조회
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: mockSystemStatus[status],
            }),
        });
      }
    }
    return Promise.reject(new Error('Unknown API'));
  }) as typeof fetch;
};

/**
 * 기본 시스템 제어 패널
 * 정상 작동 중인 시스템 상태
 */
export const Default: Story = {
  play: async () => {
    setupApiMock('healthy');
  },
};

/**
 * 시스템 정상 상태
 * 모든 프로세스가 정상 작동 중
 */
export const HealthySystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 프로세스가 정상 작동하는 건강한 시스템 상태를 보여줍니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('healthy');
  },
};

/**
 * 시스템 경고 상태
 * 일부 프로세스에 문제가 있는 상태
 */
export const DegradedSystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '일부 프로세스에 문제가 있어 성능이 저하된 시스템 상태입니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('degraded');
  },
};

/**
 * 시스템 중지 상태
 * 모든 프로세스가 중지된 상태
 */
export const StoppedSystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 프로세스가 중지된 시스템 상태를 보여줍니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('stopped');
  },
};

/**
 * 시스템 시작 중
 * 프로세스들이 시작되는 과정
 */
export const StartingSystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '시스템이 시작되는 과정을 시뮬레이션합니다.',
      },
    },
  },
  play: async () => {
    // 시작 중 상태를 위한 특별한 mock
    global.fetch = ((url: string) => {
      if (url.includes('/api/system/unified')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                ...mockSystemStatus.healthy,
                processes: mockSystemStatus.healthy.processes.map(p => ({
                  ...p,
                  status: 'starting',
                  healthScore: Math.floor(Math.random() * 50) + 30,
                })),
              },
            }),
        });
      }
      return Promise.reject(new Error('Unknown API'));
    }) as typeof fetch;
  },
};

/**
 * 프로세스 상세 정보 확장
 * 프로세스별 상세 모니터링 정보
 */
export const ExpandedProcessInfo: Story = {
  parameters: {
    docs: {
      description: {
        story: '프로세스별 상세 정보가 확장된 상태의 제어 패널입니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('healthy');
    // 확장 상태를 시뮬레이션하기 위해 클릭 이벤트 트리거
    setTimeout(() => {
      const toggleButton = document.querySelector('[aria-label*="확장"]');
      if (toggleButton) {
        (toggleButton as HTMLElement).click();
      }
    }, 1000);
  },
};

/**
 * 30분 안정성 카운트다운
 * 시스템 시작 후 안정성 모니터링 기간
 */
export const StabilityCountdown: Story = {
  parameters: {
    docs: {
      description: {
        story: '시스템 시작 후 30분 안정성 모니터링 카운트다운을 보여줍니다.',
      },
    },
  },
  play: async () => {
    // 5분 전에 시작된 시스템으로 mock
    global.fetch = ((url: string) => {
      if (url.includes('/api/system/unified')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                ...mockSystemStatus.healthy,
                startTime: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
              },
            }),
        });
      }
      return Promise.reject(new Error('Unknown API'));
    }) as typeof fetch;
  },
};

/**
 * 시스템 알림 및 경고
 * 다양한 알림 메시지가 있는 상태
 */
export const WithAlerts: Story = {
  parameters: {
    docs: {
      description: {
        story: '시스템 작업 후 생성되는 다양한 알림 메시지들을 보여줍니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('degraded');
    // 알림을 시뮬레이션하기 위해 버튼 클릭
    setTimeout(() => {
      const restartButton = document.querySelector('[aria-label*="재시작"]');
      if (restartButton) {
        (restartButton as HTMLElement).click();
      }
    }, 1500);
  },
};

/**
 * 모바일 반응형 디자인
 * 작은 화면에서의 제어 패널
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 기기에서의 시스템 제어 패널 표시를 확인합니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('healthy');
  },
};

/**
 * 다크 모드
 * 어두운 테마에서의 제어 패널
 */
export const DarkMode: Story = {
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-900 p-8 dark'>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '다크 모드에서의 시스템 제어 패널 모습입니다.',
      },
    },
  },
  play: async () => {
    setupApiMock('healthy');
  },
};
