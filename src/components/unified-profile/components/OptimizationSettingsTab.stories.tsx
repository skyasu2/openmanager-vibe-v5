/**
 * OptimizationSettingsTab Stories
 * 
 * ⚡ 최적화 설정 탭 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { OptimizationSettingsTab } from './OptimizationSettingsTab';

const meta: Meta<typeof OptimizationSettingsTab> = {
  title: 'Components/OptimizationSettingsTab',
  component: OptimizationSettingsTab,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**OptimizationSettingsTab Component**

⚡ 최적화 설정 탭 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<OptimizationSettingsTab />
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
        story: 'OptimizationSettingsTab의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 OptimizationSettingsTab입니다.',
      },
    },
  },
};
