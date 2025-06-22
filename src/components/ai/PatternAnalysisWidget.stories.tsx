/**
 * PatternAnalysisWidget Stories
 * 
 * 🤖 AI 패턴 분석 위젯 - Phase 1 연동
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { PatternAnalysisWidget } from './PatternAnalysisWidget';

const meta: Meta<typeof PatternAnalysisWidget> = {
  title: '🤖 AI Components/PatternAnalysisWidget',
  component: PatternAnalysisWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**PatternAnalysisWidget Component**

🤖 AI 패턴 분석 위젯 - Phase 1 연동

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<PatternAnalysisWidget />
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
        story: 'PatternAnalysisWidget의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 PatternAnalysisWidget입니다.',
      },
    },
  },
};
