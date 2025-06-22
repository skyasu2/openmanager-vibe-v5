/**
 * AIAgentIconPanel Stories
 * 
 * 🤖 AI 에이전트 기능 아이콘 패널
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AIAgentIconPanel } from './AIAgentIconPanel';

const meta: Meta<typeof AIAgentIconPanel> = {
  title: '🤖 AI Components/AIAgentIconPanel',
  component: AIAgentIconPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**AIAgentIconPanel Component**

🤖 AI 에이전트 기능 아이콘 패널

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<AIAgentIconPanel />
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
        story: 'AIAgentIconPanel의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 AIAgentIconPanel입니다.',
      },
    },
  },
};
