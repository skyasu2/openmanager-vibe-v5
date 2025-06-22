/**
 * ActionButtons Stories
 * 
 * 🔘 ActionButtons Component v2.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ActionButtons } from './ActionButtons';

const meta: Meta<typeof ActionButtons> = {
  title: '📊 Dashboard/ActionButtons',
  component: ActionButtons,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ActionButtons Component**

🔘 ActionButtons Component v2.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ActionButtons />
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
        story: 'ActionButtons의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ActionButtons입니다.',
      },
    },
  },
};
