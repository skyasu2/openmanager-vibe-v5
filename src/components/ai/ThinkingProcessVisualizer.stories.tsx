/**
 * ThinkingProcessVisualizer Stories
 * 
 * ThinkingProcessVisualizer Component
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ThinkingProcessVisualizer } from './ThinkingProcessVisualizer';

const meta: Meta<typeof ThinkingProcessVisualizer> = {
  title: '🤖 AI Components/ThinkingProcessVisualizer',
  component: ThinkingProcessVisualizer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ThinkingProcessVisualizer Component**

ThinkingProcessVisualizer Component

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ThinkingProcessVisualizer />
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
        story: 'ThinkingProcessVisualizer의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ThinkingProcessVisualizer입니다.',
      },
    },
  },
};
