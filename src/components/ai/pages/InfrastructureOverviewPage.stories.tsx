/**
 * InfrastructureOverviewPage Stories
 * 
 * 🎛️ Infrastructure Overview Page
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { InfrastructureOverviewPage } from './InfrastructureOverviewPage';

const meta: Meta<typeof InfrastructureOverviewPage> = {
  title: '🤖 AI Components/InfrastructureOverviewPage',
  component: InfrastructureOverviewPage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**InfrastructureOverviewPage Component**

🎛️ Infrastructure Overview Page

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<InfrastructureOverviewPage />
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
        story: 'InfrastructureOverviewPage의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 InfrastructureOverviewPage입니다.',
      },
    },
  },
};
