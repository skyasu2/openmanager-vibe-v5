/**
 * EnhancedAIChatPage Stories
 * 
 * 🚀 자연어 질의 페이지
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { EnhancedAIChatPage } from './EnhancedAIChatPage';

const meta: Meta<typeof EnhancedAIChatPage> = {
  title: '🤖 AI Components/EnhancedAIChatPage',
  component: EnhancedAIChatPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**EnhancedAIChatPage Component**

🚀 자연어 질의 페이지

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<EnhancedAIChatPage />
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
        story: 'EnhancedAIChatPage의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 EnhancedAIChatPage입니다.',
      },
    },
  },
};
