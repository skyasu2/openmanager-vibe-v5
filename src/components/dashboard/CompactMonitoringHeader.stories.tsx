/**
 * CompactMonitoringHeader Stories
 * 
 * 📊 컴팩트 모니터링 헤더 - UI 리팩토링 v1.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CompactMonitoringHeader } from './CompactMonitoringHeader';

const meta: Meta<typeof CompactMonitoringHeader> = {
  title: '📊 Dashboard/CompactMonitoringHeader',
  component: CompactMonitoringHeader,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**CompactMonitoringHeader Component**

📊 컴팩트 모니터링 헤더 - UI 리팩토링 v1.0

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<CompactMonitoringHeader />
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
        story: 'CompactMonitoringHeader의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 CompactMonitoringHeader입니다.',
      },
    },
  },
};
