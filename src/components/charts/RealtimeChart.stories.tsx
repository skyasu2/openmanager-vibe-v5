import type { Meta, StoryObj } from '@storybook/react';
import RealtimeChart from './RealtimeChart';

const meta: Meta<typeof RealtimeChart> = {
  title: 'Charts/RealtimeChart',
  component: RealtimeChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '실시간 서버 메트릭 차트 - Chart.js 기반 60fps 차트, WebSocket 실시간 데이터, 예측 라인, 이상 감지',
      },
    },
  },
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-900 p-8'>
        <div className='bg-gray-800 rounded-lg p-6'>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    metrics: {
      control: 'check',
      options: ['cpu', 'memory', 'disk', 'network'],
      description: '표시할 메트릭 유형들',
    },
    serverId: {
      control: 'text',
      description: '모니터링할 서버 ID',
    },
    timeWindow: {
      control: { type: 'range', min: 5, max: 180, step: 5 },
      description: '표시할 시간 범위 (분)',
    },
    predictions: {
      control: 'boolean',
      description: 'AI 예측 라인 표시',
    },
    interactions: {
      control: 'boolean',
      description: '차트 인터랙션 활성화',
    },
    anomalies: {
      control: 'boolean',
      description: '이상 감지 마커 표시',
    },
    autoScale: {
      control: 'boolean',
      description: '자동 Y축 스케일링',
    },
    height: {
      control: { type: 'range', min: 200, max: 600, step: 50 },
      description: '차트 높이 (픽셀)',
    },
    refreshInterval: {
      control: { type: 'range', min: 1000, max: 30000, step: 1000 },
      description: '데이터 갱신 간격 (밀리초)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RealtimeChart>;

// Mock WebSocket 설정
const setupWebSocketMock = () => {
  // WebSocket mock은 컴포넌트 내부에서 처리됨
  console.log('🔗 WebSocket 연결 시뮬레이션');
};

/**
 * 기본 실시간 차트
 * CPU 메트릭 단일 표시
 */
export const Default: Story = {
  args: {
    metrics: ['cpu'],
    serverId: 'web-server-01',
    timeWindow: 60,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 300,
    refreshInterval: 5000,
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 다중 메트릭 모니터링
 * CPU, 메모리, 디스크 동시 표시
 */
export const MultipleMetrics: Story = {
  args: {
    metrics: ['cpu', 'memory', 'disk'],
    serverId: 'database-01',
    timeWindow: 120,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 400,
    refreshInterval: 3000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CPU, 메모리, 디스크 사용률을 동시에 모니터링하는 다중 메트릭 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 네트워크 트래픽 모니터링
 * 네트워크 메트릭 전용 표시
 */
export const NetworkTraffic: Story = {
  args: {
    metrics: ['network'],
    serverId: 'load-balancer',
    timeWindow: 30,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: false,
    height: 350,
    refreshInterval: 2000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '네트워크 트래픽 전용 모니터링 차트로 실시간 대역폭 사용량을 추적합니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 예측 기능 비활성화
 * 기본 메트릭만 표시
 */
export const WithoutPredictions: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'app-server',
    timeWindow: 60,
    predictions: false,
    interactions: true,
    anomalies: false,
    autoScale: true,
    height: 300,
    refreshInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story: 'AI 예측 기능과 이상 감지를 비활성화한 기본 메트릭 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 인터랙션 비활성화
 * 정적 차트 표시
 */
export const StaticChart: Story = {
  args: {
    metrics: ['cpu'],
    serverId: 'monitoring-display',
    timeWindow: 180,
    predictions: true,
    interactions: false,
    anomalies: true,
    autoScale: true,
    height: 250,
    refreshInterval: 10000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '마우스 인터랙션이 비활성화된 정적 모니터링 디스플레이용 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 고해상도 모니터링
 * 빠른 갱신 주기의 정밀 모니터링
 */
export const HighResolution: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'critical-server',
    timeWindow: 15,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 400,
    refreshInterval: 1000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '1초 간격의 고해상도 실시간 모니터링으로 중요 서버의 상태를 정밀 추적합니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 장기간 추세 분석
 * 3시간 시간 윈도우의 추세 차트
 */
export const LongTermTrend: Story = {
  args: {
    metrics: ['cpu', 'memory', 'disk'],
    serverId: 'production-server',
    timeWindow: 180,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 450,
    refreshInterval: 15000,
  },
  parameters: {
    docs: {
      description: {
        story: '3시간 시간 윈도우로 장기간 성능 추세를 분석하는 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 컴팩트 뷰
 * 작은 공간에 최적화된 차트
 */
export const CompactView: Story = {
  args: {
    metrics: ['cpu'],
    serverId: 'edge-server',
    timeWindow: 30,
    predictions: false,
    interactions: false,
    anomalies: false,
    autoScale: true,
    height: 200,
    refreshInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '대시보드 위젯이나 사이드바에 적합한 컴팩트한 크기의 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 모든 메트릭 종합 모니터링
 * 전체 시스템 상태 한눈에 보기
 */
export const CompleteMonitoring: Story = {
  args: {
    metrics: ['cpu', 'memory', 'disk', 'network'],
    serverId: 'main-server',
    timeWindow: 60,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 500,
    refreshInterval: 3000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CPU, 메모리, 디스크, 네트워크 모든 메트릭을 종합적으로 모니터링하는 차트입니다.',
      },
    },
  },
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 모바일 최적화
 * 작은 화면에 최적화된 레이아웃
 */
export const MobileOptimized: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'mobile-app-server',
    timeWindow: 30,
    predictions: true,
    interactions: false,
    anomalies: true,
    autoScale: true,
    height: 250,
    refreshInterval: 5000,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 기기에서 최적화된 실시간 차트 표시입니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-900 p-4'>
        <div className='bg-gray-800 rounded-lg p-4'>
          <Story />
        </div>
      </div>
    ),
  ],
  play: async () => {
    setupWebSocketMock();
  },
};

/**
 * 어드민 대시보드 뷰
 * 관리자용 상세 모니터링
 */
export const AdminDashboard: Story = {
  args: {
    metrics: ['cpu', 'memory', 'disk', 'network'],
    serverId: 'admin-monitoring',
    timeWindow: 120,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: false,
    height: 600,
    refreshInterval: 2000,
  },
  parameters: {
    docs: {
      description: {
        story: '관리자용 상세 모니터링 대시보드에 최적화된 고급 차트입니다.',
      },
    },
  },
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-900 p-8'>
        <div className='bg-gray-800 rounded-lg p-8 shadow-2xl'>
          <h2 className='text-white text-2xl font-bold mb-6'>
            🔧 관리자 모니터링 대시보드
          </h2>
          <Story />
        </div>
      </div>
    ),
  ],
  play: async () => {
    setupWebSocketMock();
  },
};
