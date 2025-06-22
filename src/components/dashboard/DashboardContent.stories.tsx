/**
 * DashboardContent Stories
 * 
 * 대시보드 메인 콘텐츠 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import DashboardContent from './DashboardContent';

const meta: Meta<typeof DashboardContent> = {
  title: '📊 Dashboard/DashboardContent',
  component: DashboardContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**DashboardContent Component**

대시보드의 메인 콘텐츠 영역을 담당하는 컴포넌트입니다.

### 주요 기능
- 서버 카드 그리드 표시
- 실시간 데이터 업데이트
- 반응형 레이아웃
- 로딩 상태 관리

### 사용 예시
\`\`\`tsx
<DashboardContent />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 대시보드',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '대시보드의 기본 상태입니다. 서버 카드들과 실시간 메트릭을 표시합니다.',
      },
    },
  },
};

export const Loading: Story = {
  name: '로딩 상태',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '데이터를 불러오는 중인 상태의 대시보드입니다.',
      },
    },
  },
};
