/**
 * PredictionDashboard Stories
 * 
 * 🧠 PredictionDashboard - 장애 예측 분석 대시보드
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { PredictionDashboard } from './PredictionDashboard';

const meta: Meta<typeof PredictionDashboard> = {
  title: 'Components/PredictionDashboard',
  component: PredictionDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**PredictionDashboard Component**

🧠 PredictionDashboard - 장애 예측 분석 대시보드

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<PredictionDashboard />
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
        story: 'PredictionDashboard의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 PredictionDashboard입니다.',
      },
    },
  },
};
