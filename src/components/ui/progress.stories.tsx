/**
 * Progress Stories
 * 
 * 진행률 표시 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: '🎨 UI Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Progress Component**

작업의 진행률을 시각적으로 표시하는 컴포넌트입니다.

### 주요 기능
- 0-100% 진행률 표시
- 부드러운 애니메이션
- 다양한 크기 지원
- 접근성 준수

### 사용 예시
\`\`\`tsx
<Progress value={65} className="w-[60%]" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '진행률 (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 진행률',
  args: {
    value: 65,
    className: 'w-[60%]',
  },
};

export const Empty: Story = {
  name: '시작 상태',
  args: {
    value: 0,
    className: 'w-[60%]',
  },
};

export const Complete: Story = {
  name: '완료 상태',
  args: {
    value: 100,
    className: 'w-[60%]',
  },
};

export const Loading: Story = {
  name: '로딩 중',
  args: {
    value: 45,
    className: 'w-[60%]',
  },
  parameters: {
    docs: {
      description: {
        story: '파일 업로드나 데이터 처리 중인 상태를 나타냅니다.',
      },
    },
  },
};

export const Different_Sizes: Story = {
  name: '다양한 크기',
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div>
        <p className="text-sm mb-2">작은 크기</p>
        <Progress value={33} className="h-2" />
      </div>
      <div>
        <p className="text-sm mb-2">기본 크기</p>
        <Progress value={66} />
      </div>
      <div>
        <p className="text-sm mb-2">큰 크기</p>
        <Progress value={88} className="h-6" />
      </div>
    </div>
  ),
};
