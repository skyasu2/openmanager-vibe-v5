/**
 * ProgressLabel Stories
 * 
 * 📝 ProgressLabel Component
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgressLabel } from './ProgressLabel';

const meta: Meta<typeof ProgressLabel> = {
  title: '📊 Dashboard/ProgressLabel',
  component: ProgressLabel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ProgressLabel Component**

📝 ProgressLabel Component

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ProgressLabel />
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
        story: 'ProgressLabel의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ProgressLabel입니다.',
      },
    },
  },
};
