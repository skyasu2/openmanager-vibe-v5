/**
 * 📚 ServerCard v2.0 Storybook Stories
 * 
 * 완전한 ServerCard 컴포넌트 문서화
 * - 15개 스토리로 모든 시나리오 커버
 * - 3가지 variant 완전 테스트
 * - 실제 사용 예시 및 가이드
 */

import type { Meta, StoryObj } from '@storybook/react';
import ServerCard from '../components/dashboard/ServerCard';
import { Server } from '../types/server';

const meta: Meta<typeof ServerCard> = {
  title: 'Dashboard/ServerCard v2.0',
  component: ServerCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**🎯 ServerCard Component v2.0**

모듈화된 서버 카드 컴포넌트로 4개의 하위 컴포넌트로 구성:
- **ServerIcon**: 서버 타입별 아이콘 및 상태 표시
- **MetricsDisplay**: CPU, Memory, Disk 메트릭 시각화
- **StatusBadge**: 상태 뱃지 및 부가 정보
- **ActionButtons**: 상태별 액션 버튼

### 🚀 주요 기능
- **3가지 Variant**: default, compact, detailed
- **React.memo 최적화**: 불필요한 리렌더링 방지
- **100% 호환성**: 기존 Props 완전 지원
- **액세서빌리티**: 스크린 리더 및 키보드 지원

### 💡 사용법
\`\`\`tsx
// 기본 사용법
<ServerCard server={server} onClick={handleClick} />

// Variant 사용법
<ServerCard server={server} onClick={handleClick} variant="detailed" />

// 액션 핸들러
<ServerCard 
  server={server} 
  onClick={handleClick}
  onAction={(action, server) => console.log(action, server)}
/>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 서버 데이터
const createMockServer = (overrides: Partial<Server> = {}): Server => ({
  id: 'server-01',
  name: 'Web Server 01',
  status: 'online',
  cpu: 45,
  memory: 62,
  disk: 34,
  uptime: '15 days',
  location: 'Seoul DC1',
  alerts: 0,
  ip: '192.168.1.100',
  os: 'Ubuntu 20.04',
  lastUpdate: new Date(),
  services: [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'nodejs', status: 'running', port: 3000 },
    { name: 'redis', status: 'running', port: 6379 }
  ],
  ...overrides
});

// 📖 1. 기본 스토리들
export const Default: Story = {
  args: {
    server: createMockServer(),
    onClick: (server: Server) => console.log('클릭:', server.name),
    variant: 'default'
  }
};

export const Compact: Story = {
  args: {
    server: createMockServer(),
    onClick: (server: Server) => console.log('클릭:', server.name),
    variant: 'compact'
  },
  parameters: {
    docs: {
      description: {
        story: '**Compact 모드**: 공간을 절약하는 압축된 레이아웃. 리스트 뷰나 좁은 공간에 적합.'
      }
    }
  }
};

export const Detailed: Story = {
  args: {
    server: createMockServer(),
    onClick: (server: Server) => console.log('클릭:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**Detailed 모드**: 모든 정보를 상세히 표시하는 확장된 레이아웃. 대시보드 메인 뷰에 적합.'
      }
    }
  }
};

// 📖 2. 상태별 스토리들
export const OnlineServer: Story = {
  args: {
    server: createMockServer({
      name: 'Production Web Server',
      status: 'online',
      cpu: 35,
      memory: 55,
      disk: 28
    }),
    onClick: (server: Server) => console.log('온라인 서버:', server.name)
  },
  parameters: {
    docs: {
      description: {
        story: '**정상 상태**: 모든 메트릭이 양호한 서버. 녹색 상태 아이콘과 정상 애니메이션.'
      }
    }
  }
};

export const OfflineServer: Story = {
  args: {
    server: createMockServer({
      name: 'Backup Server',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: '0 days',
      alerts: 1
    }),
    onClick: (server: Server) => console.log('오프라인 서버:', server.name)
  },
  parameters: {
    docs: {
      description: {
        story: '**오프라인 상태**: 연결이 끊어진 서버. 빨간색 상태와 시작 액션 버튼 표시.'
      }
    }
  }
};

export const WarningServer: Story = {
  args: {
    server: createMockServer({
      name: 'Database Server',
      status: 'warning',
      cpu: 78,
      memory: 85,
      disk: 65,
      alerts: 2,
      services: [
        { name: 'mysql', status: 'running', port: 3306 },
        { name: 'backup', status: 'stopped', port: 0 }
      ]
    }),
    onClick: (server: Server) => console.log('경고 서버:', server.name)
  },
  parameters: {
    docs: {
      description: {
        story: '**경고 상태**: 주의가 필요한 서버. 노란색 상태와 진단 액션 버튼 표시.'
      }
    }
  }
};

// 📖 3. 메트릭 상태별 스토리들
export const HighCPUUsage: Story = {
  args: {
    server: createMockServer({
      name: 'High CPU Server',
      cpu: 92,
      memory: 45,
      disk: 30,
      alerts: 1
    }),
    onClick: (server: Server) => console.log('High CPU:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**CPU 높은 사용률**: CPU 90%+ 서버. 빨간색 프로그레스바와 경고 아이콘.'
      }
    }
  }
};

export const HighMemoryUsage: Story = {
  args: {
    server: createMockServer({
      name: 'Memory Heavy Server',
      cpu: 55,
      memory: 87,
      disk: 40,
      alerts: 1
    }),
    onClick: (server: Server) => console.log('High Memory:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**메모리 높은 사용률**: Memory 85%+ 서버. 파란색-빨간색 프로그레스바.'
      }
    }
  }
};

export const LowDiskSpace: Story = {
  args: {
    server: createMockServer({
      name: 'Storage Server',
      cpu: 25,
      memory: 40,
      disk: 96,
      alerts: 2,
      location: 'Seoul DC2'
    }),
    onClick: (server: Server) => console.log('Low Disk:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**디스크 부족**: Disk 95%+ 서버. 보라색-빨간색 프로그레스바와 즉시 조치 필요.'
      }
    }
  }
};

export const CriticalStatus: Story = {
  args: {
    server: createMockServer({
      name: 'Critical Server',
      status: 'warning',
      cpu: 95,
      memory: 90,
      disk: 98,
      alerts: 5,
      services: [
        { name: 'app', status: 'stopped', port: 0 },
        { name: 'monitoring', status: 'stopped', port: 0 }
      ]
    }),
    onClick: (server: Server) => console.log('Critical:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**위험 상태**: 모든 메트릭이 위험 수준인 서버. 즉시 조치가 필요한 상태.'
      }
    }
  }
};

export const OptimalPerformance: Story = {
  args: {
    server: createMockServer({
      name: 'Optimized Server',
      cpu: 15,
      memory: 25,
      disk: 12,
      uptime: '365 days',
      alerts: 0,
      location: 'AWS us-east-1'
    }),
    onClick: (server: Server) => console.log('Optimal:', server.name),
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**최적 성능**: 모든 메트릭이 양호한 이상적인 서버 상태.'
      }
    }
  }
};

// 📖 4. 특수 상태 스토리들
export const LoadingState: Story = {
  args: {
    server: createMockServer({
      name: 'Loading...',
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 'Loading...',
      location: '연결 중...'
    }),
    onClick: (server: Server) => console.log('Loading:', server.name)
  },
  parameters: {
    docs: {
      description: {
        story: '**로딩 상태**: 데이터를 불러오는 중인 서버 카드 상태.'
      }
    }
  }
};

export const NoData: Story = {
  args: {
    server: createMockServer({
      name: 'Unknown Server',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 'Unknown',
      location: 'Unknown',
      services: []
    }),
    onClick: (server: Server) => console.log('No Data:', server.name)
  },
  parameters: {
    docs: {
      description: {
        story: '**데이터 없음**: 정보를 알 수 없는 서버 상태.'
      }
    }
  }
};

export const MobileView: Story = {
  args: {
    server: createMockServer(),
    onClick: (server: Server) => console.log('Mobile:', server.name),
    variant: 'compact'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: '**모바일 뷰**: 모바일 화면에 최적화된 ServerCard 레이아웃.'
      }
    }
  }
};

// 📖 5. 액션 테스트 스토리
export const WithActions: Story = {
  args: {
    server: createMockServer({
      name: 'Action Test Server'
    }),
    onClick: (server: Server) => console.log('카드 클릭:', server.name),
    onAction: (action: string, server: Server) => {
      console.log(`액션 실행: ${action} on ${server.name}`);
      alert(`액션: ${action}\n서버: ${server.name}`);
    },
    showActions: true,
    variant: 'detailed'
  },
  parameters: {
    docs: {
      description: {
        story: '**액션 버튼 테스트**: 모든 액션 버튼의 동작을 확인할 수 있는 스토리. 버튼 클릭 시 알림 표시.'
      }
    }
  }
};

// 📖 6. 환경별 서버 스토리
export const AWSServer: Story = {
  args: {
    server: createMockServer({
      name: 'AWS Production',
      location: 'AWS us-east-1',
      uptime: '180 days'
    }),
    onClick: (server: Server) => console.log('AWS:', server.name),
    variant: 'detailed'
  }
};

export const AzureServer: Story = {
  args: {
    server: createMockServer({
      name: 'Azure DevOps',
      location: 'Azure Korea Central',
      uptime: '90 days'
    }),
    onClick: (server: Server) => console.log('Azure:', server.name),
    variant: 'detailed'
  }
};

export const GCPServer: Story = {
  args: {
    server: createMockServer({
      name: 'GCP Analytics',
      location: 'GCP asia-northeast3',
      uptime: '45 days'
    }),
    onClick: (server: Server) => console.log('GCP:', server.name),
    variant: 'detailed'
  }
}; 