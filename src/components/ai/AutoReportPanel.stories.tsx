/**
 * AutoReportPanel Stories
 * 
 * 📄 자동 장애 보고서 조회 패널 컴포넌트 (사이드 패널용)
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AutoReportPanel } from './AutoReportPanel';

const meta: Meta<typeof AutoReportPanel> = {
  title: '🤖 AI Components/AutoReportPanel',
  component: AutoReportPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**AutoReportPanel Component**

📄 자동 장애 보고서 조회 패널 컴포넌트 (사이드 패널용)

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<AutoReportPanel />
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
        story: 'AutoReportPanel의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 AutoReportPanel입니다.',
      },
    },
  },
};
