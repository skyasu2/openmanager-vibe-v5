/**
 * AgentLogPanel Stories
 * 
 * 🔄 AI 에이전트 로그 조회 패널 컴포넌트 (사이드 패널용)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AgentLogPanel } from './AgentLogPanel';

const meta: Meta<typeof AgentLogPanel> = {
  title: '🤖 AI Components/AgentLogPanel',
  component: AgentLogPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**AgentLogPanel Component**

🔄 AI 에이전트 로그 조회 패널 컴포넌트 (사이드 패널용)

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<AgentLogPanel />
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
  name: '기본 상태',
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'AgentLogPanel의 기본 상태입니다.',
      },
    },
  },
};

export const Interactive: Story = {
  name: '인터랙티브',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '사용자 상호작용을 테스트할 수 있는 AgentLogPanel입니다.',
      },
    },
  },
};
