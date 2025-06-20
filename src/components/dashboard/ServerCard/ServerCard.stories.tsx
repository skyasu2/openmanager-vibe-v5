/**
 * 🖥️ 서버 카드 컴포넌트 스토리북 (v5.44.4)
 *
 * 새로운 모듈화된 서버 카드 시스템
 * 최신 업데이트: SOLID 원칙 적용, 컴포넌트 분리, 실시간 메트릭 연동
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import ServerCard from './ServerCard';
import type { Server } from '../../../types/server';

// 테스트용 서버 데이터
const mockServer: Server = {
  id: 'server-001',
  name: 'Web Server 01',
  hostname: 'web-01.example.com',
  ip: '192.168.1.100',
  status: 'online',
  type: 'web',
  location: 'Seoul DC',
  lastSeen: new Date().toISOString(),
  uptime: '30 days',
  cpu: 45.2,
  memory: 40,
  disk: 24,
  network: 65,
  alerts: 0,
  environment: 'production',
  lastUpdate: new Date(),
  services: [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'node', status: 'running', port: 3000 },
  ],
  metrics: {
    cpu: {
      usage: 45.2,
      cores: 8,
      temperature: 65,
    },
    memory: {
      used: 6.4,
      total: 16,
      usage: 40,
    },
    disk: {
      used: 120,
      total: 500,
      usage: 24,
    },
    network: {
      bytesIn: 1024,
      bytesOut: 2048,
      packetsIn: 500,
      packetsOut: 600,
    },
    timestamp: new Date().toISOString(),
    uptime: 2592000, // 30일
  },
};

const warningServer: Server = {
  ...mockServer,
  id: 'server-002',
  name: 'Database Server 02',
  hostname: 'db-02.example.com',
  status: 'warning',
  type: 'database',
  cpu: 85.7,
  memory: 88,
  alerts: 3,
  services: [
    { name: 'postgresql', status: 'running', port: 5432 },
    { name: 'redis', status: 'running', port: 6379 },
  ],
  metrics: {
    ...mockServer.metrics,
    cpu: {
      ...mockServer.metrics.cpu,
      usage: 85.7,
      temperature: 78,
    },
    memory: {
      ...mockServer.metrics.memory,
      usage: 88,
      used: 14.1,
    },
  },
};

const offlineServer: Server = {
  ...mockServer,
  id: 'server-003',
  name: 'API Server 03',
  hostname: 'api-03.example.com',
  status: 'offline',
  type: 'api',
  cpu: 0,
  memory: 0,
  alerts: 5,
  uptime: 'Offline',
  services: [
    { name: 'node', status: 'stopped', port: 8080 },
    { name: 'nginx', status: 'stopped', port: 80 },
  ],
  metrics: {
    ...mockServer.metrics,
    cpu: {
      ...mockServer.metrics.cpu,
      usage: 0,
      temperature: 0,
    },
    memory: {
      ...mockServer.metrics.memory,
      usage: 0,
      used: 0,
    },
    uptime: 0,
  },
};

const meta: Meta<typeof ServerCard> = {
  title: 'Dashboard/ServerCard',
  component: ServerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '🖥️ 서버 카드 컴포넌트 (v5.44.4)\n\n' +
          '✅ SOLID 원칙 적용한 모듈화 구조\n' +
          '✅ 실시간 메트릭 표시 (CPU, 메모리, 디스크, 네트워크)\n' +
          '✅ 서버 상태별 시각적 구분 (online/warning/offline)\n' +
          '✅ 반응형 디자인 및 애니메이션 효과\n' +
          '✅ 상세 정보 모달 연동\n' +
          '✅ 액션 버튼 (재시작, 종료, 상세보기)\n' +
          '✅ 서버 타입별 아이콘 표시\n' +
          '✅ 업타임 및 연결 수 표시\n' +
          '✅ 호버 효과 및 카드 상호작용',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    server: {
      control: 'object',
      description: '서버 데이터 객체',
    },
    onClick: {
      action: 'clicked',
      description: '카드 클릭 콜백',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: '카드 변형 스타일',
    },
    showActions: {
      control: 'boolean',
      description: '액션 버튼 표시 여부',
    },
    onAction: {
      action: 'action',
      description: '액션 버튼 클릭 콜백',
    },
  },
  decorators: [
    Story => (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='max-w-sm'>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🟢 온라인 서버 (정상 상태)
 */
export const OnlineServer: Story = {
  args: {
    server: mockServer,
    onClick: () => {},
    variant: 'default',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '정상 운영 중인 온라인 서버 카드입니다. CPU 45%, 메모리 40% 사용률로 안정적인 상태를 표시합니다.',
      },
    },
  },
};

/**
 * 🟡 경고 서버 (주의 상태)
 */
export const WarningServer: Story = {
  args: {
    server: warningServer,
    onClick: () => {},
    variant: 'default',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '높은 리소스 사용률로 경고 상태인 서버 카드입니다. CPU 85%, 메모리 88% 사용률로 주의가 필요한 상태를 표시합니다.',
      },
    },
  },
};

/**
 * 🔴 오프라인 서버 (장애 상태)
 */
export const OfflineServer: Story = {
  args: {
    server: offlineServer,
    onClick: () => {},
    variant: 'default',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '연결이 끊어진 오프라인 서버 카드입니다. 모든 메트릭이 0으로 표시되며 장애 상태를 나타냅니다.',
      },
    },
  },
};

/**
 * 📦 컴팩트 버전
 */
export const CompactCard: Story = {
  args: {
    server: mockServer,
    onClick: () => {},
    variant: 'compact',
    showActions: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '공간이 제한된 환경에서 사용하는 컴팩트 버전 카드입니다. 핵심 정보만 간결하게 표시합니다.',
      },
    },
  },
};

/**
 * 📋 상세 버전
 */
export const DetailedCard: Story = {
  args: {
    server: mockServer,
    onClick: () => {},
    variant: 'detailed',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '상세한 정보를 표시하는 확장 버전 카드입니다. 시스템 정보와 서비스 상태를 자세히 보여줍니다.',
      },
    },
  },
};

/**
 * 💾 데이터베이스 서버
 */
export const DatabaseServer: Story = {
  args: {
    server: {
      ...mockServer,
      name: 'PostgreSQL DB 01',
      type: 'database',
      cpu: 55,
      memory: 72,
      disk: 67,
      services: [
        { name: 'postgresql', status: 'running', port: 5432 },
        { name: 'pgbouncer', status: 'running', port: 6432 },
      ],
    },
    onClick: () => {},
    variant: 'default',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '데이터베이스 서버 전용 카드입니다. 높은 메모리 사용률과 많은 연결 수를 특징으로 합니다.',
      },
    },
  },
};

/**
 * 🌐 웹 서버
 */
export const WebServer: Story = {
  args: {
    server: {
      ...mockServer,
      name: 'Nginx Web 01',
      type: 'web',
      cpu: 32.1,
      memory: 28,
      network: 85,
      services: [
        { name: 'nginx', status: 'running', port: 80 },
        { name: 'certbot', status: 'running', port: 443 },
      ],
    },
    onClick: () => {},
    variant: 'default',
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '웹 서버 전용 카드입니다. 높은 네트워크 트래픽과 다중 연결을 처리하는 특징을 보여줍니다.',
      },
    },
  },
};
