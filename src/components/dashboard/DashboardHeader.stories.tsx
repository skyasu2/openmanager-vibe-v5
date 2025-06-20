import type { Meta, StoryObj } from '@storybook/react';
import DashboardHeader from './DashboardHeader';

/**
 * DashboardHeader는 OpenManager 애플리케이션의 메인 헤더 컴포넌트입니다.
 *
 * ## 주요 기능
 * - 브랜드 로고 및 네비게이션
 * - AI 어시스턴트 토글 기능
 * - 실시간 시간 표시
 * - 환경 정보 표시
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
  onNavigateHome={() => console.log('Home clicked')}
  onToggleAgent={() => console.log('Agent toggled')}
  isAgentOpen={false}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onNavigateHome: {
      description: '홈 버튼 클릭 핸들러',
      action: 'navigateHome',
    },
    onToggleAgent: {
      description: 'AI 어시스턴트 토글 핸들러',
      action: 'toggleAgent',
    },
    isAgentOpen: {
      description: 'AI 어시스턴트 열림 상태',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 상태
export const Default: Story = {
  args: {
    isAgentOpen: false,
  },
};

// AI 어시스턴트 활성화 상태
export const AgentActive: Story = {
  args: {
    isAgentOpen: true,
  },
};

// 모바일 뷰 시뮬레이션
export const MobileView: Story = {
  args: {
    isAgentOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// 태블릿 뷰 시뮬레이션
export const TabletView: Story = {
  args: {
    isAgentOpen: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
