import type { Meta, StoryObj } from '@storybook/react';
import DashboardHeader from './DashboardHeader';

/**
 * DashboardHeader는 OpenManager 애플리케이션의 메인 헤더 컴포넌트입니다.
 * 
 * ## 주요 기능
 * - 브랜드 로고 및 네비게이션
 * - 실시간 서버 통계 표시
 * - AI 에이전트 토글 기능
 * - 시스템 상태 모니터링
 * 
 * ## 반응형 지원
 * - 모바일: 간소화된 레이아웃
 * - 태블릿: 중간 크기 최적화
 * - 데스크탑: 전체 기능 표시
 */
const meta: Meta<typeof DashboardHeader> = {
  title: 'Dashboard/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### DashboardHeader 컴포넌트

메인 대시보드의 헤더 영역을 담당하는 컴포넌트입니다.

#### 특징
- **React.memo** 최적화 적용
- **접근성(A11y)** 표준 준수
- **반응형 디자인** 지원
- **실시간 데이터** 표시

#### 사용 예제
\`\`\`tsx
<DashboardHeader
  serverStats={{ total: 10, online: 8, warning: 1, offline: 1 }}
  onNavigateHome={() => console.log('Home clicked')}
  onToggleAgent={() => console.log('Agent toggled')}
  isAgentOpen={false}
  systemStatusDisplay={<div>시스템 상태</div>}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    serverStats: {
      description: '서버 통계 데이터',
      control: 'object',
    },
    onNavigateHome: {
      description: '홈 버튼 클릭 핸들러',
      action: 'navigateHome',
    },
    onToggleAgent: {
      description: 'AI 에이전트 토글 핸들러',
      action: 'toggleAgent',
    },
    isAgentOpen: {
      description: 'AI 에이전트 열림 상태',
      control: 'boolean',
    },
    systemStatusDisplay: {
      description: '시스템 상태 표시 컴포넌트',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 상태
export const Default: Story = {
  args: {
    serverStats: {
      total: 10,
      online: 8,
      warning: 1,
      offline: 1,
    },
    isAgentOpen: false,
    systemStatusDisplay: (
      <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
        ✅ 시스템 정상 운영 중
      </div>
    ),
  },
};

// AI 에이전트 활성화 상태
export const AgentActive: Story = {
  args: {
    ...Default.args,
    isAgentOpen: true,
  },
};

// 서버 문제 상황
export const ServerIssues: Story = {
  args: {
    serverStats: {
      total: 15,
      online: 7,
      warning: 5,
      offline: 3,
    },
    isAgentOpen: false,
    systemStatusDisplay: (
      <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
        ⚠️ 서버 장애 감지됨
      </div>
    ),
  },
};

// 대량 서버 환경
export const LargeScale: Story = {
  args: {
    serverStats: {
      total: 100,
      online: 85,
      warning: 10,
      offline: 5,
    },
    isAgentOpen: true,
    systemStatusDisplay: (
      <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
        🔄 시스템 최적화 진행 중
      </div>
    ),
  },
};

// 빈 상태
export const EmptyState: Story = {
  args: {
    serverStats: {
      total: 0,
      online: 0,
      warning: 0,
      offline: 0,
    },
    isAgentOpen: false,
    systemStatusDisplay: (
      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
        🔧 시스템 초기화 중
      </div>
    ),
  },
};

// 시스템 일시정지 상태
export const SystemPaused: Story = {
  args: {
    serverStats: {
      total: 12,
      online: 12,
      warning: 0,
      offline: 0,
    },
    isAgentOpen: false,
    systemStatusDisplay: (
      <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded flex items-center gap-2">
        ⏸️ 시스템 일시정지
        <button className="text-xs text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded">
          재개
        </button>
      </div>
    ),
  },
}; 