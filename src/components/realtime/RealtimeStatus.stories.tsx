import type { Meta, StoryObj } from '@storybook/react';
import RealtimeStatus from './RealtimeStatus';

const meta: Meta<typeof RealtimeStatus> = {
  title: 'Realtime/RealtimeStatus',
  component: RealtimeStatus,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '실시간 WebSocket 연결 상태 표시 컴포넌트 - 서버 모니터링, AI 예측, 연결 상태 시각화',
      },
    },
  },
  argTypes: {
    compact: {
      control: 'boolean',
      description: '컴팩트 모드로 표시',
    },
    showDetails: {
      control: 'boolean',
      description: '상세 정보 표시 여부',
    },
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RealtimeStatus>;

// Mock useRealtimeData hook
const mockUseRealtimeData = (overrideValues: any = {}) => {
  const defaultValues = {
    servers: { isConnected: true },
    predictions: { isConnected: true },
    overallStatus: 'connected',
    reconnectAll: () => console.log('재연결 실행'),
    isFullyConnected: true,
    ...overrideValues,
  };

  // Mock implementation for Storybook
  console.log('🔗 실시간 데이터 mock 설정:', defaultValues);
};

/**
 * 기본 실시간 상태 표시
 * 모든 연결이 정상인 상태
 */
export const Default: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 연결됨 상태
 * 서버와 AI 예측 모두 정상 연결
 */
export const Connected: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버 모니터링과 AI 예측 시스템이 모두 정상적으로 연결된 상태입니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 연결 중 상태
 * 시스템이 재연결을 시도하는 중
 */
export const Connecting: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '실시간 연결을 설정하거나 재연결을 시도하는 중인 상태입니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: false },
      predictions: { isConnected: false },
      overallStatus: 'connecting',
      isFullyConnected: false,
    });
  },
};

/**
 * 연결 끊김 상태
 * 네트워크 문제로 연결이 끊어진 상태
 */
export const Disconnected: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '네트워크 문제나 서버 오류로 실시간 연결이 끊어진 상태입니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: false },
      predictions: { isConnected: false },
      overallStatus: 'disconnected',
      isFullyConnected: false,
    });
  },
};

/**
 * 부분 연결 상태
 * 서버는 연결되었지만 AI 예측은 끊어진 상태
 */
export const PartiallyConnected: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버 모니터링은 연결되었지만 AI 예측 시스템은 연결되지 않은 상태입니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: false },
      overallStatus: 'disconnected',
      isFullyConnected: false,
    });
  },
};

/**
 * 컴팩트 모드
 * 작은 공간에 최적화된 상태 표시
 */
export const CompactMode: Story = {
  args: {
    compact: true,
    showDetails: false,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '헤더나 사이드바에 적합한 컴팩트한 크기의 상태 표시입니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 컴팩트 모드 - 연결 끊김
 * 작은 공간에서 연결 문제 표시
 */
export const CompactDisconnected: Story = {
  args: {
    compact: true,
    showDetails: false,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '컴팩트 모드에서 연결이 끊어진 상태를 보여줍니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: false },
      predictions: { isConnected: false },
      overallStatus: 'disconnected',
      isFullyConnected: false,
    });
  },
};

/**
 * 상세 정보 숨김
 * 기본 정보만 표시
 */
export const WithoutDetails: Story = {
  args: {
    compact: false,
    showDetails: false,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '연결 상태의 상세 정보를 숨기고 기본 상태만 표시합니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 재연결 버튼 표시
 * 연결 문제 시 재연결 옵션 제공
 */
export const WithReconnectButton: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '연결이 끊어진 후 일정 시간이 지나면 나타나는 재연결 버튼을 보여줍니다.',
      },
    },
  },
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: false },
      predictions: { isConnected: false },
      overallStatus: 'disconnected',
      isFullyConnected: false,
    });

    // 재연결 버튼 표시를 위해 시간 지연 시뮬레이션
    setTimeout(() => {
      const component = document.querySelector(
        '[data-testid="realtime-status"]'
      );
      if (component) {
        component.setAttribute('data-show-reconnect', 'true');
      }
    }, 2000);
  },
};

/**
 * 대시보드 위젯 스타일
 * 대시보드에 통합되는 스타일
 */
export const DashboardWidget: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: 'shadow-lg',
  },
  parameters: {
    docs: {
      description: {
        story: '대시보드 위젯으로 사용할 때의 스타일을 보여줍니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-100 p-8'>
        <div className='max-w-md'>
          <Story />
        </div>
      </div>
    ),
  ],
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 사이드바 컴팩트 버전
 * 사이드바에 적합한 레이아웃
 */
export const SidebarCompact: Story = {
  args: {
    compact: true,
    showDetails: false,
    className: 'w-full justify-start',
  },
  parameters: {
    docs: {
      description: {
        story: '사이드바나 네비게이션 바에 적합한 컴팩트 레이아웃입니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-900 text-white p-4 w-64'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>시스템 상태</h3>
          <Story />
        </div>
      </div>
    ),
  ],
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 모바일 최적화
 * 작은 화면에 최적화된 표시
 */
export const MobileOptimized: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 기기에서 최적화된 실시간 상태 표시입니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='p-4'>
        <Story />
      </div>
    ),
  ],
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 다크 테마
 * 어두운 배경에 최적화된 스타일
 */
export const DarkTheme: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '다크 테마 환경에서의 실시간 상태 표시입니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-900 p-8 min-h-screen'>
        <div className='max-w-md'>
          <Story />
        </div>
      </div>
    ),
  ],
  play: async () => {
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });
  },
};

/**
 * 애니메이션 데모
 * 연결 상태 변화 애니메이션
 */
export const AnimationDemo: Story = {
  args: {
    compact: false,
    showDetails: true,
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: '연결 상태가 변화할 때의 애니메이션 효과를 보여줍니다.',
      },
    },
  },
  play: async () => {
    // 초기 연결 상태
    mockUseRealtimeData({
      servers: { isConnected: true },
      predictions: { isConnected: true },
      overallStatus: 'connected',
      isFullyConnected: true,
    });

    // 2초 후 연결 끊김 시뮬레이션
    setTimeout(() => {
      mockUseRealtimeData({
        servers: { isConnected: false },
        predictions: { isConnected: false },
        overallStatus: 'disconnected',
        isFullyConnected: false,
      });
    }, 2000);

    // 5초 후 재연결 시뮬레이션
    setTimeout(() => {
      mockUseRealtimeData({
        servers: { isConnected: true },
        predictions: { isConnected: true },
        overallStatus: 'connected',
        isFullyConnected: true,
      });
    }, 5000);
  },
};
