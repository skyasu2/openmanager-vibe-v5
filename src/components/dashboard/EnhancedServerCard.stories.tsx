import type { Meta, StoryObj } from '@storybook/react';
import EnhancedServerCard from './EnhancedServerCard';

const meta: Meta<typeof EnhancedServerCard> = {
  title: 'Dashboard/EnhancedServerCard',
  component: EnhancedServerCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'detailed'],
    },
    showMiniCharts: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockServer = {
  id: 'server-001',
  hostname: 'web-prod-01',
  name: 'Production Web Server',
  type: 'nginx',
  environment: 'production',
  location: 'Seoul, KR',
  provider: 'AWS',
  status: 'healthy' as const,
  cpu: 45,
  memory: 68,
  disk: 34,
  network: 25,
  uptime: '15d 3h 42m',
  lastUpdate: new Date(),
  alerts: 0,
  services: [
    { name: 'nginx', status: 'running' as const, port: 80 },
    { name: 'node', status: 'running' as const, port: 3000 },
    { name: 'redis', status: 'running' as const, port: 6379 },
  ],
  specs: {
    cpu_cores: 4,
    memory_gb: 16,
    disk_gb: 100,
    network_speed: '1Gbps',
  },
  os: 'Ubuntu 22.04',
  ip: '10.0.1.15',
  networkStatus: 'healthy' as const,
  health: {
    score: 95,
  },
  alertsSummary: {
    total: 0,
  },
};

export const Healthy: Story = {
  args: {
    server: mockServer,
    index: 0,
    showMiniCharts: true,
    variant: 'default',
  },
};

export const Warning: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-002',
      hostname: 'db-prod-01',
      name: 'Database Server',
      type: 'mysql',
      status: 'warning',
      cpu: 78,
      memory: 89,
      disk: 65,
      network: 45,
      alerts: 3,
      health: {
        score: 72,
      },
      alertsSummary: {
        total: 3,
      },
    },
    index: 1,
  },
};

export const Critical: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-003',
      hostname: 'api-prod-02',
      name: 'API Gateway',
      type: 'nginx',
      status: 'critical',
      cpu: 95,
      memory: 96,
      disk: 88,
      network: 89,
      alerts: 8,
      health: {
        score: 23,
      },
      alertsSummary: {
        total: 8,
      },
    },
    index: 2,
  },
};

export const Offline: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-004',
      hostname: 'cache-prod-01',
      name: 'Redis Cache',
      type: 'redis',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 34,
      network: 0,
      alerts: 1,
      uptime: '0d 0h 0m',
      health: {
        score: 0,
      },
      alertsSummary: {
        total: 1,
      },
    },
    index: 3,
  },
};

export const Maintenance: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-005',
      hostname: 'backup-prod-01',
      name: 'Backup Server',
      type: 'backup',
      status: 'maintenance',
      cpu: 15,
      memory: 25,
      disk: 78,
      network: 5,
      alerts: 0,
      health: {
        score: 85,
      },
      alertsSummary: {
        total: 0,
      },
    },
    index: 4,
  },
};

export const CompactVariant: Story = {
  args: {
    server: mockServer,
    index: 0,
    variant: 'compact',
    showMiniCharts: false,
  },
};

export const DetailedVariant: Story = {
  args: {
    server: mockServer,
    index: 0,
    variant: 'detailed',
    showMiniCharts: true,
  },
};

export const WithoutMiniCharts: Story = {
  args: {
    server: mockServer,
    index: 0,
    showMiniCharts: false,
  },
};

export const DatabaseServer: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-db-001',
      hostname: 'postgres-prod-01',
      name: 'PostgreSQL Database',
      type: 'postgresql',
      cpu: 52,
      memory: 75,
      disk: 82,
      network: 18,
      services: [
        { name: 'postgresql', status: 'running' as const, port: 5432 },
        { name: 'pgbouncer', status: 'running' as const, port: 6432 },
      ],
      specs: {
        cpu_cores: 8,
        memory_gb: 32,
        disk_gb: 500,
        network_speed: '10Gbps',
      },
    },
    index: 0,
  },
};

export const KubernetesNode: Story = {
  args: {
    server: {
      ...mockServer,
      id: 'server-k8s-001',
      hostname: 'k8s-node-01',
      name: 'Kubernetes Worker Node',
      type: 'kubernetes',
      cpu: 67,
      memory: 58,
      disk: 45,
      network: 72,
      services: [
        { name: 'kubelet', status: 'running' as const, port: 10250 },
        { name: 'containerd', status: 'running' as const, port: 0 },
        { name: 'kube-proxy', status: 'running' as const, port: 10256 },
      ],
      specs: {
        cpu_cores: 16,
        memory_gb: 64,
        disk_gb: 200,
        network_speed: '25Gbps',
      },
    },
    index: 0,
  },
};
