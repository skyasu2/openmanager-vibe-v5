/**
 * Select Stories
 * 
 * 선택 드롭다운 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const meta: Meta<typeof Select> = {
  title: '🎨 UI Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Select Component**

드롭다운 형태의 선택 컴포넌트입니다.

### 주요 기능
- 다중 옵션 선택
- 검색 기능 지원
- 키보드 네비게이션
- 접근성 준수

### 사용 예시
\`\`\`tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
  </SelectContent>
</Select>
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
  name: '기본 선택',
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="테마를 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">라이트</SelectItem>
        <SelectItem value="dark">다크</SelectItem>
        <SelectItem value="system">시스템</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  name: '그룹이 있는 선택',
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="서버를 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="web-01">Web Server 01</SelectItem>
        <SelectItem value="web-02">Web Server 02</SelectItem>
        <SelectItem value="db-01">Database Server 01</SelectItem>
        <SelectItem value="db-02">Database Server 02</SelectItem>
        <SelectItem value="cache-01">Cache Server 01</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  name: '비활성화된 선택',
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="비활성화됨" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">옵션 1</SelectItem>
        <SelectItem value="option2">옵션 2</SelectItem>
      </SelectContent>
    </Select>
  ),
};
