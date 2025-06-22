/**
 * CircularGauge Stories
 * 
 * CircularGauge 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CircularGauge } from './CircularGauge';

const meta: Meta<typeof CircularGauge> = {
  title: '📊 Dashboard/CircularGauge',
  component: CircularGauge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**CircularGauge Component**

CircularGauge 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<CircularGauge />
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
        story: 'CircularGauge의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 CircularGauge입니다.',
      },
    },
  },
};
