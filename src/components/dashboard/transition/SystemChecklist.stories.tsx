/**
 * SystemChecklist Stories
 * 
 * 🔧 SystemChecklist Component v3.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SystemChecklist } from './SystemChecklist';

const meta: Meta<typeof SystemChecklist> = {
  title: '📊 Dashboard/SystemChecklist',
  component: SystemChecklist,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SystemChecklist Component**

🔧 SystemChecklist Component v3.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<SystemChecklist />
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
        story: 'SystemChecklist의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 SystemChecklist입니다.',
      },
    },
  },
};
