/**
 * ServerDetailLogs Stories
 * 
 * ServerDetailLogs 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ServerDetailLogs } from './ServerDetailLogs';

const meta: Meta<typeof ServerDetailLogs> = {
  title: '📊 Dashboard/ServerDetailLogs',
  component: ServerDetailLogs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ServerDetailLogs Component**

ServerDetailLogs 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ServerDetailLogs />
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
        story: 'ServerDetailLogs의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ServerDetailLogs입니다.',
      },
    },
  },
};
