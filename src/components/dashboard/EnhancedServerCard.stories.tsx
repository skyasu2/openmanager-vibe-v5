/**
 * EnhancedServerCard Stories
 * 
 * 🌟 Enhanced Server Card v4.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { EnhancedServerCard } from './EnhancedServerCard';

const meta: Meta<typeof EnhancedServerCard> = {
  title: '📊 Dashboard/EnhancedServerCard',
  component: EnhancedServerCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**EnhancedServerCard Component**

🌟 Enhanced Server Card v4.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<EnhancedServerCard />
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
        story: 'EnhancedServerCard의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 EnhancedServerCard입니다.',
      },
    },
  },
};
