import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NetworkMonitoringCard } from '../components/dashboard/NetworkMonitoringCard';

const meta: Meta<typeof NetworkMonitoringCard> = {
  title: '대시보드/네트워크 모니터링',
  component: NetworkMonitoringCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## 🌐 네트워크 모니터링 카드

실시간 네트워크 상태를 모니터링하는 카드 컴포넌트입니다.

### ✨ 주요 기능
- 📊 **실시간 차트**: 대역폭, 지연시간, 다운로드/업로드 속도 시각화
- 🎯 **성능 최적화**: 갱신 주기 2초 → 10초로 최적화 (80% 부하 감소)
- 🎨 **반응형 디자인**: 다양한 화면 크기 지원
- 🚥 **상태 표시**: 네트워크 상태에 따른 색상 코딩

### 🔧 갱신 주기 최적화
- **이전**: 2초마다 갱신 (높은 CPU 사용률)
- **현재**: 10초마다 갱신 (안정적이고 효율적)
        `,
      },
    },
  },
  argTypes: {
    serverName: {
      control: 'text',
      description: '서버 이름',
    },
    metrics: {
      control: 'object',
      description: '네트워크 메트릭 데이터',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkMonitoringCard>;

// 기본 네트워크 메트릭
const baseMetrics = {
  bandwidth: 45.2,
  latency: 23,
  packetLoss: 0.1,
  uptime: 99.9,
  downloadSpeed: 125.7,
  uploadSpeed: 67.3,
  connections: 342,
  status: 'excellent' as const,
};

export const 정상상태: Story = {
  args: {
    serverName: 'Web-Server-01',
    metrics: baseMetrics,
  },
};

export const 네트워크경고: Story = {
  args: {
    serverName: 'API-Server-02',
    metrics: {
      ...baseMetrics,
      bandwidth: 85.6,
      latency: 156,
      packetLoss: 2.3,
      uptime: 97.2,
      downloadSpeed: 45.2,
      uploadSpeed: 23.1,
      connections: 567,
      status: 'good' as const,
    },
  },
};

export const 네트워크문제: Story = {
  args: {
    serverName: 'DB-Server-03',
    metrics: {
      ...baseMetrics,
      bandwidth: 92.1,
      latency: 342,
      packetLoss: 5.7,
      uptime: 89.4,
      downloadSpeed: 12.3,
      uploadSpeed: 8.7,
      connections: 23,
      status: 'poor' as const,
    },
  },
};

export const 네트워크오프라인: Story = {
  args: {
    serverName: 'Cache-Server-04',
    metrics: {
      ...baseMetrics,
      bandwidth: 0,
      latency: 0,
      packetLoss: 100,
      uptime: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      connections: 0,
      status: 'offline' as const,
    },
  },
};

export const 다중네트워크비교: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <NetworkMonitoringCard
        serverName="Web-Server-01"
        metrics={baseMetrics}
      />
      <NetworkMonitoringCard
        serverName="API-Server-02"
        metrics={{
          ...baseMetrics,
          bandwidth: 85.6,
          latency: 156,
          status: 'good' as const,
        }}
      />
      <NetworkMonitoringCard
        serverName="DB-Server-03"
        metrics={{
          ...baseMetrics,
          bandwidth: 92.1,
          latency: 342,
          status: 'poor' as const,
        }}
      />
      <NetworkMonitoringCard
        serverName="Cache-Server-04"
        metrics={{
          ...baseMetrics,
          bandwidth: 0,
          latency: 0,
          status: 'offline' as const,
        }}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

// 실시간 시뮬레이션 컴포넌트
const RealtimeNetworkDemo: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = React.useState(baseMetrics);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetrics(prev => ({
        ...prev,
        bandwidth: Math.max(0, Math.min(100, prev.bandwidth + (Math.random() - 0.5) * 20)),
        latency: Math.max(0, Math.min(500, prev.latency + (Math.random() - 0.5) * 30)),
        downloadSpeed: Math.max(0, Math.min(1000, prev.downloadSpeed + (Math.random() - 0.5) * 40)),
        uploadSpeed: Math.max(0, Math.min(1000, prev.uploadSpeed + (Math.random() - 0.5) * 20)),
        connections: Math.max(0, Math.min(1000, prev.connections + Math.floor((Math.random() - 0.5) * 50))),
      }));
    }, 10000); // 🎯 10초 갱신 주기

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          🔄 실시간 네트워크 모니터링 (10초 갱신 주기)
        </h3>
        <p className="text-sm text-gray-600">
          이 시뮬레이션은 10초마다 네트워크 메트릭이 갱신되는 것을 보여줍니다.
          이전 2초 갱신에 비해 80% 성능 향상을 달성했습니다.
        </p>
      </div>
      <NetworkMonitoringCard
        serverName="Real-Time-Server"
        metrics={currentMetrics}
      />
    </div>
  );
};

export const 실시간시뮬레이션: Story = {
  render: () => <RealtimeNetworkDemo />,
  parameters: {
    layout: 'fullscreen',
  },
}; 