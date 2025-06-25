/**
 * 🌟 Enhanced Server Card Stories
 *
 * 개선된 서버 카드 컴포넌트의 다양한 상태와 변형을 보여주는 스토리북
 */

import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import EnhancedServerCard from '../components/dashboard/EnhancedServerCard';

const meta: Meta<typeof EnhancedServerCard> = {
  title: 'Dashboard/EnhancedServerCard',
  component: EnhancedServerCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '개선된 서버 카드 컴포넌트 v5.0 - 모던한 디자인과 부드러운 애니메이션',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'detailed'],
      description: '카드 크기 변형',
    },
    showMiniCharts: {
      control: { type: 'boolean' },
      description: '미니 차트 표시 여부',
    },
    index: {
      control: { type: 'number' },
      description: '애니메이션 지연을 위한 인덱스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 서버 데이터
const baseServer = {
  id: 'server-001',
  hostname: 'web-server-001.example.com',
  name: 'Web Server 001',
  type: 'nginx',
  environment: 'production',
  location: 'Seoul, KR',
  provider: 'AWS',
  cpu: 45,
  memory: 62,
  disk: 38,
  network: 25,
  uptime: '15d 8h 32m',
  lastUpdate: new Date(),
  alerts: 0,
  services: [
    { name: 'nginx', status: 'running' as const, port: 80 },
    { name: 'ssl', status: 'running' as const, port: 443 },
    { name: 'monitoring', status: 'running' as const, port: 9090 },
  ],
  specs: {
    cpu_cores: 4,
    memory_gb: 16,
    disk_gb: 500,
    network_speed: '1 Gbps',
  },
  os: 'Ubuntu 22.04 LTS',
  ip: '10.0.1.15',
  networkStatus: 'healthy' as const,
  health: {
    score: 92,
  },
  alertsSummary: {
    total: 0,
  },
};

// 기본 스토리
export const Default: Story = {
  args: {
    server: {
      ...baseServer,
      status: 'healthy',
    },
    index: 0,
    onClick: action('card-clicked'),
    showMiniCharts: true,
    variant: 'default',
  },
};

// 상태별 스토리들
export const HealthyServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      status: 'healthy',
      cpu: 35,
      memory: 45,
      disk: 28,
      network: 15,
      health: { score: 95 },
      alertsSummary: { total: 0 },
    },
  },
};

export const WarningServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'Database Server 002',
      type: 'mysql',
      status: 'warning',
      cpu: 78,
      memory: 85,
      disk: 92,
      network: 45,
      health: { score: 72 },
      alertsSummary: { total: 3 },
      alerts: 3,
      networkStatus: 'warning',
    },
  },
};

export const CriticalServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'API Server 003',
      type: 'nodejs',
      status: 'critical',
      cpu: 95,
      memory: 97,
      disk: 88,
      network: 78,
      health: { score: 28 },
      alertsSummary: { total: 8 },
      alerts: 8,
      networkStatus: 'critical',
      services: [
        { name: 'node', status: 'stopped' as const, port: 3000 },
        { name: 'redis', status: 'running' as const, port: 6379 },
        { name: 'monitoring', status: 'stopped' as const, port: 9090 },
      ],
    },
  },
};

export const MaintenanceServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'Cache Server 004',
      type: 'redis',
      status: 'maintenance',
      cpu: 12,
      memory: 25,
      disk: 15,
      network: 8,
      health: { score: 100 },
      alertsSummary: { total: 0 },
      networkStatus: 'maintenance',
      services: [
        { name: 'redis', status: 'stopped' as const, port: 6379 },
        { name: 'monitoring', status: 'running' as const, port: 9090 },
      ],
    },
  },
};

export const OfflineServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'Backup Server 005',
      type: 'storage',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      health: { score: 0 },
      alertsSummary: { total: 1 },
      alerts: 1,
      networkStatus: 'offline',
      services: [
        { name: 'backup', status: 'stopped' as const, port: 22 },
        { name: 'monitoring', status: 'stopped' as const, port: 9090 },
      ],
    },
  },
};

// 변형별 스토리들
export const CompactVariant: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
    server: {
      ...baseServer,
      name: 'Compact Server',
      status: 'healthy',
    },
  },
};

export const DetailedVariant: Story = {
  args: {
    ...Default.args,
    variant: 'detailed',
    server: {
      ...baseServer,
      name: 'Detailed Server',
      status: 'healthy',
      specs: {
        ...baseServer.specs,
        cpu_cores: 8,
        memory_gb: 32,
        disk_gb: 1000,
        network_speed: '10 Gbps',
      },
    },
  },
};

// 특수 상황 스토리들
export const HighResourceUsage: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'High Load Server',
      status: 'warning',
      cpu: 92,
      memory: 89,
      disk: 95,
      network: 87,
      health: { score: 45 },
      alertsSummary: { total: 5 },
      alerts: 5,
    },
  },
};

export const NoMiniCharts: Story = {
  args: {
    ...Default.args,
    showMiniCharts: false,
    server: {
      ...baseServer,
      name: 'Simple Server View',
      status: 'healthy',
    },
  },
};

export const DatabaseServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'PostgreSQL Primary',
      type: 'postgresql',
      status: 'healthy',
      cpu: 52,
      memory: 78,
      disk: 65,
      network: 35,
      services: [
        { name: 'postgresql', status: 'running' as const, port: 5432 },
        { name: 'pgbouncer', status: 'running' as const, port: 6432 },
        { name: 'monitoring', status: 'running' as const, port: 9187 },
        { name: 'backup', status: 'running' as const, port: 8080 },
      ],
    },
  },
};

export const ContainerServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...baseServer,
      name: 'Kubernetes Node',
      type: 'container',
      status: 'healthy',
      cpu: 68,
      memory: 72,
      disk: 45,
      network: 55,
      services: [
        { name: 'kubelet', status: 'running' as const, port: 10250 },
        { name: 'docker', status: 'running' as const, port: 2376 },
        { name: 'calico', status: 'running' as const, port: 179 },
        { name: 'monitoring', status: 'running' as const, port: 9100 },
        { name: 'logging', status: 'running' as const, port: 24224 },
      ],
    },
  },
};

// 그리드 레이아웃 예시
export const GridLayout: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
      <EnhancedServerCard
        server={{ ...baseServer, name: 'Server 1', status: 'healthy' }}
        index={0}
        onClick={action('server-1-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Server 2',
          status: 'warning',
          cpu: 85,
          memory: 78,
        }}
        index={1}
        onClick={action('server-2-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Server 3',
          status: 'critical',
          cpu: 95,
          memory: 92,
        }}
        index={2}
        onClick={action('server-3-clicked')}
      />
      <EnhancedServerCard
        server={{ ...baseServer, name: 'Server 4', status: 'maintenance' }}
        index={3}
        onClick={action('server-4-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Server 5',
          status: 'offline',
          cpu: 0,
          memory: 0,
        }}
        index={4}
        onClick={action('server-5-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Server 6',
          status: 'healthy',
          variant: 'compact',
        }}
        index={5}
        onClick={action('server-6-clicked')}
        variant='compact'
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '실제 대시보드에서 사용되는 그리드 레이아웃 예시',
      },
    },
  },
};

// 다양한 서버 타입들
export const ServerTypes: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4'>
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Web Server',
          type: 'nginx',
          status: 'healthy',
        }}
        index={0}
        onClick={action('nginx-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'API Server',
          type: 'nodejs',
          status: 'healthy',
        }}
        index={1}
        onClick={action('nodejs-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Database',
          type: 'mysql',
          status: 'healthy',
        }}
        index={2}
        onClick={action('mysql-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Cache',
          type: 'redis',
          status: 'healthy',
        }}
        index={3}
        onClick={action('redis-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Search',
          type: 'elasticsearch',
          status: 'healthy',
        }}
        index={4}
        onClick={action('elasticsearch-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Queue',
          type: 'rabbitmq',
          status: 'healthy',
        }}
        index={5}
        onClick={action('rabbitmq-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'CI/CD',
          type: 'jenkins',
          status: 'healthy',
        }}
        index={6}
        onClick={action('jenkins-clicked')}
      />
      <EnhancedServerCard
        server={{
          ...baseServer,
          name: 'Monitoring',
          type: 'prometheus',
          status: 'healthy',
        }}
        index={7}
        onClick={action('prometheus-clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '다양한 서버 타입별 아이콘과 스타일링',
      },
    },
  },
};
