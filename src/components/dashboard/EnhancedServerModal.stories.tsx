/**
 * EnhancedServerModal Stories
 * 
 * 🚀 Enhanced Server Detail Modal v3.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { EnhancedServerModal } from './EnhancedServerModal';

const meta: Meta<typeof EnhancedServerModal> = {
  title: '📊 Dashboard/EnhancedServerModal',
  component: EnhancedServerModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**EnhancedServerModal Component**

🚀 Enhanced Server Detail Modal v3.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<EnhancedServerModal />
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
        story: 'EnhancedServerModal의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 EnhancedServerModal입니다.',
      },
    },
  },
};
