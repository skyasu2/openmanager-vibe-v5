import type { Meta, StoryObj } from '@storybook/react';
import RealtimeChart from './RealtimeChart';

const meta: Meta<typeof RealtimeChart> = {
  title: 'Charts/Realtime Chart',
  component: RealtimeChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🚀 Enhanced Real Server Data Generator 기반 실시간 차트 - 8개 서버 아키텍처, Redis 통합, 24시간 베이스라인, 5가지 데모 시나리오 지원',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    metrics: {
      control: 'check',
      options: [
        'cpu',
        'memory',
        'disk',
        'network',
        'responseTime',
        'activeConnections',
        'throughput',
        'errorRate',
      ],
      description: '표시할 메트릭 선택 (다중 선택 가능)',
    },
    serverId: {
      control: 'text',
      description: '서버 ID',
    },
    timeWindow: {
      control: { type: 'range', min: 5, max: 1440, step: 5 },
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

// Enhanced Mock WebSocket 설정
const setupEnhancedWebSocketMock = (scenario = 'normal') => {
  console.log(
    `🚀 Enhanced Real Server Data Generator 연결 시뮬레이션 - ${scenario} 시나리오`
  );
  console.log('📊 8개 서버 아키텍처 데이터 스트림 활성화');
  console.log('⚡ Redis 캐싱 시스템 연결');
  console.log('📈 24시간 베이스라인 데이터 로드');
};

/**
 * 기본 Enhanced 실시간 차트
 * Web Server 기본 메트릭 표시
 */
export const Default: Story = {
  args: {
    metrics: ['cpu', 'memory'],
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
    setupEnhancedWebSocketMock('normal');
  },
};

/**
 * 데이터베이스 서버 모니터링
 * 데이터베이스 특화 메트릭 표시
 */
export const DatabaseServer: Story = {
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
          '데이터베이스 서버 전용 메트릭 (CPU, 메모리, 디스크)을 모니터링합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('normal');
  },
};

/**
 * 트래픽 스파이크 시나리오
 * 급격한 트래픽 증가 상황 시뮬레이션
 */
export const TrafficSpike: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'load-balancer-01',
    timeWindow: 30,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 350,
    refreshInterval: 2000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '트래픽 스파이크 시나리오로 급격한 부하 증가 상황을 시뮬레이션합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('spike');
  },
};

/**
 * 메모리 누수 시나리오
 * 점진적 메모리 증가 패턴
 */
export const MemoryLeak: Story = {
  args: {
    metrics: ['memory', 'cpu'],
    serverId: 'api-server-01',
    timeWindow: 180,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 300,
    refreshInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '메모리 누수 시나리오로 점진적인 메모리 사용량 증가를 시뮬레이션합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('memory_leak');
  },
};

/**
 * DDoS 공격 시나리오
 * 비정상적인 네트워크 트래픽 패턴
 */
export const DDoSAttack: Story = {
  args: {
    metrics: ['cpu'],
    serverId: 'web-server-01',
    timeWindow: 60,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 300,
    refreshInterval: 2000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'DDoS 공격 시나리오로 비정상적인 네트워크 트래픽 패턴을 시뮬레이션합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('ddos');
  },
};

/**
 * 성능 저하 시나리오
 * 전반적인 시스템 성능 저하
 */
export const PerformanceDegradation: Story = {
  args: {
    metrics: ['cpu', 'memory', 'disk'],
    serverId: 'worker-01',
    timeWindow: 120,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 350,
    refreshInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '성능 저하 시나리오로 전반적인 시스템 성능 저하를 시뮬레이션합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('performance_degradation');
  },
};

/**
 * 24시간 베이스라인 모니터링
 * 장기간 트렌드 분석
 */
export const LongTermMonitoring: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'monitoring-01',
    timeWindow: 1440, // 24시간
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 400,
    refreshInterval: 10000,
  },
  parameters: {
    docs: {
      description: {
        story:
          '24시간 베이스라인 데이터를 활용한 장기간 트렌드 분석을 제공합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('normal');
  },
};

/**
 * 캐시 서버 최적화
 * 캐시 히트율 및 성능 모니터링
 */
export const CacheOptimization: Story = {
  args: {
    metrics: ['cpu', 'memory'],
    serverId: 'cache-server-01',
    timeWindow: 60,
    predictions: true,
    interactions: true,
    anomalies: true,
    autoScale: true,
    height: 300,
    refreshInterval: 3000,
  },
  parameters: {
    docs: {
      description: {
        story: '캐시 서버의 히트율과 성능을 실시간으로 모니터링합니다.',
      },
    },
  },
  play: async () => {
    setupEnhancedWebSocketMock('normal');
  },
};
