/**
 * SmoothTransition Stories
 * 
 * 🌊 SmoothTransition Component v1.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SmoothTransition } from './SmoothTransition';

const meta: Meta<typeof SmoothTransition> = {
  title: '📊 Dashboard/SmoothTransition',
  component: SmoothTransition,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SmoothTransition Component**

🌊 SmoothTransition Component v1.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<SmoothTransition />
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
        story: 'SmoothTransition의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 SmoothTransition입니다.',
      },
    },
  },
};
