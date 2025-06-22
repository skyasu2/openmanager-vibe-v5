/**
 * ServerDetailModal Stories
 * 
 * ServerDetailModal 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ServerDetailModal } from './ServerDetailModal';

const meta: Meta<typeof ServerDetailModal> = {
  title: '📊 Dashboard/ServerDetailModal',
  component: ServerDetailModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ServerDetailModal Component**

ServerDetailModal 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ServerDetailModal />
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
        story: 'ServerDetailModal의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ServerDetailModal입니다.',
      },
    },
  },
};
