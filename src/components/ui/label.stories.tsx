/**
 * Label Stories
 * 
 * 라벨 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Label } from './label';

const meta: Meta<typeof Label> = {
  title: '🎨 UI Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Label Component**

폼 요소와 연결되는 라벨 컴포넌트입니다.

### 주요 기능
- 폼 요소와의 접근성 연결
- 다양한 스타일 지원
- 필수/선택 표시
- 반응형 디자인

### 사용 예시
\`\`\`tsx
<Label htmlFor="email">이메일 주소</Label>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    htmlFor: {
      control: 'text',
      description: '연결할 폼 요소의 ID',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 라벨',
  args: {
    children: '사용자 이름',
    htmlFor: 'username',
  },
};

export const Required: Story = {
  name: '필수 라벨',
  render: () => (
    <Label htmlFor="required-field">
      이메일 주소 <span className="text-red-500">*</span>
    </Label>
  ),
};

export const WithInput: Story = {
  name: '입력 필드와 함께',
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="example-input">비밀번호</Label>
      <input
        id="example-input"
        type="password"
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="비밀번호를 입력하세요"
      />
    </div>
  ),
};

export const Disabled: Story = {
  name: '비활성화된 라벨',
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-input" className="text-gray-400">
        비활성화된 필드
      </Label>
      <input
        id="disabled-input"
        type="text"
        disabled
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
        placeholder="비활성화됨"
      />
    </div>
  ),
};
