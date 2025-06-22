/**
 * GoogleAIStatusCard Stories
 * 
 * 🤖 Google AI 상태 카드 컴포넌트 - 통합 버전
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { GoogleAIStatusCard } from './GoogleAIStatusCard';

const meta: Meta<typeof GoogleAIStatusCard> = {
  title: '🔗 Shared/GoogleAIStatusCard',
  component: GoogleAIStatusCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**GoogleAIStatusCard Component**

🤖 Google AI 상태 카드 컴포넌트 - 통합 버전

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<GoogleAIStatusCard />
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
        story: 'GoogleAIStatusCard의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 GoogleAIStatusCard입니다.',
      },
    },
  },
};
