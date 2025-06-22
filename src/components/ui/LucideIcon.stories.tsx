/**
 * LucideIcon Stories
 * 
 * Font Awesome 클래스를 Lucide React 아이콘으로 자동 변환하는 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { LucideIcon } from './LucideIcon';

const meta: Meta<typeof LucideIcon> = {
  title: '🎨 UI Components/LucideIcon',
  component: LucideIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**LucideIcon Component**

Font Awesome 클래스를 Lucide React 아이콘으로 자동 변환하는 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<LucideIcon />
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
        story: 'LucideIcon의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 LucideIcon입니다.',
      },
    },
  },
};
