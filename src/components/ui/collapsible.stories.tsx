/**
 * Collapsible Stories
 * 
 * 접을 수 있는 콘텐츠 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta: Meta<typeof Collapsible> = {
  title: '🎨 UI Components/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Collapsible Component**

접을 수 있는 콘텐츠 섹션을 제공하는 컴포넌트입니다.

### 주요 기능
- 콘텐츠 접기/펼치기 기능
- 부드러운 애니메이션 효과
- 키보드 네비게이션 지원
- 접근성 준수

### 사용 예시
\`\`\`tsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button>펼치기/접기</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>접을 수 있는 콘텐츠입니다.</p>
  </CollapsibleContent>
</Collapsible>
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
  name: '기본 접기/펼치기',
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <span className="sr-only">Toggle</span>
            ▼
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const WithCustomTrigger: Story = {
  name: '커스텀 트리거',
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-left hover:bg-gray-200">
        <span className="font-medium">자주 묻는 질문</span>
        <span className="text-gray-500">+</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border p-4">
        <p className="text-sm text-gray-600">
          여기에 자주 묻는 질문에 대한 답변이 들어갑니다.
          사용자가 트리거를 클릭하면 이 내용이 표시됩니다.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
