/**
 * Input Stories
 * 
 * 입력 필드 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: '🎨 UI Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Input Component**

기본 입력 필드 컴포넌트입니다.

### 주요 기능
- 다양한 입력 타입 지원
- 플레이스홀더 및 라벨 지원
- 유효성 검사 상태 표시
- 접근성 준수

### 사용 예시
\`\`\`tsx
<Input placeholder="이름을 입력하세요" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 입력 필드',
  args: {
    placeholder: '텍스트를 입력하세요',
  },
};

export const Email: Story = {
  name: '이메일 입력',
  args: {
    type: 'email',
    placeholder: 'example@email.com',
  },
};

export const Password: Story = {
  name: '비밀번호 입력',
  args: {
    type: 'password',
    placeholder: '비밀번호를 입력하세요',
  },
};

export const Disabled: Story = {
  name: '비활성화된 입력',
  args: {
    placeholder: '비활성화된 필드',
    disabled: true,
  },
};
