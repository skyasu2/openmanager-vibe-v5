/**
 * RealTimeThinkingViewer Stories
 * 
 * 🧠 실시간 AI 사고 과정 뷰어 v2.0 (관리자 전용)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { RealTimeThinkingViewer } from './RealTimeThinkingViewer';

const meta: Meta<typeof RealTimeThinkingViewer> = {
  title: '🤖 AI Components/RealTimeThinkingViewer',
  component: RealTimeThinkingViewer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**RealTimeThinkingViewer Component**

🧠 실시간 AI 사고 과정 뷰어 v2.0 (관리자 전용)

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<RealTimeThinkingViewer />
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
        story: 'RealTimeThinkingViewer의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 RealTimeThinkingViewer입니다.',
      },
    },
  },
};
