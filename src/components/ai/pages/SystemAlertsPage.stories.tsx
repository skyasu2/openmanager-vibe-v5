/**
 * SystemAlertsPage Stories
 * 
 * 🚨 System Alerts Page
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { SystemAlertsPage } from './SystemAlertsPage';

const meta: Meta<typeof SystemAlertsPage> = {
  title: '🤖 AI Components/SystemAlertsPage',
  component: SystemAlertsPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**SystemAlertsPage Component**

🚨 System Alerts Page

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<SystemAlertsPage />
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
        story: 'SystemAlertsPage의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 SystemAlertsPage입니다.',
      },
    },
  },
};
