import type { Meta, StoryObj } from '@storybook/react';

import ImprovedServerCard from '../components/dashboard/ImprovedServerCard';

const meta: Meta<typeof ImprovedServerCard> = {
  title: 'Dashboard/ImprovedServerCard',
  component: ImprovedServerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### ImprovedServerCard v3.0

완전히 개선된 서버 카드 컴포넌트:

- ✅ 향상된 가독성 (메트릭 크기 증가, 색상 개선)
- ✅ 최적화된 정보 밀도 (중요 정보 우선 표시)
- ✅ 강화된 인터랙션 (실시간 피드백, 애니메이션)
- ✅ 접근성 개선 (명확한 상태 표시, 키보드 내비게이션)
- ✅ 완전한 반응형 디자인

#### 주요 특징:
- **3가지 배리언트**: compact, standard, detailed
- **실시간 메트릭 업데이트**: 5초 간격
- **상태별 테마**: 정상/경고/오프라인별 시각적 구분
- **성능 최적화**: React.memo, useCallback 적용
- **완전한 접근성**: ARIA 속성, 키보드 내비게이션

#### 사용법:
\`\`\`tsx
<ImprovedServerCard
  server={serverData}
  onClick={handleServerClick}
  variant="standard"
  showRealTimeUpdates={true}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'standard', 'detailed'],
      description: '카드 표시 모드',
    },
    showRealTimeUpdates: {
      control: 'boolean',
      description: '실시간 메트릭 업데이트 활성화',
    },
    onClick: {
      action: 'clicked',
      description: '카드 클릭 시 호출되는 함수',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 📊 기본 서버 데이터
const mockServer = {
  id: 'server-001',
  name: 'Web Server 01',
  status: 'online' as const,
  cpu: 45,
  memory: 67,
  disk: 23,
  network: 89,
  location: 'Seoul DC1',
  uptime: '15d 4h 23m',
  ip: '192.168.1.100',
  os: 'Ubuntu 22.04 LTS',
  alerts: 2,
  lastUpdate: new Date(),
  services: [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'mysql', status: 'running', port: 3306 },
    { name: 'redis', status: 'running', port: 6379 },
  ],
};

// 🎯 기본 스토리
export const Default: Story = {
  args: {
    server: mockServer,
    variant: 'standard',
    showRealTimeUpdates: true,
    onClick: () => console.log('Server card clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: '기본 서버 카드 모양. 표준 크기와 모든 기본 정보를 표시합니다.',
      },
    },
  },
};

// 📦 Compact 모드
export const Compact: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: '축약된 서버 카드. 공간이 제한된 환경에서 사용합니다.',
      },
    },
  },
};

// 📖 Detailed 모드
export const Detailed: Story = {
  args: {
    ...Default.args,
    variant: 'detailed',
  },
  parameters: {
    docs: {
      description: {
        story: '상세한 서버 카드. 더 많은 정보와 큰 크기로 표시됩니다.',
      },
    },
  },
};

// ⚠️ 경고 상태
export const WarningState: Story = {
  args: {
    ...Default.args,
    server: {
      ...mockServer,
      status: 'warning' as const,
      cpu: 85,
      memory: 92,
      alerts: 5,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '경고 상태의 서버 카드. 높은 리소스 사용률과 알림을 표시합니다.',
      },
    },
  },
};

// 🔴 오프라인 상태
export const OfflineState: Story = {
  args: {
    ...Default.args,
    server: {
      ...mockServer,
      status: 'offline' as const,
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      alerts: 10,
    },
  },
  parameters: {
    docs: {
      description: {
        story: '오프라인 상태의 서버 카드. 연결되지 않은 서버를 표시합니다.',
      },
    },
  },
};

// 🚀 고성능 서버
export const HighPerformance: Story = {
  args: {
    ...Default.args,
    server: {
      ...mockServer,
      name: 'GPU Server 01',
      cpu: 95,
      memory: 89,
      disk: 67,
      network: 156,
      location: 'Tokyo DC2',
      alerts: 0,
      services: [
        { name: 'tensorflow', status: 'running', port: 8080 },
        { name: 'jupyter', status: 'running', port: 8888 },
        { name: 'mongodb', status: 'running', port: 27017 },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '고성능 서버 카드. GPU 서버처럼 높은 사용률을 보이는 서버입니다.',
      },
    },
  },
};

// 💾 데이터베이스 서버
export const DatabaseServer: Story = {
  args: {
    ...Default.args,
    server: {
      ...mockServer,
      name: 'DB Master 01',
      cpu: 34,
      memory: 78,
      disk: 91,
      network: 67,
      location: 'Busan DC3',
      alerts: 1,
      services: [
        { name: 'postgresql', status: 'running', port: 5432 },
        { name: 'pgbouncer', status: 'running', port: 6432 },
        { name: 'prometheus', status: 'running', port: 9090 },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '데이터베이스 서버 카드. 높은 디스크 사용률을 보이는 DB 서버입니다.',
      },
    },
  },
};

// 🌐 로드밸런서
export const LoadBalancer: Story = {
  args: {
    ...Default.args,
    server: {
      ...mockServer,
      name: 'LB Frontend 01',
      cpu: 23,
      memory: 45,
      disk: 12,
      network: 234,
      location: 'Seoul DC1',
      alerts: 0,
      services: [
        { name: 'haproxy', status: 'running', port: 80 },
        { name: 'keepalived', status: 'running', port: 112 },
        { name: 'rsyslog', status: 'running', port: 514 },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: '로드밸런서 서버 카드. 높은 네트워크 사용률을 보입니다.',
      },
    },
  },
};

// 🔧 실시간 업데이트 비활성화
export const StaticCard: Story = {
  args: {
    ...Default.args,
    showRealTimeUpdates: false,
  },
  parameters: {
    docs: {
      description: {
        story: '정적 서버 카드. 실시간 업데이트가 비활성화된 상태입니다.',
      },
    },
  },
};

// 📱 모바일 뷰
export const MobileView: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 환경에서의 서버 카드 표시. 축약된 정보로 최적화됩니다.',
      },
    },
  },
};

// 🎨 다양한 상태 그리드
export const StatusGrid: Story = {
  render: () => (
    <div className='grid grid-cols-2 gap-4 p-4'>
      <ImprovedServerCard
        server={{ ...mockServer, status: 'online' as const }}
        onClick={() => {}}
        variant='compact'
      />
      <ImprovedServerCard
        server={{
          ...mockServer,
          status: 'warning' as const,
          cpu: 85,
          alerts: 3,
        }}
        onClick={() => {}}
        variant='compact'
      />
      <ImprovedServerCard
        server={{
          ...mockServer,
          status: 'offline' as const,
          cpu: 0,
          memory: 0,
          alerts: 8,
        }}
        onClick={() => {}}
        variant='compact'
      />
      <ImprovedServerCard
        server={{
          ...mockServer,
          name: 'Maintenance',
          status: 'offline' as const,
          alerts: 0,
        }}
        onClick={() => {}}
        variant='compact'
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '다양한 서버 상태를 한번에 보여주는 그리드 레이아웃입니다.',
      },
    },
  },
};
