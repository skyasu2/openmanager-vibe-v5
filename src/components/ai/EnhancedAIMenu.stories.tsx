/**
 * EnhancedAIMenu Stories
 * 
 * 🎨 Enhanced AI Menu Component
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { EnhancedAIMenu } from './EnhancedAIMenu';

const meta: Meta<typeof EnhancedAIMenu> = {
  title: '🤖 AI Components/EnhancedAIMenu',
  component: EnhancedAIMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**EnhancedAIMenu Component**

🎨 Enhanced AI Menu Component

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<EnhancedAIMenu />
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
        story: 'EnhancedAIMenu의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 EnhancedAIMenu입니다.',
      },
    },
  },
};
