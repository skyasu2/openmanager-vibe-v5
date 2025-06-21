import type { Server } from '@/types/server';
import type { Meta, StoryObj } from '@storybook/nextjs';
import ServerCard from './ServerCard';

const meta: Meta<typeof ServerCard> = {
  title: 'Dashboard/ServerCard',
  component: ServerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '개별 서버 정보를 표시하는 카드 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockServer: Server = {
  id: 'server-001',
  name: 'Web Server 01',
  hostname: 'web01.example.com',
  type: 'web',
  status: 'online',
  cpu: 45,
  memory: 67,
  disk: 34,
  network: 23,
  uptime: '15d 8h 23m',
  location: 'Seoul, KR',
  alerts: 0,
  services: [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'nodejs', status: 'running', port: 3000 },
  ],
  lastUpdate: new Date(),
};

export const Default: Story = {
  name: '기본 상태',
  args: {
    server: mockServer,
    onClick: server => console.log('서버 클릭:', server.name),
  },
};

export const WarningStatus: Story = {
  name: '경고 상태',
  args: {
    server: {
      ...mockServer,
      id: 'server-002',
      name: 'Database Server',
      status: 'warning',
      cpu: 85,
      memory: 90,
      alerts: 2,
    },
    onClick: server => console.log('서버 클릭:', server.name),
  },
};

export const CriticalStatus: Story = {
  name: '심각한 상태',
  args: {
    server: {
      ...mockServer,
      id: 'server-003',
      name: 'API Server',
      status: 'critical',
      cpu: 95,
      memory: 98,
      disk: 89,
      alerts: 5,
    },
    onClick: server => console.log('서버 클릭:', server.name),
  },
};

export const OfflineStatus: Story = {
  name: '오프라인 상태',
  args: {
    server: {
      ...mockServer,
      id: 'server-004',
      name: 'Backup Server',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 45,
      network: 0,
      uptime: '0h 0m',
      alerts: 1,
    },
    onClick: server => console.log('서버 클릭:', server.name),
  },
};

export const HealthyStatus: Story = {
  name: '건강한 상태',
  args: {
    server: {
      ...mockServer,
      id: 'server-005',
      name: 'Load Balancer',
      status: 'healthy',
      cpu: 25,
      memory: 35,
      disk: 15,
      network: 45,
      alerts: 0,
    },
    onClick: server => console.log('서버 클릭:', server.name),
  },
};

export const MultipleCards: Story = {
  name: '여러 서버 카드',
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      <ServerCard server={mockServer} onClick={() => {}} />
      <ServerCard
        server={{
          ...mockServer,
          id: 'server-02',
          name: '데이터베이스-01',
          status: 'warning',
          cpu: 85,
          memory: 90,
        }}
        onClick={() => {}}
      />
      <ServerCard
        server={{
          ...mockServer,
          id: 'server-03',
          name: 'API서버-01',
          status: 'critical',
          cpu: 95,
          memory: 98,
        }}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
