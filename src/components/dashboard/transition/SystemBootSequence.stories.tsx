/**
 * SystemBootSequence Stories
 * 
 * 🚀 SystemBootSequence Component v2.1 - 호환성 개선
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SystemBootSequence } from './SystemBootSequence';

const meta: Meta<typeof SystemBootSequence> = {
  title: '📊 Dashboard/SystemBootSequence',
  component: SystemBootSequence,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SystemBootSequence Component**

🚀 SystemBootSequence Component v2.1 - 호환성 개선

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<SystemBootSequence />
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
        story: 'SystemBootSequence의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 SystemBootSequence입니다.',
      },
    },
  },
};
