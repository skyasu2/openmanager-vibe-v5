/**
 * Accordion Stories
 * 
 * 아코디언 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: '🎨 UI Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Accordion Component**

접을 수 있는 콘텐츠 섹션을 제공하는 아코디언 컴포넌트입니다.

### 주요 기능
- 여러 섹션의 접기/펼치기 기능
- 키보드 네비게이션 지원
- 접근성 준수 (ARIA 속성)
- 애니메이션 효과

### 사용 예시
\`\`\`tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>섹션 1</AccordionTrigger>
    <AccordionContent>
      첫 번째 섹션의 내용입니다.
    </AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: '아코디언 타입 (단일/다중 선택)',
    },
    collapsible: {
      control: 'boolean',
      description: '모든 항목을 접을 수 있는지 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 아코디언',
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>첫 번째 섹션</AccordionTrigger>
        <AccordionContent>
          이것은 첫 번째 섹션의 내용입니다. 여기에 다양한 정보를 포함할 수 있습니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>두 번째 섹션</AccordionTrigger>
        <AccordionContent>
          두 번째 섹션에는 다른 정보가 들어갑니다. 각 섹션은 독립적으로 접고 펼칠 수 있습니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>세 번째 섹션</AccordionTrigger>
        <AccordionContent>
          마지막 섹션입니다. 아코디언은 콘텐츠를 효율적으로 구성하는 데 유용합니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'single',
    collapsible: true,
  },
};

export const Multiple: Story = {
  name: '다중 선택 아코디언',
  render: (args) => (
    <Accordion {...args} className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>FAQ 1</AccordionTrigger>
        <AccordionContent>
          자주 묻는 질문의 첫 번째 답변입니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>FAQ 2</AccordionTrigger>
        <AccordionContent>
          두 번째 자주 묻는 질문의 답변입니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'multiple',
  },
};
