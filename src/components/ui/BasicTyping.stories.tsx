/**
 * BasicTyping Stories
 * 
 * 🎯 CSS 타이핑 효과 컴포넌트 - Vercel 안정형
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { BasicTyping } from './BasicTyping';

const meta: Meta<typeof BasicTyping> = {
  title: '🎨 UI Components/BasicTyping',
  component: BasicTyping,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**BasicTyping Component**

🎯 CSS 타이핑 효과 컴포넌트 - Vercel 안정형

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<BasicTyping />
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
        story: 'BasicTyping의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 BasicTyping입니다.',
      },
    },
  },
};
