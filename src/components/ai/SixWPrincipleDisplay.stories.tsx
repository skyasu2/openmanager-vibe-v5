/**
 * SixWPrincipleDisplay Stories
 * 
 * SixWPrincipleDisplay Component
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SixWPrincipleDisplay } from './SixWPrincipleDisplay';

const meta: Meta<typeof SixWPrincipleDisplay> = {
  title: '🤖 AI Components/SixWPrincipleDisplay',
  component: SixWPrincipleDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SixWPrincipleDisplay Component**

SixWPrincipleDisplay Component

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<SixWPrincipleDisplay />
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
        story: 'SixWPrincipleDisplay의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 SixWPrincipleDisplay입니다.',
      },
    },
  },
};
