/**
 * inlineFeedbackManager Stories
 * 
 * 🎯 Inline Feedback System
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { inlineFeedbackManager } from './InlineFeedbackSystem';

const meta: Meta<typeof inlineFeedbackManager> = {
  title: '🎨 UI Components/inlineFeedbackManager',
  component: inlineFeedbackManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**inlineFeedbackManager Component**

🎯 Inline Feedback System

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<inlineFeedbackManager />
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
        story: 'inlineFeedbackManager의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 inlineFeedbackManager입니다.',
      },
    },
  },
};
