import type { Meta, StoryObj } from '@storybook/react';
import ImprovedServerCard from '@/components/dashboard/ImprovedServerCard';
import { mockServers } from '@/mock/mockServerConfig';
import { generate24HourData } from '@/mock/mockScenarios';

// 목업 서버 데이터를 ImprovedServerCard용으로 변환
const createMockServerData = (mockServer: typeof mockServers[0], scenario: string = 'normal') => {
  const currentMetrics = generate24HourData(scenario)[0];
  
  return {
    id: mockServer.id,
    name: mockServer.hostname,
    status: mockServer.status,
    cpu: Math.round(currentMetrics.cpu),
    memory: Math.round(currentMetrics.memory),
    disk: Math.round(currentMetrics.disk),
    network: Math.round(currentMetrics.network),
    location: mockServer.location,
    uptime: '99.99%',
    ip: mockServer.ip,
    os: mockServer.os,
    alerts: mockServer.status === 'critical' ? 3 : 
            mockServer.status === 'warning' ? 1 : 0,
    lastUpdate: new Date(),
    services: [],
  };
};

const meta = {
  title: 'Dashboard/MockServerCard',
  component: ImprovedServerCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'detailed'],
    },
    showRealTimeUpdates: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof ImprovedServerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 웹 서버 (정상 상태)
export const WebServerNormal: Story = {
  args: {
    server: createMockServerData(mockServers[0], 'normal'),
    variant: 'compact',
    showRealTimeUpdates: true,
    index: 0,
  },
};

// 앱 서버 (경고 상태)
export const AppServerWarning: Story = {
  args: {
    server: createMockServerData(mockServers[2], 'cpu_spike'),
    variant: 'compact',
    showRealTimeUpdates: true,
    index: 1,
  },
};

// 데이터베이스 서버 (위험 상태)
export const DatabaseCritical: Story = {
  args: {
    server: createMockServerData(mockServers[4], 'memory_leak'),
    variant: 'compact',
    showRealTimeUpdates: true,
    index: 2,
  },
};

// 백업 서버 (디스크 가득참)
export const BackupServerDiskFull: Story = {
  args: {
    server: createMockServerData(mockServers[7], 'disk_full'),
    variant: 'compact',
    showRealTimeUpdates: true,
    index: 3,
  },
};

// 상세 보기 모드
export const DetailedView: Story = {
  args: {
    server: createMockServerData(mockServers[0], 'normal'),
    variant: 'detailed',
    showRealTimeUpdates: true,
    index: 0,
  },
};

// 애니메이션 없는 정적 카드
export const StaticCard: Story = {
  args: {
    server: createMockServerData(mockServers[1], 'normal'),
    variant: 'compact',
    showRealTimeUpdates: false,
    index: 0,
  },
};

// 모든 서버 타입 그리드
export const ServerGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      {mockServers.slice(0, 4).map((server, index) => (
        <ImprovedServerCard
          key={server.id}
          server={createMockServerData(
            server, 
            index === 1 ? 'cpu_spike' : 
            index === 2 ? 'memory_leak' : 'normal'
          )}
          variant="compact"
          showRealTimeUpdates={true}
          index={index}
        />
      ))}
    </div>
  ),
};