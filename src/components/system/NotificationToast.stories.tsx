/**
 * NotificationToast Stories
 * 
 * 🔔 알림 토스트 컴포넌트 (전역 시스템 연동)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { NotificationToast } from './NotificationToast';

const meta: Meta<typeof NotificationToast> = {
  title: '⚙️ System/NotificationToast',
  component: NotificationToast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**NotificationToast Component**

🔔 알림 토스트 컴포넌트 (전역 시스템 연동)

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<NotificationToast />
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
        story: 'NotificationToast의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 NotificationToast입니다.',
      },
    },
  },
};
