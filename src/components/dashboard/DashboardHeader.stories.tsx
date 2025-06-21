import type { Meta, StoryObj } from '@storybook/nextjs';
import DashboardHeader from './DashboardHeader';

const meta: Meta<typeof DashboardHeader> = {
  title: 'Dashboard/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '대시보드 헤더 컴포넌트 - AI 어시스턴트 토글, 실시간 정보, 프로필을 포함합니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 상태',
  args: {
    onNavigateHome: () => console.log('홈으로 이동'),
    onToggleAgent: () => console.log('AI 에이전트 토글'),
    isAgentOpen: false,
  },
};

export const AgentOpen: Story = {
  name: 'AI 에이전트 열림',
  args: {
    onNavigateHome: () => console.log('홈으로 이동'),
    onToggleAgent: () => console.log('AI 에이전트 토글'),
    isAgentOpen: true,
  },
};

export const Interactive: Story = {
  name: '인터랙티브',
  args: {
    onNavigateHome: () => alert('홈으로 이동'),
    onToggleAgent: () => alert('AI 에이전트 토글'),
    isAgentOpen: false,
  },
};

export const MinimalView: Story = {
  name: '최소 뷰',
  args: {
    onNavigateHome: () => console.log('홈으로 이동'),
  },
  parameters: {
    docs: {
      description: {
        story: 'AI 에이전트 기능 없이 최소한의 헤더만 표시합니다.',
      },
    },
  },
};

export const ResponsiveTest: Story = {
  name: '반응형 테스트',
  args: {
    onNavigateHome: () => console.log('홈으로 이동'),
    onToggleAgent: () => console.log('AI 에이전트 토글'),
    isAgentOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 환경에서의 헤더 표시를 테스트합니다.',
      },
    },
  },
};
