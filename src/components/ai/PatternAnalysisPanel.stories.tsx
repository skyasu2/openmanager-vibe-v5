/**
 * PatternAnalysisPanel Stories
 * 
 * 📊 패턴 분석 조회 패널 컴포넌트 (사이드 패널용)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { PatternAnalysisPanel } from './PatternAnalysisPanel';

const meta: Meta<typeof PatternAnalysisPanel> = {
  title: '🤖 AI Components/PatternAnalysisPanel',
  component: PatternAnalysisPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**PatternAnalysisPanel Component**

📊 패턴 분석 조회 패널 컴포넌트 (사이드 패널용)

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<PatternAnalysisPanel />
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
        story: 'PatternAnalysisPanel의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 PatternAnalysisPanel입니다.',
      },
    },
  },
};
